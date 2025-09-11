import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Colors from '../constants/Colors';
import { TestItem, TestQuestion } from '../apis/models';
import testApi from '../apis/testApi';
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

  const onCancel = () => navigation.goBack();
  const onFinish = () => navigation.goBack();

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
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={onCancel}
            style={styles.headerButtonSecondary}
          >
            <Icon name="close" size={20} color={Colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.timerChip}>
              <Text style={styles.timerText}>{timeText}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onFinish}
            style={styles.headerButtonPrimary}
          >
            <Icon name="check" size={20} color={Colors.text.white} />
          </TouchableOpacity>
        </View>

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
                    <Text style={styles.typeText}>{` (${multiple ? 'multiple' : 'single'})`}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.background.secondary,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerCenter: { alignItems: 'center', justifyContent: 'center' },
  timerText: { fontSize: 16, fontWeight: '700' },
  header: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: Colors.primary.light,
    borderRadius: 10,
  },
  headerContent: { marginBottom: 12 },
  timerChip: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: Colors.ui.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  headerButtonPrimary: {
    padding: 8,
    backgroundColor: Colors.primary.main,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  headerButtonSecondary: {
    padding: 8,
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  desc: { color: Colors.text.secondary, marginTop: 6 },
  questionCard: {
    backgroundColor: Colors.background.primary,
    padding: 14,
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
  optionsRow: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 8 },
  typeText: { color: Colors.text.secondary, fontSize: 12 },
  questionsListContent: { paddingBottom: 24 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  navButton: { backgroundColor: Colors.primary.main, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
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
  optionSelected: { borderWidth: 2, borderColor: Colors.primary.main, backgroundColor: Colors.background.primary },
});
