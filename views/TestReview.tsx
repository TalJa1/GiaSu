import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Colors from '../constants/Colors';
import { TestItem, TestQuestion } from '../apis/models';
import testApi from '../apis/testApi';

// A read-only review view for a completed test.
// Expects route.params.test (optional full TestItem) and route.params.testId (optional id)
// and route.params.result which should contain an `answers` array with { question_id, user_answer }
export default function TestReview({ route, navigation }: any) {
  const initialTest: TestItem | null = route.params?.test ?? null;
  const routeTestId = route.params?.testId ?? route.params?.id ?? undefined;
  const result: any = route.params?.result ?? null;

  const [test, setTest] = useState<TestItem | null>(initialTest);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // selections: map question id -> array of selected option keys (e.g. ['A','C'])
  const [selections, setSelections] = useState<Record<number, string[]>>({});

  const questions = test?.questions ?? [];

  // load test by id if necessary
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (test) return;
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

  // initialize selections from result.answers when available
  useEffect(() => {
    if (!result || !Array.isArray(result.answers)) return;
    const map: Record<number, string[]> = {};
    for (const a of result.answers) {
      const qid = a?.question_id ?? a?.questionId ?? a?.question?.id;
      const ans = Array.isArray(a?.user_answer)
        ? a.user_answer.map((s: any) => String(s))
        : [];
      if (typeof qid === 'number') map[qid] = ans;
    }
    setSelections(map);
  }, [result]);

  const [finishing, setFinishing] = useState(false);

  const handleFinish = () => {
    if (finishing) return;
    setFinishing(true);
    // show loading briefly then navigate back
    setTimeout(() => {
      try {
        navigation?.goBack();
      } finally {
        setFinishing(false);
      }
    }, 600);
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

  const isMultiple = (q: TestQuestion | undefined) => {
    if (!q) return false;
    const t = (q.question_type ?? '').toString().toLowerCase();
    if (t.includes('multi')) return true;
    if (t.includes('multiple')) return true;
    if (t.includes('checkbox')) return true;
    return false;
  };

  // For review we do not allow changes — render static option blocks but mark selected ones
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
                        <View
                          style={[
                            styles.optionButton,
                            selected.includes('A') && styles.optionSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.option,
                              selected.includes('A') &&
                                styles.optionSelectedText,
                            ]}
                          >
                            A. {qq.option_a}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.optionCell}>
                      {qq.option_c ? (
                        <View
                          style={[
                            styles.optionButton,
                            selected.includes('C') && styles.optionSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.option,
                              selected.includes('C') &&
                                styles.optionSelectedText,
                            ]}
                          >
                            C. {qq.option_c}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.optionsRow}>
                    <View style={styles.optionCell}>
                      {qq.option_b ? (
                        <View
                          style={[
                            styles.optionButton,
                            selected.includes('B') && styles.optionSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.option,
                              selected.includes('B') &&
                                styles.optionSelectedText,
                            ]}
                          >
                            B. {qq.option_b}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.optionCell}>
                      {qq.option_d ? (
                        <View
                          style={[
                            styles.optionButton,
                            selected.includes('D') && styles.optionSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.option,
                              selected.includes('D') &&
                                styles.optionSelectedText,
                            ]}
                          >
                            D. {qq.option_d}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <Text>No questions in this test</Text>
      )}
      {/* Footer with full-width Finish button */}
      <View style={styles.footerBar}>
        <TouchableOpacity
          style={styles.footerFinish}
          onPress={handleFinish}
          disabled={finishing}
        >
          {finishing ? (
            <ActivityIndicator color={Colors.text.white} />
          ) : (
            <Text style={styles.footerFinishText}>Finish</Text>
          )}
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
  header: {
    padding: 12,
    backgroundColor: Colors.primary.main,
  },
  headerContent: { marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text.white },
  desc: { color: Colors.text.white, marginTop: 6 },
  questionsList: { flex: 1 },
  questionsListContent: { padding: 12 },
  questionCard: {
    backgroundColor: Colors.background.primary,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  questionHeader: { marginBottom: 8 },
  questionTitle: { fontSize: 14, fontWeight: '700' },
  typeText: { fontSize: 12, color: Colors.text.secondary },
  optionsGrid: { marginTop: 8 },
  optionsRow: { flexDirection: 'row', alignItems: 'stretch' },
  optionCell: { flex: 1, padding: 6 },
  optionButton: {
    borderRadius: 8,
    padding: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.ui.border,
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  optionSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: 'transparent',
  },
  optionSelectedText: { color: Colors.primary.main, fontWeight: '700' },
  option: { color: Colors.text.primary, textAlign: 'left' },
  footerBar: {
    padding: 12,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderColor: Colors.ui.border,
  },
  footerFinish: {
    backgroundColor: Colors.primary.main,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  footerFinishText: { color: Colors.text.white, fontWeight: '700' },
});
