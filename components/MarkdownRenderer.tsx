import React from 'react';
import { Text, View, StyleSheet, Linking, Platform } from 'react-native';
import Colors from '../constants/Colors';

type Props = { text: string };

// Very small markdown renderer: supports headings (#), code blocks ``` ```,
// inline code ``, bold **, italic *, links [text](url), and unordered lists (- or *).
const MarkdownRenderer: React.FC<Props> = ({ text }) => {
  if (!text) return null;

  // Split into blocks by code fences first
  const parts = text.split(/```([\s\S]*?)```/g);
  // parts: [normal, code, normal, code, ...]

  const renderInline = (chunk: string, keyBase: string) => {
    // handle headings (line-start)
    const lines = chunk.split(/\n/);
    return lines.map((line, idx) => {
      const key = `${keyBase}-${idx}`;
      // heading
      const hMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (hMatch) {
        const level = hMatch[1].length;
        return (
          <Text key={key} style={[styles.heading, styles[`h${level}`]]}>
            {hMatch[2]}
          </Text>
        );
      }

      // unordered list
      const ulMatch = line.match(/^\s*[-*+]\s+(.*)$/);
      if (ulMatch) {
        return (
          <View key={key} style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.paragraph}>{renderInlineFragments(ulMatch[1], key)}</Text>
          </View>
        );
      }

      // ordered list (1. )
      const olMatch = line.match(/^\s*\d+\.\s+(.*)$/);
      if (olMatch) {
        return (
          <View key={key} style={styles.listItem}>
            <Text style={styles.bullet}>◦</Text>
            <Text style={styles.paragraph}>{renderInlineFragments(olMatch[1], key)}</Text>
          </View>
        );
      }

      // regular paragraph line
      return (
        <Text key={key} style={styles.paragraph}>
          {renderInlineFragments(line, key)}
        </Text>
      );
    });
  };

  const renderInlineFragments = (line: string, keyBase: string) => {
    const elements: React.ReactNode[] = [];
    let cursor = 0;

    // regex to find link, bold, italic, inline code
    const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      const idx = m.index;
      if (idx > cursor) {
        elements.push(<Text key={`${keyBase}-t-${cursor}`}>{line.slice(cursor, idx)}</Text>);
      }
      if (m[1] && m[2]) {
        // link
        const label = m[1];
        const url = m[2];
        elements.push(
          <Text
            key={`${keyBase}-link-${idx}`}
            style={styles.link}
            onPress={() => Linking.openURL(url)}
          >
            {label}
          </Text>,
        );
      } else if (m[3]) {
        // bold
        elements.push(
          <Text key={`${keyBase}-b-${idx}`} style={styles.bold}>
            {m[3]}
          </Text>,
        );
      } else if (m[4]) {
        // inline code
        elements.push(
          <Text key={`${keyBase}-code-${idx}`} style={styles.inlineCode}>
            {m[4]}
          </Text>,
        );
      } else if (m[5]) {
        // italic
        elements.push(
          <Text key={`${keyBase}-i-${idx}`} style={styles.italic}>
            {m[5]}
          </Text>,
        );
      }
      cursor = re.lastIndex;
    }
    if (cursor < line.length) {
      elements.push(<Text key={`${keyBase}-t-${cursor}`}>{line.slice(cursor)}</Text>);
    }

    return elements;
  };

  const content: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      // code block
      content.push(
        <View key={`code-${i}`} style={styles.codeBlock}>
          <Text style={styles.codeText}>{parts[i]}</Text>
        </View>,
      );
    } else if (parts[i]) {
      content.push(...renderInline(parts[i], `p-${i}`));
    }
  }

  return <View style={styles.root}>{content}</View>;
};

const styles = StyleSheet.create<any>({
  root: { flexShrink: 1 },
  heading: { fontWeight: '700', color: Colors.text.primary, marginVertical: 6 },
  h1: { fontSize: 20 },
  h2: { fontSize: 18 },
  h3: { fontSize: 16 },
  h4: { fontSize: 14 },
  h5: { fontSize: 13 },
  h6: { fontSize: 12 },
  paragraph: { color: Colors.text.primary, fontSize: 14, marginBottom: 6 },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  link: { color: Colors.primary.main, textDecorationLine: 'underline' },
  inlineCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: Colors.ui.disabled,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: Colors.text.primary,
  },
  codeBlock: {
    backgroundColor: Colors.ui.disabled,
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Colors.text.primary,
  },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  bullet: { width: 18, color: Colors.text.primary },
});

export default MarkdownRenderer;
