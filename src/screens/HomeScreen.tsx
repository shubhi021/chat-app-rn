import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, db, updateUserPresence } from '../services/firebase';
import { useTheme } from '../hooks/useTheme';

const ROOMS = [
  { id: '1', name: 'General', description: 'General discussion' },
  { id: '2', name: 'Tech', description: 'Technology talk' },
  { id: '3', name: 'Random', description: 'Anything goes' },
];

export default function HomeScreen({ navigation }: any) {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const { colors } = useTheme();

  useEffect(() => {
    updateUserPresence(true);
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOnlineUsers(users.filter((u: any) => u.isOnline && u.id !== auth.currentUser?.uid));
    });
    return () => {
      updateUserPresence(false);
      unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await updateUserPresence(false);
    await signOut(auth);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Chats</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={[styles.signOut, { color: colors.primary }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {onlineUsers.length > 0 && (
        <View style={styles.onlineSection}>
          <Text style={[styles.onlineTitle, { color: colors.textSecondary }]}>Online now</Text>
          <View style={styles.onlineList}>
            {onlineUsers.map((user: any) => (
              <View key={user.id} style={styles.onlineUser}>
                <View style={styles.onlineAvatar}>
                  <Text style={styles.onlineAvatarText}>
                    {user.email?.[0].toUpperCase()}
                  </Text>
                  <View style={styles.onlineDot} />
                </View>
                <Text style={[styles.onlineEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                  {user.email?.split('@')[0]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <FlatList
        data={ROOMS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.roomItem, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('Chat', {
              roomId: item.id,
              roomName: item.name
            })}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{item.name[0]}</Text>
            </View>
            <View>
              <Text style={[styles.roomName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.roomDesc, { color: colors.textSecondary }]}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: { fontSize: 32, fontWeight: '700' },
  signOut: { fontSize: 14 },
  onlineSection: { paddingHorizontal: 24, marginBottom: 16 },
  onlineTitle: { fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  onlineList: { flexDirection: 'row', gap: 16 },
  onlineUser: { alignItems: 'center', gap: 4 },
  onlineAvatar: { position: 'relative' },
  onlineAvatarText: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#4285F4',
    textAlign: 'center', lineHeight: 44,
    color: '#fff', fontSize: 18, fontWeight: '600', overflow: 'hidden',
  },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#34C759', borderWidth: 2, borderColor: '#fff',
  },
  onlineEmail: { fontSize: 11, maxWidth: 52 },
  roomItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, paddingHorizontal: 24,
    borderBottomWidth: 1, gap: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  roomName: { fontSize: 16, fontWeight: '600' },
  roomDesc: { fontSize: 13, marginTop: 2 },
});