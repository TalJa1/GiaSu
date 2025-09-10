import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Colors from '../constants/Colors';
import { getQuizletsByLesson } from '../apis/quizletApi';
import { Quizlet } from '../apis/models';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const QuizletScreen: React.FC<any> = ({ route }) => {
  const lessonId: number = route?.params?.lessonId ?? 0;
  const [items, setItems] = useState<Quizlet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getQuizletsByLesson(lessonId);
        if (!mounted) return;
        setItems(data ?? []);
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
  }, [lessonId]);

  const navigation = useNavigation();
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const current = items[index];

  const goNext = () => {
    if (index < items.length - 1) {
      setIndex(i => i + 1);
      setShowAnswer(false);
    }
  };

  const goBack = () => {
    if (index > 0) {
      setIndex(i => i - 1);
      setShowAnswer(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => (navigation as any).goBack()}
          style={styles.headerBack}
        >
          <Icon name="chevron-left" size={24} color={Colors.text.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quizlet</Text>
        <View style={styles.headerRight} />
      </View>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : items.length === 0 ? (
          <Text style={styles.empty}>No items</Text>
        ) : (
          <>
            <TouchableOpacity
              activeOpacity={0.95}
              style={styles.card}
              onPress={() => setShowAnswer(s => !s)}
            >
              <View style={styles.accent} />
              <View style={styles.qRow}>
                <Text style={styles.question} numberOfLines={6}>
                  {showAnswer
                    ? current.answer ?? '—'
                    : current.question ?? `Question ${index + 1}`}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.controls}>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  index === 0 && styles.navButtonDisabled,
                ]}
                onPress={goBack}
                disabled={index === 0}
              >
                <Text
                  style={[
                    styles.navButtonText,
                    index === 0 && styles.navButtonTextDisabled,
                  ]}
                >
                  Back
                </Text>
              </TouchableOpacity>

              <Text style={styles.progressText}>
                {index + 1} / {items.length}
              </Text>

              <TouchableOpacity
                style={[
                  styles.navButton,
                  index === items.length - 1 && styles.navButtonDisabled,
                ]}
                onPress={goNext}
                disabled={index === items.length - 1}
              >
                <Text
                  style={[
                    styles.navButtonText,
                    index === items.length - 1 && styles.navButtonTextDisabled,
                  ]}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default QuizletScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.secondary },
  headerBar: {
    width: '100%',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.main,
  },
  headerBack: { position: 'absolute', left: 12, top: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text.white },
  headerRight: { position: 'absolute', right: 12, top: 12 },
  // center content vertically and horizontally
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // larger, centered card
  card: {
    backgroundColor: Colors.background.primary,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginBottom: 10,
    minHeight: 260,
    width: '100%',
    maxWidth: 420,
    // stronger shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // center icon + text horizontally
  qRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  question: {
    marginLeft: 10,
    fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 24,
  },
  answer: { color: Colors.text.secondary, textAlign: 'center', marginTop: 8 },
  empty: { color: Colors.text.secondary, textAlign: 'center', marginTop: 20 },
  error: { color: Colors.status.error, textAlign: 'center' },
  // controls fill the same width as the card and sit below it
  controls: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  navButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  navButtonDisabled: { backgroundColor: Colors.ui.disabled },
  navButtonText: { color: Colors.text.white, fontWeight: '700' },
  navButtonTextDisabled: { color: Colors.text.secondary },
  progressText: { color: Colors.text.secondary, fontWeight: '700' },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: Colors.secondary.indigo,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
});
