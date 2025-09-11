import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Colors from '../constants/Colors';
import { TestItem } from '../apis/models';

type Props = NativeStackScreenProps<any, 'TestRunner'>;

export default function TestRunner({ route }: Props) {
  const test: TestItem = route.params?.test;
  const questions = test?.questions ?? [];
  const [index, setIndex] = useState(0);

  if (!test) {
    return (
      <View style={styles.center}>
        <Text>No test data provided</Text>
      </View>
    );
  }

  const q = questions[index];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{test.title}</Text>
        <Text style={styles.desc}>{test.description}</Text>
      </View>

      <View style={styles.questionCard}>
        {q ? (
          <>
            <Text style={styles.questionText}>{q.question_text}</Text>
            {/* Options rendering - basic */}
            <View style={styles.optionsWrap}>
              {q.option_a ? <Text style={styles.option}>A. {q.option_a}</Text> : null}
              {q.option_b ? <Text style={styles.option}>B. {q.option_b}</Text> : null}
              {q.option_c ? <Text style={styles.option}>C. {q.option_c}</Text> : null}
              {q.option_d ? <Text style={styles.option}>D. {q.option_d}</Text> : null}
            </View>
          </>
        ) : (
          <Text>No questions in this test</Text>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          disabled={index === 0}
          onPress={() => setIndex(i => Math.max(0, i - 1))}
          style={[styles.navButton, index === 0 && styles.disabled]}
        >
          <Text style={styles.navText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={index >= questions.length - 1}
          onPress={() => setIndex(i => Math.min(questions.length - 1, i + 1))}
          style={[styles.navButton, index >= questions.length - 1 && styles.disabled]}
        >
          <Text style={styles.navText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: Colors.background.secondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  desc: { color: Colors.text.secondary, marginTop: 6 },
  questionCard: { backgroundColor: Colors.background.primary, padding: 14, borderRadius: 10 },
  questionText: { fontSize: 16, fontWeight: '600' },
  optionsWrap: { marginTop: 12 },
  option: { marginTop: 8, color: Colors.text.primary },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  navButton: { backgroundColor: Colors.primary.main, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  navText: { color: Colors.text.white, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
