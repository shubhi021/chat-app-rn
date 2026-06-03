import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
} from "react-native";
import { signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import {
  auth,
  db,
  updateUserPresence,
  markRoomAsRead,
} from "../services/firebase";
import { useTheme } from "../hooks/useTheme";

const ROOMS = [
  { id: "1", name: "General", description: "General discussion" },
  { id: "2", name: "Tech", description: "Technology talk" },
  { id: "3", name: "Random", description: "Anything goes" },
];

const getPrivateRoomId = (uid1: string, uid2: string) =>
  [uid1, uid2].sort().join("_");

export default function HomeScreen({ navigation }: any) {
  const [error, setError] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [lastReads, setLastReads] = useState<Record<string, any>>({});
  const { colors, isDark } = useTheme();

  useEffect(() => {
    const setup = async () => {
      try {
        await updateUserPresence(true);
      } catch (err) {
        setError("Could not connect. Check your internet connection.");
      }
    };
    setup();

    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const users = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOnlineUsers(
          users.filter(
            (u: any) => u.isOnline && u.id !== auth.currentUser?.uid,
          ),
        );
      },
      (err) => {
        setError("Could not load users. Pull down to refresh.");
      },
    );

    return () => {
      updateUserPresence(false);
      unsubscribe();
    };
  }, []);

  // Listen to lastRead timestamps for current user
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "roomReads"),
      (snapshot) => {
        const reads: Record<string, any> = {};
        snapshot.docs.forEach((doc) => {
          reads[doc.id] = doc.data().lastRead;
        });
        setLastReads(reads);
      },
    );
    return unsubscribe;
  }, []);

  // Count unread messages per room
  useEffect(() => {
    const unsubscribes = ROOMS.map((room) => {
      const lastRead = lastReads[room.id];
      const q = lastRead
        ? query(
            collection(db, "rooms", room.id, "messages"),
            where("timestamp", ">", lastRead),
            orderBy("timestamp", "asc"),
          )
        : query(
            collection(db, "rooms", room.id, "messages"),
            orderBy("timestamp", "asc"),
          );

      return onSnapshot(q, (snapshot) => {
        const unread = snapshot.docs.filter(
          (doc) => doc.data().userId !== auth.currentUser?.uid,
        ).length;
        setUnreadCounts((prev) => ({ ...prev, [room.id]: unread }));
      });
    });
    return () => unsubscribes.forEach((u) => u());
  }, [lastReads]);

  const handleSignOut = async () => {
    await updateUserPresence(false);
    await signOut(auth);
  };

  const openRoom = (roomId: string, roomName: string) => {
    markRoomAsRead(roomId);
    setUnreadCounts((prev) => ({ ...prev, [roomId]: 0 }));
    navigation.navigate("Chat", { roomId, roomName });
  };

  const openPrivateChat = (user: any) => {
    const roomId = getPrivateRoomId(auth.currentUser!.uid, user.id);
    markRoomAsRead(roomId);
    navigation.navigate("Chat", {
      roomId,
      roomName: user.email?.split("@")[0],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Chats</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Profile")}
            style={styles.profileBtn}
          >
            <Text style={[styles.profileBtnText, { color: colors.primary }]}>
              Profile
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut}>
            <Text style={[styles.signOut, { color: colors.textSecondary }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠ {error}</Text>
          <TouchableOpacity onPress={() => setError("")}>
            <Text style={styles.errorDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {onlineUsers.length > 0 && (
        <View
          style={[
            styles.onlineSection,
            {
              backgroundColor: isDark ? "#1e1e2e" : "#f0f4ff",
              marginHorizontal: 16,
              marginBottom: 16,
              borderRadius: 16,
              padding: 16,
            },
          ]}
        >
          <Text style={[styles.onlineTitle, { color: colors.primary }]}>
            🟢 Online now ({onlineUsers.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.onlineList}>
              {onlineUsers.map((user: any) => (
                <TouchableOpacity
                  key={user.id}
                  style={styles.onlineUser}
                  onPress={() => openPrivateChat(user)}
                >
                  <View style={styles.onlineAvatarWrapper}>
                    <View style={styles.onlineAvatar}>
                      <Text style={styles.onlineAvatarText}>
                        {user.email?.[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.onlineDot} />
                  </View>
                  <Text
                    style={[
                      styles.onlineEmail,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {user.email?.split("@")[0]}
                  </Text>
                  <Text style={[styles.tapHint, { color: colors.primary }]}>
                    Tap to chat
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        GROUP CHATS
      </Text>

      <FlatList
        data={ROOMS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.roomItem,
              {
                backgroundColor: colors.card,
                borderBottomColor: colors.border,
              },
            ]}
            onPress={() => openRoom(item.id, item.name)}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{item.name[0]}</Text>
            </View>
            <View style={styles.roomInfo}>
              <Text style={[styles.roomName, { color: colors.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.roomDesc, { color: colors.textSecondary }]}>
                {item.description}
              </Text>
            </View>
            {unreadCounts[item.id] > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCounts[item.id] > 99 ? "99+" : unreadCounts[item.id]}
                </Text>
              </View>
            )}
            <Text style={[styles.chevron, { color: colors.textSecondary }]}>
              ›
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerActions: { flexDirection: "row", gap: 16, alignItems: "center" },
  profileBtn: {},
  profileBtnText: { fontSize: 14, fontWeight: "500" },
  title: { fontSize: 32, fontWeight: "700" },
  signOut: { fontSize: 14 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  onlineSection: {},
  onlineTitle: { fontSize: 13, fontWeight: "700", marginBottom: 12 },
  onlineList: { flexDirection: "row", gap: 16 },
  onlineUser: { alignItems: "center", gap: 4, width: 64 },
  onlineAvatarWrapper: { position: "relative" },
  onlineAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineAvatarText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#34C759",
    borderWidth: 2,
    borderColor: "#fff",
  },
  onlineEmail: { fontSize: 11, maxWidth: 64, textAlign: "center" },
  tapHint: { fontSize: 10, fontWeight: "500" },
  roomItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "600" },
  roomInfo: { flex: 1 },
  roomName: { fontSize: 16, fontWeight: "600" },
  roomDesc: { fontSize: 13, marginTop: 2 },
  badge: {
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  chevron: { fontSize: 22 },
  errorBanner: {
    backgroundColor: "#FFF0F0",
    borderLeftWidth: 4,
    borderLeftColor: "#FF3B30",
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorBannerText: { color: "#FF3B30", fontSize: 13, flex: 1 },
  errorDismiss: { color: "#FF3B30", fontSize: 16, paddingLeft: 8 },
});
