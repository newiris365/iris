import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  FlatList, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * MODULE 10 React Native Mobile App specification: AI Concierge Screen
 * Implements chat timeline bubble lists, keyboard avoid panels, character limit checks, and quick chips inputs.
 */
export default function MobileAIChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I am IRIS, your AI campus concierge. Ask me anything about your timetable, fees, or canteen wallet balance.', timestamp: new Date().toISOString() }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<any>(null);

  const handleSend = (text: string) => {
    if (!text.trim() || text.length > 500 || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMsg('');
    setCharCount(0);
    setLoading(true);

    // Simulate API Claude callback
    setTimeout(() => {
      let replyText = 'I am processing your request using campus logs data.';
      if (text.toLowerCase().includes('attendance')) {
        replyText = 'Your overall attendance is 84%. Keep up the good work to stay above the 75% threshold!';
      } else if (text.toLowerCase().includes('fee')) {
        replyText = 'You have a pending balance of ₹2,500 library fines overdue. Pay using the billing dashboard.';
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toISOString()
      }]);
      setLoading(false);
    }, 1000);
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgWrapper, isUser ? styles.msgRight : styles.msgLeft]}>
        <View style={[styles.msgBubble, isUser ? styles.bubbleRight : styles.bubbleLeft]}>
          <Text style={isUser ? styles.textRight : styles.textLeft}>{item.content}</Text>
        </View>
        <Text style={styles.timeLabel}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  const handleChipPress = (chip: string) => {
    handleSend(chip);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* 1. HEADER BAR */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>IRIS AI Concierge</Text>
        <Text style={styles.headerSubtitle}>Next-Gen Campus Intelligence</Text>
      </View>

      {/* 2. CHAT TIMELINE */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* 3. QUICK CHIPS */}
      <View style={styles.chipsSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['My attendance?', 'Fee status', 'Timetable', 'Canteen menu'].map((chip) => (
            <TouchableOpacity 
              key={chip} 
              style={styles.chipButton}
              onPress={() => handleChipPress(chip)}
            >
              <Text style={styles.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 4. CHAT INPUT BLOCK */}
      <View style={styles.inputSection}>
        <View style={styles.inputRow}>
          <TextInput
            placeholder="Ask IRIS anything..."
            placeholderTextColor="#6C727F"
            value={inputMsg}
            onChangeText={(text) => {
              if (text.length <= 500) {
                setInputMsg(text);
                setCharCount(text.length);
              }
            }}
            style={styles.inputField}
          />
          <TouchableOpacity 
            onPress={() => handleSend(inputMsg)}
            disabled={!inputMsg.trim() || charCount > 500}
            style={[styles.sendButton, (!inputMsg.trim() || charCount > 500) && styles.sendButtonDisabled]}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.charLabel}>{charCount}/500 chars</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0A1A',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#13102A',
    backgroundColor: '#13102A',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#A78BFA',
    marginTop: 2,
  },
  listContent: {
    padding: 15,
  },
  msgWrapper: {
    marginVertical: 6,
    maxWidth: '80%',
  },
  msgLeft: {
    alignSelf: 'flex-start',
  },
  msgRight: {
    alignSelf: 'flex-end',
  },
  msgBubble: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  bubbleLeft: {
    backgroundColor: '#13102A',
    borderColor: '#1F2937',
    borderBottomLeftRadius: 0,
  },
  bubbleRight: {
    backgroundColor: 'rgba(108, 43, 217, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.25)',
    borderBottomRightRadius: 0,
  },
  textLeft: {
    color: '#FFF',
    fontSize: 13,
  },
  textRight: {
    color: '#FFF',
    fontSize: 13,
  },
  timeLabel: {
    fontSize: 8,
    color: '#6C727F',
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  chipsSection: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  chipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipText: {
    color: '#C4B5FD',
    fontSize: 10,
    fontWeight: '700',
  },
  inputSection: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#13102A',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputField: {
    flex: 1,
    height: 40,
    backgroundColor: '#0D0A1A',
    borderRadius: 12,
    paddingHorizontal: 15,
    color: '#FFF',
    fontSize: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sendButton: {
    marginLeft: 10,
    height: 40,
    paddingHorizontal: 15,
    backgroundColor: '#6C2BD9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(108, 43, 217, 0.4)',
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footerRow: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  charLabel: {
    fontSize: 9,
    color: '#6C727F',
  },
});
