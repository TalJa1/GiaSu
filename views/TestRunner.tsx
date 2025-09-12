import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Colors from '../constants/Colors';
import { TestItem, TestQuestion } from '../apis/models';
import testApi from '../apis/testApi';
import testResultApi from '../apis/testResultApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<any, 'TestRunner'>;

export default function TestRunner({ route, navigation }: Props) {
  // support both legacy (full test passed) and new (testId only)
  const initialTest: TestItem | null = route.params?.test ?? null;
  const routeTestId = route.params?.testId ?? route.params?.id ?? undefined;

  const [test, setTest] = useState<TestItem | null>(initialTest);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // selections: map question id -> array of selected option keys (e.g. ['A','C'])
  const [selections, setSelections] = useState<Record<number, string[]>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  const questions = test?.questions ?? [];

  // countdown in seconds (30 minutes)
  const [secondsLeft, setSecondsLeft] = useState(30 * 60);
  const timerRef = useRef<number | null>(null);

  // start timer only when a test is loaded
  useEffect(() => {
    if (!test) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current as any);
          return 0;
        }
        return s - 1;
      });
    }, 1000) as unknown as number;

    return () => {
      if (timerRef.current) clearInterval(timerRef.current as any);
    };
  }, [test]);

  // load test by id if we only received an id
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (test) return; // already have data
      if (routeTestId == null) return;
      setLoading(true);
      setError(null);
      try {
        const resp = await testApi.getTestById(routeTestId);
        if (!mounted) return;
        if (!resp) {
          setError('Test not found');
          setTest(null);
        } else {
          setTest(resp);
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message ?? 'Failed to load test');
        setTest(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [routeTestId, test]);

  const onFinish = () => navigation.goBack();

  // When submitting: calculate score, build payload, POST result, then finish or show error
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      // Build per-question answers and compute points
      const answers: any[] = [];
      let pointsPossible = 0;
      let pointsEarned = 0;
      let correctAnswersCount = 0;

      for (const q of questions) {
        const selected = selections[q.id] ?? [];
        const correct = (q.correct_options ?? []).map((s: string) =>
          String(s).toUpperCase(),
        );
        const selNormalized = selected.map(s => String(s).toUpperCase());
        const qPoints = typeof q.points === 'number' ? q.points : 1;
        pointsPossible += qPoints;

        // helper: set equality
        const setEq = (a: string[], b: string[]) => {
          if (a.length !== b.length) return false;
          const sa = [...a].sort();
          const sb = [...b].sort();
          return sa.every((v, i) => v === sb[i]);
        };

        let isCorrect = false;
        let awarded = 0;

        if (setEq(selNormalized, correct)) {
          isCorrect = true;
          awarded = qPoints;
          correctAnswersCount += 1;
        } else {
          // partial credit: only if all selected options are subset of correct (no incorrect chosen)
          if (selNormalized.length > 0) {
            const hasIncorrect = selNormalized.some(s => !correct.includes(s));
            if (!hasIncorrect && correct.length > 0) {
              const matched = selNormalized.filter(s =>
                correct.includes(s),
              ).length;
              awarded = Number(
                ((matched / correct.length) * qPoints).toFixed(2),
              );
            }
          }
        }

        pointsEarned += awarded;

        answers.push({
          question_id: q.id,
          // backend expects a list for user_answer, always send an array
          user_answer: selNormalized,
          is_correct: isCorrect,
          partial_credit: awarded,
        });
      }

      // Score as percentage of points earned over possible (0-100)
      const score =
        pointsPossible > 0
          ? Math.round((pointsEarned / pointsPossible) * 100)
          : 0;

      // Read current user id from AsyncStorage
      const stored = await AsyncStorage.getItem('user');
      const parsed = stored ? JSON.parse(stored) : null;
      const uid = parsed?.id ?? parsed?.user_id ?? null;

      if (!uid) {
        Alert.alert('Error', 'No signed-in user found. Please log in.');
        setSubmitting(false);
        return;
      }

      const payload = {
        user_id: Number(uid),
        test_id: test?.id ?? 0,
        score,
        total_questions: questions.length,
        correct_answers: correctAnswersCount,
        points_earned: Number(
          pointsEarned.toFixed ? pointsEarned.toFixed(2) : pointsEarned,
        ),
        points_possible: Number(
          pointsPossible.toFixed ? pointsPossible.toFixed(2) : pointsPossible,
        ),
        answers,
      };

      console.log('Submitting test result payload:', payload);

      // Call API
      await testResultApi.createResult(payload as any);

      // success -> finish
      onFinish();
    } catch (err: any) {
      console.warn('Failed to submit result', err);
      Alert.alert('Error', err?.message ?? 'Failed to submit test result');
    } finally {
      setSubmitting(false);
    }
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(
    2,
    '0',
  )}`;

  const isMultiple = (q: TestQuestion | undefined) => {
    if (!q) return false;
    const t = (q.question_type ?? '').toString().toLowerCase();
    if (t.includes('multi')) return true;
    if (t.includes('multiple')) return true;
    if (t.includes('checkbox')) return true;
    return false;
  };

  const toggleSelection = (q: TestQuestion, key: string) => {
    setSelections(prev => {
      const cur = prev[q.id] ?? [];
      const multiple = isMultiple(q);
      if (multiple) {
        const exists = cur.includes(key);
        const next = exists ? cur.filter(k => k !== key) : [...cur, key];
        return { ...prev, [q.id]: next };
      } else {
        // single choice: replace
        const next = cur.includes(key) ? [] : [key];
        return { ...prev, [q.id]: next };
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>{error}</Text>
      </View>
    );
  }

  if (!test) {
    return (
      <View style={styles.center}>
        <Text>No test data provided</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{test.title}</Text>
          <Text style={styles.desc}>{test.description}</Text>
        </View>
      </View>

      {questions && questions.length > 0 ? (
        <ScrollView
          style={styles.questionsList}
          contentContainerStyle={styles.questionsListContent}
        >
          {questions.map((qq, idx) => {
            const selected = selections[qq.id] ?? [];
            const multiple = isMultiple(qq);
            return (
              <View key={qq.id ?? idx} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionTitle}>
                    Question {idx + 1}: {qq.question_text}
                    <Text style={styles.typeText}>{` (${
                      multiple ? 'multiple' : 'single'
                    })`}</Text>
                  </Text>
                </View>

                <View style={styles.optionsGrid}>
                  <View style={styles.optionsRow}>
                    <View style={styles.optionCell}>
                      {qq.option_a ? (
                        <TouchableOpacity
                          onPress={() => toggleSelection(qq, 'A')}
                          style={[
                            styles.optionButton,
                            selected.includes('A') && styles.optionSelected,
                          ]}
                        >
                          <Text style={styles.option}>A. {qq.option_a}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={styles.optionCell}>
                      {qq.option_c ? (
                        <TouchableOpacity
                          onPress={() => toggleSelection(qq, 'C')}
                          style={[
                            styles.optionButton,
                            selected.includes('C') && styles.optionSelected,
                          ]}
                        >
                          <Text style={styles.option}>C. {qq.option_c}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.optionsRow}>
                    <View style={styles.optionCell}>
                      {qq.option_b ? (
                        <TouchableOpacity
                          onPress={() => toggleSelection(qq, 'B')}
                          style={[
                            styles.optionButton,
                            selected.includes('B') && styles.optionSelected,
                          ]}
                        >
                          <Text style={styles.option}>B. {qq.option_b}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={styles.optionCell}>
                      {qq.option_d ? (
                        <TouchableOpacity
                          onPress={() => toggleSelection(qq, 'D')}
                          style={[
                            styles.optionButton,
                            selected.includes('D') && styles.optionSelected,
                          ]}
                        >
                          <Text style={styles.option}>D. {qq.option_d}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                </View>

                {/* type shown inline after question title; no separate chip rendered */}
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <Text>No questions in this test</Text>
      )}

      {/* Footer bar with timer on left and submit on right */}
      <View style={styles.footerBar}>
        <View style={styles.footerLeft}>
          <Icon name="clock-outline" size={18} color={Colors.primary.main} />
          <View style={styles.footerTimer}>
            <Text style={styles.footerTimerText}>{timeText}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleSubmit} style={styles.footerSubmit}>
          <Text style={styles.footerSubmitText}>Submit</Text>
          <Icon
            name="send"
            size={18}
            color={Colors.text.white}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCenter: { alignItems: 'center', justifyContent: 'center' },
  timerText: { fontSize: 14, fontWeight: '700', color: Colors.text.primary },
  header: {
    padding: 12,
    backgroundColor: Colors.primary.main,
  },
  headerContent: { marginBottom: 12 },
  timerChip: {
    paddingHorizontal: 14,
  },
  headerButtonPrimary: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.secondary.indigo,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitText: { color: Colors.text.white, marginLeft: 8, fontWeight: '700' },
  timerLeft: { alignItems: 'flex-start', flex: 1 },
  headerButtonSecondary: {
    padding: 8,
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  desc: { color: Colors.text.white, marginTop: 6 },
  questionCard: {
    backgroundColor: Colors.background.primary,
    padding: 14,
    marginHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
    marginBottom: 12,
  },
  questionText: { fontSize: 16, fontWeight: '600' },
  questionsList: { marginTop: 12 },
  questionHeader: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    marginBottom: 8,
  },
  questionTitle: { fontWeight: '700' },
  optionsGrid: { paddingTop: 6 },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  typeText: { color: Colors.text.secondary, fontSize: 12 },
  questionsListContent: { paddingBottom: 120 },
  footerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center' },
  footerTimer: {
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: Colors.ui.divider,
  },
  footerTimerText: { fontWeight: '700', color: Colors.text.primary },
  footerSubmit: {
    backgroundColor: Colors.secondary.indigo,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerSubmitText: { color: Colors.text.white, fontWeight: '700' },
  footerIcon: { marginLeft: 8 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  navButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navText: { color: Colors.text.white, fontWeight: '600' },
  disabled: { opacity: 0.5 },

  // Option layout: two columns, each 50% of row
  optionCell: { width: '50%', paddingHorizontal: 6 },
  optionButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 56,
    justifyContent: 'center',
    width: '100%',
    alignItems: 'flex-start',
  },
  option: { color: Colors.text.primary },
  optionSelected: {
    borderWidth: 2,
    borderColor: Colors.primary.main,
    backgroundColor: Colors.background.primary,
  },
});
