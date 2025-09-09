import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AIApi from '../../apis/AIApi';
import UniversityPreview from '../common/UniversityPreview';
import MarkdownRenderer from '../../components/MarkdownRenderer';

const ICON_SIZE = 20;

const ItemSeparator = () => <View style={styles.separator} />;

function formatScore(score: any): string | null {
  if (score == null) return null;
  const n =
    typeof score === 'number'
      ? score
      : Number(String(score).replace('%', '').trim());
  if (Number.isNaN(n)) return null;
  if (n > 0 && n <= 1) return `${Math.round(n * 100)}%`;
  if (n > 1 && n <= 100) return `${Math.round(n)}%`;
  return String(n);
}

function tryParseArrayFromText(text: string): any[] | null {
  if (!text || typeof text !== 'string') return null;

  // 1) extract fenced code block content if present
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let candidate = codeBlockMatch ? codeBlockMatch[1].trim() : text;

  // 2) try to find a JSON array substring
  const arrMatch = candidate.match(/\[[\s\S]*\]/m);
  if (arrMatch) {
    try {
      const parsed = JSON.parse(arrMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // fallthrough to normalization
    }
  }

  // 3) normalization attempts
  const tryParseNormalized = (s: string) => {
    let t = s.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
    t = t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    t = t.replace(/'(.*?)'/g, '"$1"');
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // ignore
    }
    return null;
  };

  const parsedWhole = tryParseNormalized(candidate);
  if (parsedWhole) return parsedWhole;

  return null;
}

function normalizeRecs(
  arr: any[],
): { name: string; reason?: string; score?: number | null }[] {
  return arr
    .filter(Boolean)
    .map((it: any) => {
      if (typeof it === 'string') return { name: it };
      const name =
        it.name ||
        it.school ||
        it.university ||
        (typeof it === 'string' ? it : undefined);
      const reason =
        it.reason || it.description || it.excerpt || it.details || undefined;
      let score: number | undefined;
      if (typeof it.score === 'number') score = it.score;
      else if (typeof it.score === 'string') {
        const m = it.score.match(/([0-9]*\.?[0-9]+)/);
        if (m) score = Number(m[1]);
      }
      return { name, reason, score } as any;
    })
    .filter(r => r.name);
}

type SchoolHeaderProps = {
  interest: string;
  setInterest: (v: string) => void;
  major: string;
  setMajor: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  onSearch: () => void;
  loading: boolean;
  error: string | null;
};

const SchoolHeader: React.FC<SchoolHeaderProps> = ({
  interest,
  setInterest,
  major,
  setMajor,
  location,
  setLocation,
  onSearch,
  loading,
  error,
}) => {
  return (
    <>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Find the perfect university</Text>
        <Text style={styles.bannerSubtitle}>
          Fill in the fields below for tailored recommendations
        </Text>
      </View>

      <View style={styles.formRow}>
        <View style={styles.iconWrap}>
          <Icon
            name="lightbulb-on-outline"
            size={ICON_SIZE}
            color={Colors.primary.main}
          />
        </View>
        <TextInput
          placeholder="Interest (e.g. computation)"
          placeholderTextColor={Colors.text.placeholder}
          style={styles.input}
          value={interest}
          onChangeText={setInterest}
        />
      </View>

      <View style={styles.formRow}>
        <View style={styles.iconWrap}>
          <Icon
            name="account-school"
            size={ICON_SIZE}
            color={Colors.primary.main}
          />
        </View>
        <TextInput
          placeholder="Major (e.g. Mathematics)"
          placeholderTextColor={Colors.text.placeholder}
          style={styles.input}
          value={major}
          onChangeText={setMajor}
        />
      </View>

      <View style={styles.formRow}>
        <View style={styles.iconWrap}>
          <Icon
            name="map-marker-outline"
            size={ICON_SIZE}
            color={Colors.primary.main}
          />
        </View>
        <TextInput
          placeholder="Location (e.g. United States)"
          placeholderTextColor={Colors.text.placeholder}
          style={styles.input}
          value={location}
          onChangeText={setLocation}
        />
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.goBtn}
          onPress={onSearch}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.goText}>Go</Text>
          )}
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </>
  );
};

const MarkdownFooter: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.markdownWrap}>
    <MarkdownRenderer text={text} />
  </View>
);

const School: React.FC = () => {
  const [interest, setInterest] = useState('');
  const [major, setMajor] = useState('');
  const [location, setLocation] = useState('');
  const [limit] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [rawMarkdown, setRawMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    setError(null);
    setResults(null);
    setRawMarkdown(null);
    setLoading(true);
    try {
      const payload = { major, interests: interest, location, limit } as any;
      const recs = await AIApi.recommendUniversities(payload as any);
      if (Array.isArray(recs) && recs.length > 0) {
        setResults(recs);
        return;
      }

      // fallback: ask the generic generateText for a markdown reply
      const prompt = `Recommend ${limit} universities for major: ${major} interests: ${interest} location: ${location}. Return markdown list with name, reason and score.`;
      const gen = await AIApi.generateText({ prompt } as any);
      const out = gen?.output ?? JSON.stringify(gen?.raw ?? {}, null, 2);
      setRawMarkdown(out);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [interest, major, location, limit]);

  const renderCard = ({ item }: { item: any }) => {
    const rec = typeof item === 'string' ? { name: item } : item;
    const name = rec.name || rec.school || 'Unknown school';
    const reason =
      rec.reason || rec.description || rec.excerpt || rec.details || '';
    const scoreLabel = formatScore(rec.score ?? rec.sc ?? rec.rating);
    const subtitle = rec.subtitle || rec.country || rec.location || null;
    const tags: string[] = [];
    if (rec.major) tags.push(rec.major);
    if (rec.location) tags.push(rec.location);
    if (rec.rank) tags.push(`Rank ${rec.rank}`);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconWrapSmall}>
            <Icon name="school" size={ICON_SIZE} color={Colors.primary.main} />
          </View>

          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle}>{name}</Text>
            {subtitle ? (
              <Text style={styles.cardSubtitle}>{subtitle}</Text>
            ) : null}
            {tags.length ? (
              <View style={styles.metaRow}>
                {tags.map((t, i) => (
                  <View key={i} style={styles.chip}>
                    <Text style={styles.chipText}>{t}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {scoreLabel ? (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{scoreLabel}</Text>
            </View>
          ) : null}
        </View>

        {reason ? (
          <View style={styles.cardBody}>
            <MarkdownRenderer text={String(reason)} />
          </View>
        ) : null}
      </View>
    );
  };

  // Build the list data: prefer explicit results, otherwise parsed raw markdown, otherwise empty
  const parsedRaw = rawMarkdown ? tryParseArrayFromText(rawMarkdown) : null;
  const normalizedParsedRaw = parsedRaw ? normalizeRecs(parsedRaw) : null;
  const dataForList = results ?? normalizedParsedRaw ?? [];

  // Header is provided via props below as ListHeaderComponent

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={dataForList}
        keyExtractor={(i, idx) => `${i?.name ?? idx}`}
        renderItem={renderCard}
        ItemSeparatorComponent={ItemSeparator}
        ListHeaderComponent={
          <>
            <UniversityPreview />
            <SchoolHeader
              interest={interest}
              setInterest={setInterest}
              major={major}
              setMajor={setMajor}
              location={location}
              setLocation={setLocation}
              onSearch={handleSearch}
              loading={loading}
              error={error}
            />
          </>
        }
        ListFooterComponent={
          rawMarkdown && !normalizedParsedRaw ? (
            <MarkdownFooter text={rawMarkdown} />
          ) : undefined
        }
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default School;

const styles = StyleSheet.create<any>({
  container: { flex: 1, backgroundColor: Colors.background.secondary },
  contentContainer: { padding: 16 },
  banner: {
    backgroundColor: Colors.background.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  bannerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  bannerSubtitle: { color: Colors.text.secondary, marginTop: 6 },
  formRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  iconWrapSmall: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  input: { flex: 1, paddingVertical: 8, color: Colors.text.primary },
  actionsRow: { marginTop: 12, alignItems: 'flex-end' },
  goBtn: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  goText: { color: '#fff', fontWeight: '700' },
  error: { color: Colors.status.error, marginTop: 12 },
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    marginTop: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardTitleWrap: { flex: 1 },
  cardTitle: { fontWeight: '700', marginLeft: 8, color: Colors.text.primary },
  cardSubtitle: { color: Colors.text.secondary, marginLeft: 8, marginTop: 2 },
  metaRow: { flexDirection: 'row', marginTop: 6 },
  chip: {
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  chipText: { color: Colors.text.primary, fontSize: 12 },
  scoreBadge: {
    backgroundColor: Colors.primary.dark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: { color: Colors.text.white, fontWeight: '700' },
  cardBody: { marginTop: 8 },
  markdownWrap: {
    marginTop: 12,
    backgroundColor: Colors.background.primary,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  separator: { height: 12 },
  listContent: { paddingBottom: 60 },
});
