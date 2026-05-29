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

const SERVER_URL = 'http://localhost:3000';

export default function ChatScreen({ route }: any) {
  const { roomId, roomName } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);

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
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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
      style={styles.container}
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
            isMyMessage(item.userId) ? styles.myMessage : styles.otherMessage
          ]}>
            {!isMyMessage(item.userId) && (
              <Text style={styles.senderName}>{item.userEmail}</Text>
            )}
            <Text style={[
              styles.messageText,
              isMyMessage(item.userId) && styles.myMessageText
            ]}>
              {item.text}
            </Text>
            <Text style={[
              styles.timestamp,
              isMyMessage(item.userId) && styles.myTimestamp
            ]}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.messagesList}
        ListFooterComponent={
          isTyping ? (
            <Text style={styles.typingIndicator}>
              {typingUser} is typing...
            </Text>
          ) : null
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  messagesList: { padding: 16, paddingBottom: 8 },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  myMessage: {
    backgroundColor: '#4285F4',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  senderName: { fontSize: 11, color: '#999', marginBottom: 4 },
  messageText: { fontSize: 15, color: '#1a1a1a' },
  myMessageText: { color: '#fff' },
  timestamp: { fontSize: 10, color: '#999', marginTop: 4, alignSelf: 'flex-end' },
  myTimestamp: { color: 'rgba(255,255,255,0.7)' },
  typingIndicator: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendText: { color: '#fff', fontWeight: '600' },
});