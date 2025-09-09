import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { getUniversities } from '../apis/universityApi';

const UniversitiesList: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <FlatList
        data={items}
        keyExtractor={(i) => `${i.id ?? i.name}`}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            {item.location ? <Text style={styles.meta}>{item.location}</Text> : null}
          </View>
        )}
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
  content: { padding: 16 },
  row: { padding: 12, backgroundColor: Colors.background.primary, borderRadius: 8 },
  name: { fontWeight: '700', color: Colors.text.primary },
  meta: { color: Colors.text.secondary, marginTop: 6 },
  sep: { height: 10 },
});

const ItemSeparator = () => <View style={styles.sep} />;
