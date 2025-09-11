import {
  StyleSheet,
  Text,
  ScrollView,
  View,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import testResultApi from '../../apis/testResultApi';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import testApi from '../../apis/testApi';
import { TestItem } from '../../apis/models';

const Exam = () => {
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [progressData, setProgressData] = useState<{
    user_id?: number;
    tests_taken?: number;
    total_tests?: number;
    percent?: number;
  } | null>(null);
  const [resultsHistory, setResultsHistory] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingProgress(true);
      try {
        const stored = await AsyncStorage.getItem('user');
        const parsed = stored ? JSON.parse(stored) : null;
        const uid = parsed?.id ?? parsed?.user_id ?? null;
        if (!uid) {
          if (mounted) setProgressData(null);
          return;
        }
        const resp = await testResultApi.getUserProgress(Number(uid));
        if (!mounted) return;
        setProgressData(resp ?? null);
      } catch (e) {
        if (mounted) setProgressData(null);
      } finally {
        if (mounted) setLoadingProgress(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const navigation = useNavigation<any>();

  const [tests, setTests] = useState<TestItem[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [completedTestIds, setCompletedTestIds] = useState<Set<number>>(
    new Set(),
  );
  const [expandedTests, setExpandedTests] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingTests(true);
      try {
        const items = await testApi.getTests();
        if (!mounted) return;
        setTests(items);
        // try to load user's result history and derive completed tests
        try {
          const stored = await AsyncStorage.getItem('user');
          const parsed = stored ? JSON.parse(stored) : null;
          const uid = parsed?.id ?? parsed?.user_id ?? null;
          if (uid) {
            const resp = await testResultApi.getResultHistory(Number(uid));
            const resultsArray = Array.isArray(resp)
              ? resp
              : resp?.items ?? resp?.results ?? [];
            const ids = new Set<number>();
            for (const r of resultsArray) {
              const tid = r?.test_id ?? r?.test?.id ?? r?.testId ?? r?.testId;
              if (typeof tid === 'number') ids.add(tid);
            }
            if (mounted) {
              setCompletedTestIds(ids);
              setResultsHistory(resultsArray);
            }
          }
        } catch (err) {
          // ignore per-test result fetch errors
        }
      } catch (e) {
        if (!mounted) return;
        setTests([]);
      } finally {
        if (mounted) setLoadingTests(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary.main}
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exam</Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.groupContainer}>
          <View style={styles.progressPanel}>
            <View style={styles.chartWrapper}>
              {loadingProgress ? (
                <ActivityIndicator />
              ) : progressData ? (
                <View style={styles.chartCard}>
                  <AnimatedCircularProgress
                    size={96}
                    width={10}
                    fill={progressData.percent ?? 0}
                    tintColor={Colors.primary.main}
                    backgroundColor={Colors.ui.divider}
                  >
                    {() => (
                      <View style={styles.circleInner}>
                        <Text style={styles.circlePercent}>{`${Math.round(
                          progressData.percent ?? 0,
                        )}%`}</Text>
                      </View>
                    )}
                  </AnimatedCircularProgress>
                </View>
              ) : (
                <View style={styles.emptyChart}>
                  <Text style={{ color: Colors.text.secondary }}>
                    No data available
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.infoColumn}>
              {loadingProgress ? (
                <Text style={styles.infoLabel}>Loading…</Text>
              ) : progressData ? (
                <>
                  <View style={styles.infoCard}>
                    <View style={styles.iconWrapSmall}>
                      <Icon
                        name="book-open-page-variant"
                        size={18}
                        color={Colors.primary.main}
                      />
                    </View>
                    <View style={styles.infoTextWrap}>
                      <Text style={styles.infoLabel}>Tests completed</Text>
                      <Text style={styles.infoValue}>
                        {progressData.tests_taken ?? 0}/
                        {progressData.total_tests ?? 0}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoCard}>
                    <View style={styles.iconWrapSmall}>
                      <Icon
                        name="chart-donut"
                        size={18}
                        color={Colors.primary.main}
                      />
                    </View>
                    <View style={styles.infoTextWrap}>
                      <Text style={styles.infoLabel}>Average score</Text>
                      <Text style={styles.infoValue}>{`${Math.round(
                        progressData.percent ?? 0,
                      )}%`}</Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={styles.infoLabel}>No progress available</Text>
              )}
            </View>
          </View>
        </View>

        {/* Tests list rendered under the chart container */}
        <View style={styles.testsSection}>
          <View style={styles.testsHeader}>
            <Text style={styles.sectionTitle}>Notable Tests</Text>
            {tests.length > 3 && (
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setExpandedTests(s => !s)}
              >
                <Text style={styles.toggleText}>
                  {expandedTests ? 'Show less' : 'Show more'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        

          {loadingTests ? (
            <ActivityIndicator />
          ) : tests.length === 0 ? (
            <Text style={{ color: Colors.text.secondary }}>No tests found</Text>
          ) : (
            <>
              {(expandedTests ? tests : tests.slice(0, 3)).map(
                (t: TestItem) => (
                  <View key={t.id} style={styles.testCard}>
                    <View style={styles.testLeft}>
                      <Text style={styles.testTitle}>{t.title}</Text>
                      {t.description ? (
                        <Text style={styles.testDescription}>
                          {t.description}
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.testRight}>
                      <View style={styles.durationWrap}>
                        <Icon
                          name="clock-outline"
                          size={14}
                          color={Colors.primary.main}
                        />
                        <Text style={styles.durationText}>
                          {(t as any).duration ?? '30m'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.testButton}
                        onPress={() =>
                          navigation.navigate('TestRunner', { testId: t.id })
                        }
                      >
                        <Text style={styles.testButtonText}>
                          {completedTestIds.has(t.id)
                            ? 'Test again'
                            : "Let's test"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ),
              )}
            </>
          )}
        </View>

        {/* Add your exam content here - tests, quizzes, practice exams, etc. */}
        
        {/* History - horizontal list of completed tests (outside Notable Tests) */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>History</Text>
          {resultsHistory.length === 0 ? (
            <Text style={styles.emptyText}>No history yet</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.historyList}
            >
              {resultsHistory.map((r: any) => {
                const tid = r?.test_id ?? r?.test?.id ?? r?.testId;
                const testItem: TestItem | undefined = r?.test ?? tests.find(t => t.id === tid);
                return (
                  <View key={r.id ?? tid} style={styles.historyCard}>
                    <Text style={styles.testTitle}>{testItem?.title ?? `Test ${tid}`}</Text>
                    {testItem?.description ? (
                      <Text style={styles.testDescription}>{testItem.description}</Text>
                    ) : null}
                    <View style={styles.durationWrap}>
                      <Icon name="clock-outline" size={14} color={Colors.primary.main} />
                      <Text style={styles.durationText}>{(r as any).duration ?? (testItem as any)?.duration ?? '30m'}</Text>
                    </View>
                    <TouchableOpacity style={styles.testButton} onPress={() => navigation.navigate('TestRunner', { test: (testItem ?? ({ id: tid, title: (testItem as any)?.title ?? `Test ${tid}` } as any)) })}>
                      <Text style={styles.testButtonText}>Let's test</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default Exam;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  header: {
    height: 56,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  headerTitle: {
    color: Colors.text.white,
    fontSize: 18,
    fontWeight: '700',
  },
  progressPanel: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  groupContainer: {
    // single container shadow for the grouped elements
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 0,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 12,
  },
  chartWrapper: { width: 140, alignItems: 'center', justifyContent: 'center' },
  svgWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChart: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoColumn: { flex: 1, paddingLeft: 12 },
  infoLabel: { color: Colors.text.secondary, fontSize: 14 },
  infoValue: { color: Colors.text.primary, fontWeight: '700', marginTop: 6 },
  infoRow: { marginBottom: 12 },
  chartCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: { alignItems: 'center', justifyContent: 'center' },
  circlePercent: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    // shadow removed; container holds the shadow now
  },
  iconWrapSmall: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.ui.disabled,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTextWrap: { flex: 1 },
  testsSection: { marginTop: 18 },
  testsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  testCard: {
    backgroundColor: Colors.background.primary,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  testLeft: { flex: 1, paddingRight: 8 },
  testRight: { justifyContent: 'center', alignItems: 'flex-end' },
  durationWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  durationText: { marginLeft: 6, color: Colors.text.secondary, fontSize: 12 },
  testTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  testDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  testButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    // alignSelf removed; using layout to push button to the end
  },
  testButtonText: { color: Colors.text.white, fontWeight: '600' },
  toggleButton: { marginTop: 6, alignSelf: 'flex-start' },
  toggleText: { color: Colors.primary.main, fontWeight: '600' },
  historySection: { marginTop: 18 },
  historyList: { paddingVertical: 6 },
  historyCard: {
    width: 200,
    backgroundColor: Colors.background.primary,
    padding: 12,
    borderRadius: 10,
    marginRight: 12,
  },
  emptyText: { color: Colors.text.secondary, marginTop: 6 },
});
