import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getUniversities } from '../../apis/universityApi';

export default function UniversityPreview() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getUniversities({ skip: 0, limit: 3 });
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

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Top universities</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Universities')}>
          <Text style={styles.more}>Show more</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        items.map(u => (
          <View key={u.id ?? u.name} style={styles.card}>
            <View style={styles.cardInner}>
              <View style={styles.iconWrapCard}>
                <Icon name="school" size={22} color={Colors.primary.main} />
              </View>
              <View style={styles.itemBody}>
                <View style={styles.titleRow}>
                  <Text style={styles.name}>{u.name}</Text>
                </View>

                {u.type ? <Text style={styles.type}>{u.type}</Text> : null}
                {u.location ? (
                  <Text style={styles.meta}>{u.location}</Text>
                ) : null}
                {u.description ? (
                  <Text numberOfLines={2} style={styles.desc}>
                    {u.description}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.cardFooter}>
              {u.scores && u.scores.length
                ? (() => {
                    const s = u.scores[0];
                    return (
                      <>
                        <Text style={styles.year}>Year: {s.year ?? '—'}</Text>
                        <View style={styles.scoreChips}>
                          <View style={styles.chipMin}>
                            <Text style={styles.chipText}>
                              Min {s.min_score ?? '—'}
                            </Text>
                          </View>
                          <View style={styles.chipAvg}>
                            <Text style={styles.chipText}>
                              Avg {s.avg_score ?? '—'}
                            </Text>
                          </View>
                          <View style={styles.chipMax}>
                            <Text style={styles.chipText}>
                              Max {s.max_score ?? '—'}
                            </Text>
                          </View>
                        </View>
                      </>
                    );
                  })()
                : null}
              {u.website ? (
                <Text style={styles.small}> • {u.website}</Text>
              ) : null}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create<any>({
  wrap: {
    marginBottom: 12,
    padding: 14,
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { fontWeight: '800', color: Colors.text.primary, fontSize: 20 },
  more: { color: Colors.primary.main, fontWeight: '700' },
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    // shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    // elevation for Android
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  cardInner: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrapCard: { width: 40, alignItems: 'center', marginRight: 12 },
  itemBody: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreBadge: {
    backgroundColor: Colors.primary.dark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: { color: Colors.text.white, fontWeight: '700' },
  year: { color: Colors.text.secondary, fontSize: 12, marginRight: 8 },
  scoreChips: { flexDirection: 'row', marginLeft: 6, alignItems: 'center' },
  chipMin: {
    backgroundColor: Colors.status.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
  },
  chipAvg: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
  },
  chipMax: {
    backgroundColor: Colors.status.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  chipText: { color: Colors.text.white, fontWeight: '700', fontSize: 12 },
  name: { color: Colors.text.primary, fontWeight: '800', fontSize: 16 },
  type: { color: Colors.text.secondary, marginTop: 2, fontSize: 12 },
  meta: { color: Colors.text.secondary, marginTop: 4, fontSize: 12 },
  desc: { color: Colors.text.primary, marginTop: 8, fontSize: 13 },
  cardFooter: { marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  small: { color: Colors.text.secondary, fontSize: 12 },
  error: { color: Colors.status.error },
});
