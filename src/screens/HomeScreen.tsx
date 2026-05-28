import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

const ROOMS = [
  { id: '1', name: 'General', description: 'General discussion' },
  { id: '2', name: 'Tech', description: 'Technology talk' },
  { id: '3', name: 'Random', description: 'Anything goes' },
];

export default function HomeScreen({ navigation }: any) {
  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signOut}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={ROOMS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.roomItem}
            onPress={() => navigation.navigate('Chat', {
              roomId: item.id,
              roomName: item.name
            })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name[0]}</Text>
            </View>
            <View>
              <Text style={styles.roomName}>{item.name}</Text>
              <Text style={styles.roomDesc}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  signOut: {
    color: '#4285F4',
    fontSize: 14,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  roomDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
});