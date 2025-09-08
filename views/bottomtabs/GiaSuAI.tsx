import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AIApi from '../../apis/AIApi';
import { ActivityIndicator } from 'react-native';
import MarkdownRenderer from '../../components/MarkdownRenderer';

type Message = {
  id: string;
  text: string;
  fromMe?: boolean;
  timestamp?: number;
};

const initialMessages: Message[] = [
  {
    id: 'm1',
    text: 'Hi! I can help you study. Ask me anything.',
    fromMe: false,
    timestamp: Date.now() - 60000,
  },
];

const GiaSuAI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    // scroll to bottom when messages change
    if (flatRef.current && messages.length > 0) {
      setTimeout(() => {
        flatRef.current?.scrollToEnd({ animated: true } as any);
      }, 50);
    }
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const msg: Message = {
      id: `m${Date.now()}`,
      text,
      fromMe: true,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, msg]);
    setInput('');
    Keyboard.dismiss();
    // call AI API
    (async () => {
      setLoading(true);
      try {
        const resp = await AIApi.generateText({ prompt: text } as any);
        const botText =
          resp?.output ?? 'Sorry, I could not generate a response.';
        const reply: Message = {
          id: `b${Date.now()}`,
          text: botText,
          fromMe: false,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, reply]);
      } catch (err: any) {
        const errMsg = err?.message ?? 'Network error';
        const reply: Message = {
          id: `e${Date.now()}`,
          text: `Error: ${errMsg}`,
          fromMe: false,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, reply]);
      } finally {
        setLoading(false);
      }
    })();
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={item.fromMe ? styles.bubbleRowRight : styles.bubbleRowLeft}>
      <View
        style={[
          styles.bubble,
          item.fromMe ? styles.bubbleMe : styles.bubbleBot,
        ]}
      >
        {item.fromMe ? (
          <Text style={[styles.bubbleText, styles.bubbleTextMe]}>
            {item.text}
          </Text>
        ) : (
          <MarkdownRenderer text={item.text} />
        )}
        <Text style={styles.ts}>
          {new Date(item.timestamp || Date.now()).toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary.main}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>GiaSu AI</Text>
        </View>

        <FlatList
          ref={flatRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputRow}>
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor={Colors.text.placeholder}
            value={input}
            onChangeText={setInput}
            style={styles.input}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              loading ? styles.sendBtnDisabled : undefined,
            ]}
            onPress={sendMessage}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default GiaSuAI;

const styles = StyleSheet.create<any>({
  container: { flex: 1, backgroundColor: Colors.background.secondary },
  header: {
    height: 56,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  headerTitle: { color: Colors.text.white, fontWeight: '700', fontSize: 18 },
  messagesContainer: { padding: 16, paddingBottom: 12 },
  bubbleRowLeft: { alignItems: 'flex-start', marginVertical: 6 },
  bubbleRowRight: { alignItems: 'flex-end', marginVertical: 6 },
  bubble: {
    maxWidth: '82%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  bubbleMe: {
    backgroundColor: Colors.primary.main,
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: Colors.background.primary,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMe: { color: Colors.text.white },
  bubbleTextBot: { color: Colors.text.primary },
  ts: {
    fontSize: 10,
    color: Colors.text.secondary,
    marginTop: 6,
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
    backgroundColor: Colors.background.primary,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.ui.disabled,
    borderRadius: 20,
    color: Colors.text.primary,
    marginRight: 8,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.7 },
});
