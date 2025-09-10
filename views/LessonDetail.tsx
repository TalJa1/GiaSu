import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Colors from '../constants/Colors';
import { getLessonById } from '../apis/lessonApi';
import { getUserById } from '../apis/userApi';
import type { Lesson } from '../apis/models';
import MarkdownRenderer from '../components/MarkdownRenderer';
import HtmlToMarkdown from '../components/HtmlToMarkdown';

const LessonDetail: React.FC<any> = ({ route }) => {
  const { lessonId } = route.params ?? {};
  const navigation = useNavigation<any>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [authorLoading, setAuthorLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        if (lessonId == null) {
          setError('Invalid lesson id');
          return;
        }
        const found = await getLessonById(lessonId);
        if (!mounted) return;
        setLesson(found);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message ?? 'Failed to load lesson');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [lessonId]);

  useEffect(() => {
    let mounted = true;
    const loadAuthor = async () => {
      if (!lesson?.created_by) return;
      setAuthorLoading(true);
      try {
        const user = await getUserById(lesson.created_by as number);
        if (!mounted) return;
        // prefer username, fallback to id
        setAuthorName((user as any)?.username ?? (user as any)?.name ?? null);
      } catch (_err) {
        // ignore author fetch errors
      } finally {
        if (mounted) setAuthorLoading(false);
      }
    };
    loadAuthor();
    return () => {
      mounted = false;
    };
  }, [lesson?.created_by]);

  if (loading) return <ActivityIndicator style={styles.loading} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.headerBack}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color={Colors.text.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {lesson?.title ?? 'Lesson'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!lesson ? (
          <Text style={styles.message}>{error ?? 'Lesson not found'}</Text>
        ) : (
          <View>
            <Text style={styles.title}>
              {lesson.title ?? `Lesson ${lesson.id}`}
            </Text>
            <Text style={styles.meta}>Subject: {lesson.subject ?? '—'}</Text>
            <Text style={styles.meta}>
              Author:{' '}
              {authorLoading
                ? 'Loading...'
                : authorName ?? lesson.created_by ?? '—'}
            </Text>
            <Text style={styles.meta}>Created: {lesson.created_at ?? '—'}</Text>

            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.body}>
              {lesson.description ?? 'No description.'}
            </Text>

            <Text style={styles.sectionTitle}>Content</Text>
            {lesson.content ? (
              // if content contains HTML-like tags, convert to markdown first
              /<[^>]+>/.test(lesson.content) ? (
                <HtmlToMarkdown html={lesson.content} />
              ) : (
                <MarkdownRenderer text={lesson.content} />
              )
            ) : (
              <Text style={styles.body}>No content.</Text>
            )}

            {lesson.content_url ? (
              <>
                <Text style={styles.sectionTitle}>Additional Resources</Text>
                {(() => {
                  const raw = String(lesson.content_url ?? '');
                  const urls = raw
                    .split(',')
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0);
                  if (urls.length === 0) return <Text style={styles.body}>No URL</Text>;
                  return urls.map((url, i) => {
                    const handleOpen = () => {
                      // ensure scheme
                      const href = /^https?:\/\//i.test(url) ? url : `http://${url}`;
                      Linking.openURL(href).catch(() => {
                        // ignore errors for now
                      });
                    };
                    return (
                      <TouchableOpacity
                        key={`link-${i}`}
                        style={styles.linkButton}
                        activeOpacity={0.8}
                        onPress={handleOpen}
                      >
                        <Text style={styles.linkButtonText}>{`Link${i + 1}`}</Text>
                      </TouchableOpacity>
                    );
                  });
                })()}
              </>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default LessonDetail;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  content: { padding: 20 },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  meta: { color: Colors.text.secondary, marginBottom: 4 },
  sectionTitle: {
    marginTop: 12,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  body: { marginTop: 6, color: Colors.text.primary },
  message: { marginTop: 20, color: Colors.text.secondary },
  loading: { marginTop: 20 },
  raw: { fontSize: 12, marginTop: 6, color: Colors.text.secondary },
  headerBar: {
    height: 56,
    backgroundColor: Colors.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerBack: { width: 40, alignItems: 'flex-start' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: Colors.text.white,
    fontWeight: '700',
  },
  headerRight: { width: 40 },
  linkButton: {
    marginTop: 8,
    backgroundColor: Colors.primary.light,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  linkButtonText: { color: Colors.text.white, fontWeight: '700' },
});
