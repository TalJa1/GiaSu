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
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Colors from '../../constants/Colors';
import { getAllQuizlets } from '../../apis/quizletApi';
import {
  getAllLessons,
  createLessonTracking,
  getLessonsWithUserTracking,
} from '../../apis/lessonApi';
import { Quizlet } from '../../apis/models';
import type { Lesson as LessonModel } from '../../apis/models';
// Using custom view-based grouped bars (no external chart lib required for this widget)

const { width } = Dimensions.get('window');

import { useNavigation } from '@react-navigation/native';

export type LessonProps = {
  lesson: LessonModel;
};

export const Lesson: React.FC<LessonProps> = ({ lesson }) => {
  return (
    <View style={[styles.quizletCard, { width: '100%', padding: 18 }]}>
      <Text style={[styles.quizletTitle, { fontSize: 18 }]}>
        {lesson.title ?? `Lesson ${lesson.id}`}
      </Text>

      <Text style={[styles.quizletMeta, { marginTop: 6 }]} numberOfLines={4}>
        {lesson.description ?? lesson.content ?? 'No description available.'}
      </Text>

      <View style={{ marginTop: 10 }}>
        {lesson.subject ? (
          <Text style={styles.quizletMeta}>Subject: {lesson.subject}</Text>
        ) : null}
        {lesson.content_url ? (
          <Text style={styles.quizletMeta}>URL: {lesson.content_url}</Text>
        ) : null}
        {lesson.created_by ? (
          <Text style={styles.quizletMeta}>Author id: {lesson.created_by}</Text>
        ) : null}
        {lesson.created_at ? (
          <Text style={styles.quizletMeta}>Created: {lesson.created_at}</Text>
        ) : null}
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={[styles.quizletMeta, { color: Colors.text.secondary }]}>
          Raw data:
        </Text>
        <Text style={[styles.quizletMeta, { fontSize: 12 }]} numberOfLines={6}>
          {JSON.stringify(lesson, null, 2)}
        </Text>
      </View>
    </View>
  );
};

const Study: React.FC = () => {
  const navigation = useNavigation();
  const [quizlets, setQuizlets] = useState<Quizlet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lessons, setLessons] = useState<LessonModel[]>([]);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [showAllLessons, setShowAllLessons] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

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
  }, [currentUserId]);

  useEffect(() => {
    let mounted = true;
    const loadOneLesson = async () => {
      setLessonLoading(true);
      try {
        // fetch multiple lessons (limit 50). If we have a current user, request lessons with tracking
        let items: LessonModel[] = [];
        if (currentUserId) {
          try {
            items = (await getLessonsWithUserTracking(currentUserId)) ?? [];
          } catch (_e) {
            // fallback to general lessons
            items = (await getAllLessons(0, 50)) ?? [];
          }
        } else {
          items = (await getAllLessons(0, 50)) ?? [];
        }
        if (!mounted) return;
        setLessons(items ?? []);
      } catch (err: any) {
        if (!mounted) return;
        setLessonError(err?.message ?? 'Failed to load lessons');
      } finally {
        if (mounted) setLessonLoading(false);
      }
    };
    loadOneLesson();
    return () => {
      mounted = false;
    };
  }, [currentUserId]);

  // load current user id from AsyncStorage
  useEffect(() => {
    let mounted = true;
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem('user');
        if (!mounted || !stored) return;
        const parsed = JSON.parse(stored);
        const id = parsed?.id ?? null;
        if (id) setCurrentUserId(Number(id));
      } catch (e) {
        // ignore
      }
    };
    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  // NOTE: we now prefer `getLessonsWithUserTracking` which returns an `isLearned` flag

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
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.main} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Study</Text>
      </View>

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

        <View style={{ marginTop: 18 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.panelTitle}>Lessons</Text>
            <TouchableOpacity
              onPress={() => setShowAllLessons(s => !s)}
              activeOpacity={0.8}
            >
              <Text style={styles.seeAll}>
                {showAllLessons ? 'Show less' : 'Show all'}
              </Text>
            </TouchableOpacity>
          </View>

          {lessonLoading ? (
            <ActivityIndicator style={{ marginTop: 12 }} />
          ) : lessonError ? (
            <Text style={styles.errorText}>{lessonError}</Text>
          ) : lessons.length === 0 ? (
            <Text style={{ marginTop: 8, color: Colors.text.secondary }}>
              No lesson data available.
            </Text>
          ) : (
            <FlatList
              data={showAllLessons ? lessons : lessons.slice(0, 3)}
              horizontal
              keyExtractor={l => String(l.id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.lessonCard,
                    { width: Math.min(320, width * 0.75) },
                  ]}
                >
                  <View style={styles.lessonHeader}>
                    <View style={styles.iconWrap}>
                      <Icon name="book" size={18} color={Colors.primary.main} />
                    </View>
                    <Text style={styles.lessonTitle} numberOfLines={2}>
                      {item.title ?? `Lesson ${item.id}`}
                    </Text>
                  </View>

                  <Text style={styles.lessonDescription} numberOfLines={3}>
                    {item.description ?? 'No description available.'}
                  </Text>

                  <View style={{ width: '100%', marginTop: 12 }}>
                    <TouchableOpacity
                      style={
                        item?.isLearned
                          ? [styles.learnButton, styles.learnedButton]
                          : styles.learnButton
                      }
                      activeOpacity={0.85}
                      onPress={async () => {
                        const lid = Number(item.id ?? 0);
                        const uid = currentUserId;
                        const already = !!item?.isLearned;
                        if (!uid) {
                          // no user, just navigate
                          (navigation as any).navigate('LessonDetail', {
                            lessonId: item.id,
                          });
                          return;
                        }
                        if (already) {
                          // already learned; just navigate
                          (navigation as any).navigate('LessonDetail', {
                            lessonId: item.id,
                          });
                          return;
                        }
                        // create tracking then navigate
                        try {
                          await createLessonTracking({
                            user_id: uid,
                            lesson_id: lid,
                            is_finished: false,
                          });
                          // update local lessons array to mark this lesson as learned
                          setLessons(prev =>
                            prev.map(s =>
                              s.id === lid ? { ...s, isLearned: true } : s,
                            ),
                          );
                        } catch (e) {
                          // ignore failures but still navigate
                        }
                        (navigation as any).navigate('LessonDetail', {
                          lessonId: item.id,
                        });
                      }}
                    >
                      <Text
                        style={
                          item?.isLearned
                            ? [styles.learnButtonText, styles.learnedButtonText]
                            : styles.learnButtonText
                        }
                      >
                        {item?.isLearned ? 'Learned' : 'Learn'}
                      </Text>
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
    height: 56,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  headerTitle: { color: Colors.text.white, fontWeight: '700', fontSize: 18 },
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
  // lesson card styles
  lessonCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 14,
    padding: 14,
    marginRight: 14,
    minHeight: 120,
    // subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    justifyContent: 'flex-start',
  },
  lessonHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.ui.disabled,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text.primary,
    flex: 1,
  },
  lessonDescription: {
    marginTop: 4,
    color: Colors.text.secondary,
    fontSize: 13,
  },
  learnButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  learnButtonText: { color: Colors.text.white, fontWeight: '800' },
  learnedButton: { backgroundColor: Colors.status.success },
  learnedButtonText: { color: Colors.text.white },
});
