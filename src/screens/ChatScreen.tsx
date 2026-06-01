import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import { auth, db } from '../services/firebase';
import {
  collection, addDoc, query, orderBy,
  onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { useTheme } from '../hooks/useTheme';

const SERVER_URL = 'https://chatapp-backend-m1g0.onrender.com';

export default function ChatScreen({ route }: any) {
  const { roomId, roomName } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const { colors } = useTheme();

  useEffect(() => {
    const socket = io(SERVER_URL);
    socketRef.current = socket;
    socket.emit('join_room', roomId);
    socket.on('user_typing', (data) => {
      if (data.userId !== auth.currentUser?.uid) {
        setTypingUser(data.userEmail);
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    });
    return () => { socket.disconnect(); };
  }, [roomId]);

  useEffect(() => {
    const q = query(
      collection(db, 'rooms', roomId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
    return unsubscribe;
  }, [roomId]);

  const handleTyping = (value: string) => {
    setText(value);
    socketRef.current?.emit('typing', {
      roomId,
      userId: auth.currentUser?.uid,
      userEmail: auth.currentUser?.email,
    });
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    const message = {
      text,
      userId: auth.currentUser?.uid,
      userEmail: auth.currentUser?.email,
      timestamp: serverTimestamp(),
    };
    setText('');
    await addDoc(collection(db, 'rooms', roomId, 'messages'), message);
  };

  const isMyMessage = (userId: string) => userId === auth.currentUser?.uid;

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View style={[
            styles.messageBubble,
            isMyMessage(item.userId) ? styles.myMessage : [styles.otherMessage, { backgroundColor: colors.bubble }]
          ]}>
            {!isMyMessage(item.userId) && (
              <Text style={[styles.senderName, { color: colors.textSecondary }]}>{item.userEmail}</Text>
            )}
            <Text style={[
              styles.messageText,
              { color: isMyMessage(item.userId) ? '#fff' : colors.text }
            ]}>
              {item.text}
            </Text>
            <Text style={[
              styles.timestamp,
              { color: isMyMessage(item.userId) ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
            ]}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.messagesList}
        ListFooterComponent={
          isTyping ? (
            <Text style={[styles.typingIndicator, { color: colors.textSecondary }]}>
              {typingUser} is typing...
            </Text>
          ) : null
        }
      />

      <View style={[styles.inputContainer, {
        backgroundColor: colors.card,
        borderTopColor: colors.border
      }]}>
        <TextInput
          style={[styles.input, {
            borderColor: colors.border,
            backgroundColor: colors.surface,
            color: colors.text
          }]}
          value={text}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: colors.primary }]}
          onPress={sendMessage}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messagesList: { padding: 16, paddingBottom: 8 },
  messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 16, marginBottom: 8 },
  myMessage: { backgroundColor: '#4285F4', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  otherMessage: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  senderName: { fontSize: 11, marginBottom: 4 },
  messageText: { fontSize: 15 },
  timestamp: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  typingIndicator: { fontSize: 12, fontStyle: 'italic', paddingHorizontal: 16, paddingBottom: 8 },
  inputContainer: {
    flexDirection: 'row', padding: 12,
    alignItems: 'flex-end', gap: 8, borderTopWidth: 1,
  },
  input: {
    flex: 1, borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
    fontSize: 15, maxHeight: 100,
  },
  sendButton: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  sendText: { color: '#fff', fontWeight: '600' },
});