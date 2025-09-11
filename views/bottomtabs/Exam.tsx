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
import AsyncStorage from '@react-native-async-storage/async-storage';
import testResultApi from '../../apis/testResultApi';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Exam = () => {
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [progressData, setProgressData] = useState<{
    user_id?: number;
    tests_taken?: number;
    total_tests?: number;
    percent?: number;
  } | null>(null);

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
                  Không có dữ liệu
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
                    <Text style={styles.infoLabel}>Tổng số bài đã làm</Text>
                    <Text style={styles.infoValue}>
                      {progressData.tests_taken ?? 0}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <View style={styles.iconWrapSmall}>
                    <Icon
                      name="format-list-bulleted"
                      size={18}
                      color={Colors.primary.main}
                    />
                  </View>
                  <View style={styles.infoTextWrap}>
                    <Text style={styles.infoLabel}>Tổng số bài</Text>
                    <Text style={styles.infoValue}>
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
                    <Text style={styles.infoLabel}>Điểm trung bình</Text>
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

        {/* Add your exam content here - tests, quizzes, practice exams, etc. */}
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
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
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
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
});
