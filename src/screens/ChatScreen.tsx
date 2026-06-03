import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { io, Socket } from "socket.io-client";
import { auth, db, markRoomAsRead } from "../services/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDoc,
  doc,
} from "firebase/firestore";
import { useTheme } from "../hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const SERVER_URL = "https://chatapp-backend-m1g0.onrender.com";

export default function ChatScreen({ route }: any) {
  const { roomId } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [socketError, setSocketError] = useState(false);
  const [sendError, setSendError] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    const socket = io(SERVER_URL, {
      timeout: 10000,
      reconnectionAttempts: 3,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketError(false);
    });

    socket.on("connect_error", () => {
      setSocketError(true);
    });

    socket.emit("join_room", roomId);
    markRoomAsRead(roomId);

    socket.on("user_typing", (data) => {
      if (data.userId !== auth.currentUser?.uid) {
        setTypingUser(data.userEmail);
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    const q = query(
      collection(db, "rooms", roomId, "messages"),
      orderBy("timestamp", "asc"),
    );
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
  }, [roomId]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (docSnap.exists()) {
        setDisplayName(
          docSnap.data().displayName || auth.currentUser.email || "",
        );
      }
    };
    fetchProfile();
  }, []);

  const handleTyping = (value: string) => {
    setText(value);
    socketRef.current?.emit("typing", {
      roomId,
      userId: auth.currentUser?.uid,
      userEmail: auth.currentUser?.email,
    });
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    const msg = text;
    setText("");
    setSendError("");
    try {
      await addDoc(collection(db, "rooms", roomId, "messages"), {
        text: msg,
        type: "text",
        userId: auth.currentUser?.uid,
        userEmail: auth.currentUser?.email,
        displayName: displayName || auth.currentUser?.email,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      setSendError("Message failed to send. Tap to retry.");
      setText(msg);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      await addDoc(collection(db, "rooms", roomId, "messages"), {
        type: "image",
        imageData: `data:image/jpeg;base64,${result.assets[0].base64}`,
        userId: auth.currentUser?.uid,
        userEmail: auth.currentUser?.email,
        timestamp: serverTimestamp(),
      });
    }
  };

  const isMe = (userId: string) => userId === auth.currentUser?.uid;

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getInitial = (email: string) => email?.[0].toUpperCase() || "?";

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? "#111" : "#f0f2f5" },
      ]}
      edges={["bottom"]}
    >
      <KeyboardAvoidingView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#111" : "#f0f2f5" },
        ]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        {socketError && (
  <View style={styles.connectionBanner}>
    <Text style={styles.connectionBannerText}>
      ⚠ Reconnecting to server...
    </Text>
  </View>
)}

{sendError ? (
  <TouchableOpacity
    style={styles.sendErrorBanner}
    onPress={() => { setSendError(''); sendMessage(); }}
  >
    <Text style={styles.sendErrorText}>{sendError}</Text>
  </TouchableOpacity>
) : null}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          contentContainerStyle={styles.messagesList}
          ListFooterComponent={
            isTyping ? (
              <View style={styles.typingRow}>
                <View
                  style={[
                    styles.typingBubble,
                    { backgroundColor: colors.bubble },
                  ]}
                >
                  <Text
                    style={[styles.typingText, { color: colors.textSecondary }]}
                  >
                    {typingUser.split("@")[0]} is typing...
                  </Text>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const mine = isMe(item.userId);
            return (
              <View
                style={[
                  styles.messageRow,
                  mine ? styles.messageRowRight : styles.messageRowLeft,
                ]}
              >
                {!mine && (
                  <View style={styles.avatarSmall}>
                    <Text style={styles.avatarSmallText}>
                      {getInitial(item.userEmail)}
                    </Text>
                  </View>
                )}
                <View style={{ maxWidth: "72%" }}>
                  {!mine && (
                    <Text
                      style={[
                        styles.senderLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.displayName || item.userEmail?.split("@")[0]}
                    </Text>
                  )}
                  <View
                    style={[
                      styles.bubble,
                      mine
                        ? styles.myBubble
                        : [
                            styles.otherBubble,
                            { backgroundColor: colors.card },
                          ],
                    ]}
                  >
                    {item.type === "image" ? (
                      <Image
                        source={{ uri: item.imageData }}
                        style={styles.messageImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text
                        style={[
                          styles.messageText,
                          { color: mine ? "#fff" : colors.text },
                        ]}
                      >
                        {item.text}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.timeLabel,
                      { color: colors.textSecondary },
                      mine && styles.timeLabelRight,
                    ]}
                  >
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "#2a2a2a" : "#f0f2f5",
                color: colors.text,
              },
            ]}
            value={text}
            onChangeText={handleTyping}
            placeholder="Message..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor: text.trim() ? colors.primary : "transparent",
              },
            ]}
            onPress={sendMessage}
            disabled={!text.trim()}
          >
            <Ionicons
              name="arrow-up"
              size={20}
              color={text.trim() ? "#fff" : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={pickImage}>
            <Ionicons name="image-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  container: { flex: 1 },
  messagesList: { padding: 12, paddingBottom: 8 },
  messageRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
    gap: 8,
  },
  messageRowLeft: { justifyContent: "flex-start" },
  messageRowRight: { justifyContent: "flex-end" },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  avatarSmallText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  senderLabel: { fontSize: 11, marginBottom: 3, marginLeft: 4 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  myBubble: { backgroundColor: "#4285F4", borderBottomRightRadius: 4 },
  otherBubble: { borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageImage: { width: 200, height: 150, borderRadius: 12 },
  timeLabel: { fontSize: 10, marginTop: 3, marginLeft: 4 },
  timeLabelRight: { textAlign: "right", marginRight: 4 },
  typingRow: { flexDirection: "row", marginBottom: 8 },
  typingBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingText: { fontSize: 13, fontStyle: "italic" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 0.5,
  },
  iconBtn: { paddingBottom: 8 },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  connectionBanner: {
  backgroundColor: '#FF9500',
  padding: 8,
  alignItems: 'center',
},
connectionBannerText: {
  color: '#fff', fontSize: 13, fontWeight: '500',
},
sendErrorBanner: {
  backgroundColor: '#FF3B30',
  padding: 8,
  alignItems: 'center',
},
sendErrorText: {
  color: '#fff', fontSize: 13,
},
});
