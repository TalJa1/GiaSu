/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  ScrollView,
  View,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Colors from '../../constants/Colors';
import { getAllQuizlets } from '../../apis/quizletApi';
import { Quizlet } from '../../apis/models';
// Using custom view-based grouped bars (no external chart lib required for this widget)

const { width } = Dimensions.get('window');

import { useNavigation } from '@react-navigation/native';

const Study: React.FC = () => {
  const navigation = useNavigation();
  const [quizlets, setQuizlets] = useState<Quizlet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fake user chart data (English names). score is 0-100, progress is 0-1
  const users = [
    { name: 'John', score: 88, progress: 0.75 },
    { name: 'Emily', score: 72, progress: 0.55 },
    { name: 'Tran', score: 95, progress: 0.9 },
    { name: 'Sarah', score: 64, progress: 0.4 },
    { name: 'Nguyen', score: 78, progress: 0.62 },
  ];

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const items = await getAllQuizlets(0, 50);
        if (!mounted) return;
        setQuizlets(items ?? []);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message ?? 'Failed to load quizlets');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // group quizlets by lesson_id to display sets
  const grouped = useMemo(() => {
    const map = new Map<number, Quizlet[]>();
    quizlets.forEach(q => {
      const lid = q.lesson_id ?? 0;
      const arr = map.get(lid) ?? [];
      arr.push(q);
      map.set(lid, arr);
    });
    const out: { lesson_id: number; cards: number }[] = [];
    map.forEach((arr, lesson_id) => out.push({ lesson_id, cards: arr.length }));
    return out.sort((a, b) => b.cards - a.cards);
  }, [quizlets]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Study</Text>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Student leaderboard</Text>
          <View style={styles.chartContainer}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: Colors.primary.main },
                  ]}
                />
                <Text style={styles.legendText}>Score</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: Colors.secondary.indigo },
                  ]}
                />
                <Text style={styles.legendText}>Progress</Text>
              </View>
            </View>

            <View style={styles.chartRow}>
              {users.map((u, i) => {
                const columnWidth = Math.min(
                  110,
                  Math.floor((width - 80) / users.length),
                );
                return (
                  <View
                    key={i}
                    style={[styles.chartColumn, { width: columnWidth }]}
                  >
                    <View style={styles.barsRow}>
                      <View
                        style={[
                          styles.barSingle,
                          {
                            height: `${Math.min(100, u.score)}%`,
                            backgroundColor: Colors.primary.main,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.barSingle,
                          {
                            height: `${Math.min(
                              100,
                              Math.round((u.progress ?? 0) * 100),
                            )}%`,
                            backgroundColor: Colors.secondary.indigo,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel} numberOfLines={1}>
                      {u.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={{ marginTop: 18 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.panelTitle}>Study with flashcards</Text>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 12 }} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <FlatList
              data={grouped}
              horizontal
              keyExtractor={g => String(g.lesson_id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.quizletCard,
                    { width: Math.min(280, width * 0.7) },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.quizletTitle}>
                      Quizlet for Lesson {item.lesson_id}
                    </Text>
                  </View>

                  <View style={styles.cardMetaRow}>
                    <View style={styles.metaItem}>
                      <Icon
                        name="account"
                        size={14}
                        color={Colors.text.secondary}
                        style={styles.metaIcon}
                      />
                      <Text
                        style={[
                          styles.quizletMeta,
                          { marginTop: 0, alignSelf: 'center' },
                        ]}
                      >
                        by Mr Tech
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Icon
                        name="cards"
                        size={14}
                        color={Colors.text.secondary}
                        style={styles.metaIcon}
                      />
                      <Text
                        style={[
                          styles.quizletMeta,
                          { marginTop: 0, alignSelf: 'center' },
                        ]}
                      >
                        {item.cards} cards
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      style={styles.startButton}
                      activeOpacity={0.8}
                      onPress={() =>
                        (navigation as any).navigate('Quizlet', {
                          lessonId: item.lesson_id,
                        })
                      }
                    >
                      <Text style={styles.startButtonText}>Let’s go</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      activeOpacity={0.8}
                    >
                      <Icon
                        name="play-circle-outline"
                        size={22}
                        color={Colors.primary.main}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Study;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    color: Colors.text.white,
    backgroundColor: Colors.primary.main,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: 'stretch',
  },
  panel: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  panelTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  chartsRow: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'space-between',
  },
  chartContainer: { marginTop: 12 },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  legendDot: { width: 10, height: 10, borderRadius: 6, marginRight: 8 },
  legendText: { fontSize: 12, color: Colors.text.secondary },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  chartColumn: { flex: 1, alignItems: 'center', marginHorizontal: 6 },
  bars: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barsRow: {
    width: '100%',
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barSingle: { width: '48%', borderRadius: 6, marginBottom: 6 },
  bar: { width: '48%', borderRadius: 6, marginBottom: 6 },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    width: 220,
  },
  userTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.ui.disabled,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userName: { fontWeight: '700', color: Colors.text.primary },
  userMeta: { fontSize: 12, color: Colors.text.secondary, marginTop: 2 },
  userScore: { fontWeight: '800', color: Colors.primary.main },
  progressWrap: { marginTop: 10 },
  progressBarBg: {
    backgroundColor: Colors.ui.disabled,
    height: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: { height: 8, backgroundColor: Colors.primary.main },
  progressLabel: { marginTop: 6, fontSize: 12, color: Colors.text.secondary },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAll: { color: Colors.primary.main, fontWeight: '700' },
  errorText: { color: Colors.status.error, marginTop: 8 },
  carousel: { paddingVertical: 12 },
  quizletCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 14,
    padding: 16,
    marginRight: 14,
    minHeight: 140,
    width: 260,
    // shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    // elevation for Android
    elevation: 4,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  quizletTitle: {
    fontWeight: '800',
    color: Colors.text.primary,
    fontSize: 16,
    marginBottom: 8,
  },
  quizletMeta: { color: Colors.text.secondary, marginTop: 6, fontSize: 13 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    width: '100%',
  },
  cardIcon: { marginRight: 8, alignSelf: 'center' },
  cardMetaRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', width: '48%' },
  metaIcon: { marginRight: 6, alignSelf: 'center' },
  cardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  startButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  startButtonText: { color: Colors.text.white, fontWeight: '700' },
  iconButton: { padding: 8 },
});
