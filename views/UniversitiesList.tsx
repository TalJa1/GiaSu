import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Colors from '../constants/Colors';
import { getUniversities } from '../apis/universityApi';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const UniversitiesList: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getUniversities({ skip: 0, limit: 100 });
        if (!mounted) return;
        setItems(data ?? []);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message ?? 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <ActivityIndicator style={styles.loading} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sectionHeaderRow}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={22} color={Colors.text.white} />
        </TouchableOpacity>
        <Text style={styles.sectionTitleCentered}>Universities</Text>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={items}
        keyExtractor={i => `${i.id ?? i.name}`}
        renderItem={({ item }) => {
          const s = item.scores && item.scores.length ? item.scores[0] : null;
          return (
            <TouchableOpacity activeOpacity={0.9} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardIconWrap}>
                  <Icon name="school" size={20} color={Colors.primary.main} />
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                  </View>
                  {item.type ? (
                    <Text style={styles.cardType}>{item.type}</Text>
                  ) : null}
                  {item.location ? (
                    <Text style={styles.cardMeta}>{item.location}</Text>
                  ) : null}
                  {item.description ? (
                    <Text numberOfLines={2} style={styles.cardDesc}>
                      {item.description}
                    </Text>
                  ) : null}

                  <View style={styles.cardFooterRow}>
                    {s ? (
                      <>
                        <Text style={styles.year}>Year: {s.year ?? '—'}</Text>
                        <View style={styles.scoreChips}>
                          <View style={styles.chipMin}>
                            <Text style={styles.chipText}>
                              Min {s.min_score ?? '—'}
                            </Text>
                          </View>
                          <View style={styles.chipAvg}>
                            <Text style={styles.chipText}>
                              Avg {s.avg_score ?? '—'}
                            </Text>
                          </View>
                          <View style={styles.chipMax}>
                            <Text style={styles.chipText}>
                              Max {s.max_score ?? '—'}
                            </Text>
                          </View>
                        </View>
                      </>
                    ) : null}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={styles.content}
      />
    </SafeAreaView>
  );
};

export default UniversitiesList;

const styles = StyleSheet.create<any>({
  container: { flex: 1, backgroundColor: Colors.background.secondary },
  loading: { marginTop: 20 },
  content: { padding: 16, paddingBottom: 40 },
  sectionHeaderRow: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  sectionTitleCentered: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.white,
    textAlign: 'center',
    flex: 1,
  },
  headerBackButton: {
    position: 'absolute',
    left: 16,
    height: '100%',
    justifyContent: 'center',
    zIndex: 10,
  },
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardIconWrap: { width: 36, alignItems: 'center', marginRight: 12 },
  cardBody: { flex: 1 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: { fontWeight: '800', color: Colors.text.primary },
  cardType: { color: Colors.text.secondary, marginTop: 2, fontSize: 12 },
  cardMeta: { color: Colors.text.secondary, marginTop: 6, fontSize: 12 },
  cardDesc: { color: Colors.text.primary, marginTop: 8 },
  cardFooterRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  sep: { height: 12 },
  errorText: { color: Colors.status.error, marginTop: 8 },
  scoreBadgeSmall: {
    backgroundColor: Colors.primary.dark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreBadgeText: { color: Colors.text.white, fontWeight: '700' },
  year: { color: Colors.text.secondary, fontSize: 12, marginRight: 8 },
  scoreChips: { flexDirection: 'row', marginLeft: 6, alignItems: 'center' },
  chipMin: {
    backgroundColor: Colors.status.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
  },
  chipAvg: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
  },
  chipMax: {
    backgroundColor: Colors.status.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  chipText: { color: Colors.text.white, fontWeight: '700', fontSize: 12 },
});

const ItemSeparator = () => <View style={styles.sep} />;
