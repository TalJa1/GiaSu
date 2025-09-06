import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Image,
  Pressable,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getTrackingByUser,
  getLessonsCount,
  getTrackingEntriesByUser,
} from '../../apis/lessonApi';
import { CreateUserResponse, TrackingEntry } from '../../apis/models';
import { getUserPref } from '../../apis/userPreferencesApi';
import Colors from '../../constants/Colors';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

const { width } = Dimensions.get('window');

const getRoleColor = (role?: string) => {
  if (!role) return Colors.primary.main;
  const r = role.toLowerCase();
  if (r.includes('admin')) return Colors.status.error;
  if (r.includes('gia su') || r.includes('tutor') || r.includes('teacher'))
    return Colors.primary.dark;
  if (r.includes('student')) return Colors.primary.light;
  return Colors.primary.main;
};

const Home = () => {
  const [_loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<TrackingEntry[]>([]);
  const [_error, _setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<CreateUserResponse>({
    id: 0,
    username: '',
    email: '',
    role: '',
    image_url: '',
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [notifications, _setNotifications] = useState<string[]>([]);
  const [userPref, _setUserPref] = useState<any | null>(null);
  const [lessonTotal, setLessonTotal] = useState<number | null>(null);
  const [lessonTrackedCount, setLessonTrackedCount] = useState<number | null>(
    null,
  );
  const anim = React.useRef(new Animated.Value(0)).current; // 0 hidden, 1 visible
  React.useEffect(() => {
    if (modalVisible) {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible, anim]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem('user');
        if (!stored) {
          setLoading(false);
          return;
        }
        const parsed = JSON.parse(stored);
        setUserData(parsed);
        const userId = parsed?.id;
        if (!userId) {
          setLoading(false);
          return;
        }
        const res = await getTrackingByUser(userId, 0, 100);
        console.log('Fetched tracking entries:', res);
        if (!mounted) return;
        setEntries(res.items || []);

        // Try to load user's preference. First check common fields on stored user
        try {
          let pref = null as any;
          const prefId = userData.id;
          if (prefId) {
            pref = await getUserPref(Number(prefId));
          } else {
            // fallback: try listing prefs for user via query endpoint /prefs?user_id={userId}
            try {
              const listRes: any = await (
                await import('../../apis/axiosClient')
              ).default.get(`/prefs?user_id=${userId}`);
              const items = listRes?.data;
              if (Array.isArray(items) && items.length > 0) pref = items[0];
            } catch (e) {
              // ignore fallback errors
              console.log('prefs list fallback failed', e);
            }
          }

          if (pref && mounted) {
            _setUserPref(pref);
          }
        } catch (e) {
          console.log('failed to load user pref', e);
        }
        // load lesson counts: total lessons and tracked by this user
        try {
          const [totalRes, trackedItems] = await Promise.all([
            getLessonsCount(),
            getTrackingEntriesByUser(userId, 0, 1000),
          ]);
          if (mounted) {
            setLessonTotal(Number(totalRes) || 0);
            setLessonTrackedCount(
              Array.isArray(trackedItems) ? trackedItems.length : 0,
            );
          }
        } catch (e) {
          console.log('failed to load lesson counts', e);
        }
      } catch (e: any) {
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [userData.id]);

  // preference progress: treat expected as baseline (showed as 100%) and
  // compute current as percent of expected
  const prefExpected = userPref ? Number(userPref.expected_score) || 100 : 100;
  const prefCurrent = userPref ? Number(userPref.current_score) || 0 : 0;
  const prefPercent =
    prefExpected > 0
      ? Math.min(100, Math.round((prefCurrent / prefExpected) * 100))
      : 0;

  const lessonTotalSafe = lessonTotal && lessonTotal > 0 ? lessonTotal : 0;
  const lessonTrackedSafe = lessonTrackedCount ?? 0;
  const lessonPercent =
    lessonTotalSafe > 0
      ? Math.min(100, Math.round((lessonTrackedSafe / lessonTotalSafe) * 100))
      : 0;

  const sampleCards = entries.length
    ? entries
    : [
        {
          id: '1',
          date: '01/09/2025',
          title: 'Điểm tuyển sinh đại học 2025',
          summary: 'tyuiop[sdfghjklasdqwertyuiop',
        },
        {
          id: '2',
          date: '01/09/2025',
          title: 'Điểm tuyển sinh đại học 2025',
          summary: 'tyuiop[sdfghjklasdqwertyuiop',
        },
      ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header Row with small icons */}
        <View style={styles.headerRow}>
          {userData?.image_url ? (
            <Image
              source={{ uri: userData.image_url }}
              style={styles.avatarSmall}
            />
          ) : (
            <Icon
              name="account-circle"
              size={26}
              color={Colors.primary.main}
              style={styles.headerIcon}
            />
          )}

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => {
                if (!modalVisible) {
                  setModalVisible(true);
                } else {
                  // animate out then hide
                  Animated.timing(anim, {
                    toValue: 0,
                    duration: 220,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                  }).start(() => {
                    setModalVisible(false);
                  });
                }
              }}
              activeOpacity={0.8}
            >
              <Icon
                name="bell-outline"
                size={22}
                color={Colors.text.primary}
                style={styles.headerIcon}
              />
            </TouchableOpacity>
            <Modal
              transparent
              visible={modalVisible}
              animationType="none"
              onRequestClose={() => setModalVisible(false)}
            >
              <Pressable
                style={styles.backdrop}
                onPress={() => {
                  Animated.timing(anim, {
                    toValue: 0,
                    duration: 220,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                  }).start(() => setModalVisible(false));
                }}
              />

              <Animated.View
                style={[
                  styles.animatedDialog,
                  {
                    transform: [
                      {
                        translateY: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-400, 0],
                        }),
                      },
                    ],
                    opacity: anim,
                  },
                ]}
              >
                <View style={styles.dialogHeader}>
                  <Text style={styles.dialogTitle}>Notifications</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Animated.timing(anim, {
                        toValue: 0,
                        duration: 220,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                      }).start(() => setModalVisible(false));
                    }}
                  >
                    <Icon
                      name="close"
                      size={20}
                      color={Colors.text.secondary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.dialogBody}>
                  {notifications.length === 0 ? (
                    <Text style={styles.noNotiText}>No notifications</Text>
                  ) : (
                    notifications.map((n, i) => (
                      <View key={i} style={styles.notificationItem}>
                        <Text style={styles.notificationText}>{n}</Text>
                      </View>
                    ))
                  )}
                </View>
              </Animated.View>
            </Modal>
          </View>
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerTextWrap}>
            <Text style={styles.welcomeText}>Welcome to GiaSu</Text>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>
                {userData?.username || 'Guest'}
              </Text>
              <View
                style={[
                  styles.roleChip,
                  { borderColor: getRoleColor(userData?.role) },
                ]}
              >
                <Text
                  style={[
                    styles.roleChipText,
                    { color: getRoleColor(userData?.role) },
                  ]}
                >
                  {userData?.role || 'N/A'}
                </Text>
              </View>
            </View>
            <Text style={styles.smallText}>{userData?.email || ''}</Text>
          </View>
        </View>

        {/* Preference progress (current vs expected) */}
        {userPref ? (
          <View style={styles.prefProgressCard}>
            <Text style={styles.itemSmall}>Goal Tracking</Text>
            <Text style={styles.prefTitle}>{userPref.preferred_major}</Text>
            <View style={styles.progressRow}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[styles.progressBarFill, { width: `${prefPercent}%` }]}
                />
              </View>
              <Text style={styles.progressText}>{prefPercent}% / 100%</Text>
            </View>
          </View>
        ) : null}

        {/* Circular progress for lessons: tracked vs total (moved under Goal Tracking) */}
        {lessonTotal !== null && lessonTrackedCount !== null ? (
          <View style={styles.prefCircleCard}>
            <Text style={styles.itemSmall}>Lessons progress</Text>
            <View style={styles.circleWrap}>
              <AnimatedCircularProgress
                size={96}
                width={10}
                fill={lessonPercent}
                tintColor={Colors.primary.main}
                backgroundColor={Colors.ui.divider}
              >
                {() => (
                  <View style={styles.circleInner}>
                    <Text style={styles.circlePercent}>{lessonPercent}%</Text>
                  </View>
                )}
              </AnimatedCircularProgress>
            </View>
          </View>
        ) : null}

        {/* Shortcuts */}
        <View style={styles.shortcutsContainer}>
          <TouchableOpacity style={styles.shortcut} activeOpacity={0.8}>
            <Text style={styles.shortcutText}>study shortcut</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcut} activeOpacity={0.8}>
            <Text style={styles.shortcutText}>take exam shortcut</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcut} activeOpacity={0.8}>
            <Text style={styles.shortcutText}>see schools shortcut</Text>
          </TouchableOpacity>
        </View>

        {/* What's new today */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>What’s new today?</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.newsScroll}
          contentContainerStyle={styles.newsContainer}
        >
          {sampleCards.map((c: any, idx: number) => (
            <View
              key={c.id ?? idx}
              style={[styles.newsCard, { width: Math.min(280, width * 0.7) }]}
            >
              <Text style={styles.newsDate}>{c.date}</Text>
              <Text style={styles.newsTitle}>{c.title}</Text>
              <Text style={styles.newsSummary} numberOfLines={5}>
                {c.summary || 'No summary available'}
              </Text>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create<any>({
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: { fontSize: 20 },
  banner: {
    backgroundColor: Colors.ui.shadow,
    height: 140,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 16,
    marginBottom: 14,
  },
  bannerLeft: { marginRight: 12 },
  bannerRight: { flex: 1 },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 10 },
  avatarSmall: { width: 36, height: 36, borderRadius: 18 },
  welcomeText: { color: Colors.text.placeholder, fontSize: 12 },
  nameText: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  smallText: { color: Colors.text.secondary, marginTop: 4, fontSize: 13 },
  rowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginTop: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    justifyContent: 'space-between',
    width: '100%',
  },
  roleChip: {
    prefCircleCard: {
      backgroundColor: Colors.background.card,
      padding: 12,
      borderRadius: 8,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: Colors.ui.border,
      alignItems: 'center',
    },
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  roleChipText: {
    color: Colors.background.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  bannerText: { color: Colors.text.secondary },
  bannerTextWrap: { flex: 1 },
  animatedDialog: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 80,
    backgroundColor: Colors.background.primary,
    borderRadius: 10,
    padding: 16,
    elevation: 8,
    shadowColor: Colors.ui.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: Colors.opacity.low,
    shadowRadius: 12,
  },
  headerRight: { alignItems: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  notificationDropdown: {
    position: 'absolute',
    right: 0,
    top: 36,
    width: 220,
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
    padding: 10,
    shadowColor: Colors.ui.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Colors.opacity.low,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  noNotiText: {
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  notificationItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  notificationText: { color: Colors.text.primary },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dialogTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  dialogBody: { maxHeight: 360 },
  shortcutsContainer: { marginBottom: 16 },
  shortcut: {
    backgroundColor: Colors.background.card,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  shortcutText: { fontWeight: '600' },
  sectionHeaderRow: { marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  newsScroll: { marginTop: 8 },
  newsContainer: { paddingRight: 20 },
  newsCard: {
    backgroundColor: Colors.background.primary,
    marginRight: 12,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    shadowColor: Colors.ui.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Colors.opacity.low,
    shadowRadius: 6,
    elevation: 2,
  },
  newsDate: { fontSize: 12, color: Colors.text.placeholder, marginBottom: 6 },
  newsTitle: { fontWeight: '700', marginBottom: 6 },
  newsSummary: { color: Colors.text.secondary, fontSize: 13 },
  card: {
    backgroundColor: Colors.background.card,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 12,
    marginBottom: 12,
    shadowColor: Colors.ui.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Colors.opacity.low,
    shadowRadius: 6,
    elevation: 2,
  },
  itemTitle: { fontWeight: '600', marginBottom: 6 },
  itemText: { color: Colors.text.secondary },
  itemSmall: { color: Colors.text.placeholder, marginTop: 6, fontSize: 12 },
  error: { color: Colors.status.error, textAlign: 'center', marginTop: 20 },
  empty: { textAlign: 'center', marginTop: 20, color: Colors.text.secondary },
  prefProgressCard: {
    backgroundColor: Colors.background.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  prefTitle: { fontWeight: '700', marginBottom: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBarBackground: {
    flex: 1,
    height: 12,
    backgroundColor: Colors.ui.divider,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary.main,
  },
  progressText: { marginLeft: 8, color: Colors.text.secondary, minWidth: 80 },
  circleWrap: { alignItems: 'center', marginBottom: 16 },
  circleInner: { alignItems: 'center', justifyContent: 'center' },
  circlePercent: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  circleSmall: { fontSize: 12, color: Colors.text.secondary, marginTop: 4 },
});
