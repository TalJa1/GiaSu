import {
  StyleSheet,
  Text,
  ActivityIndicator,
  View,
  FlatList,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTrackingByUser } from '../../apis/lessonApi';
import { TrackingEntry } from '../../apis/models';
import Colors from '../../constants/Colors';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<TrackingEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem('user');
        if (!stored) {
          setError('No user found');
          setLoading(false);
          return;
        }
        const parsed = JSON.parse(stored);
        const userId = parsed?.id;
        if (!userId) {
          setError('Invalid user');
          setLoading(false);
          return;
        }
        const res = await getTrackingByUser(userId, 0, 100);
        if (!mounted) return;
        setEntries(res.items || []);
      } catch (e: any) {
        setError('Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const renderItem = ({ item }: { item: TrackingEntry }) => (
    <View style={styles.card}>
      <Text style={styles.itemTitle}>Lesson: {item.lesson_id ?? 'N/A'}</Text>
      <Text style={styles.itemText}>Status: {item.status ?? 'unknown'}</Text>
      <Text style={styles.itemSmall}>{item.created_at ?? ''}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Trang Chủ</Text>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary.main} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={i => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.contentContainer}
          ListEmptyComponent={
            <Text style={styles.empty}>No tracking entries</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default Home;

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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
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
});
