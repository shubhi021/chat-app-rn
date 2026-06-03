import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, ActivityIndicator
} from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTheme } from '../hooks/useTheme';

// Predefined avatar colors user can pick from
const AVATAR_COLORS = [
  '#4285F4', // Google Blue
  '#34C759', // Green
  '#FF3B30', // Red
  '#FF9500', // Orange
  '#AF52DE', // Purple
  '#00C7BE', // Teal
  '#FF2D55', // Pink
  '#5856D6', // Indigo
];

export default function ProfileScreen({ navigation }: any) {
  const [displayName, setDisplayName] = useState('');
  const [avatarColor, setAvatarColor] = useState('#4285F4');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { colors } = useTheme();

  const user = auth.currentUser;

  // Load existing profile when screen opens
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDisplayName(data.displayName || '');
          setAvatarColor(data.avatarColor || '#4285F4');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const saveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user!.uid), {
        displayName: displayName.trim(),
        avatarColor,
        email: user!.email,
        updatedAt: new Date(),
      }, { merge: true });
      Alert.alert('Success', 'Profile saved!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Could not save profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const initial = displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Avatar preview */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatarLarge, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarLargeText}>{initial}</Text>
        </View>
        <Text style={[styles.emailLabel, { color: colors.textSecondary }]}>
          {user?.email}
        </Text>
      </View>

      {/* Display name input */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        DISPLAY NAME
      </Text>
      <TextInput
        style={[styles.input, {
          backgroundColor: colors.card,
          borderColor: colors.border,
          color: colors.text,
        }]}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="How should others see you?"
        placeholderTextColor={colors.textSecondary}
        maxLength={30}
        autoCapitalize="words"
      />
      <Text style={[styles.charCount, { color: colors.textSecondary }]}>
        {displayName.length}/30
      </Text>

      {/* Avatar color picker */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        AVATAR COLOR
      </Text>
      <View style={styles.colorGrid}>
        {AVATAR_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorCircle,
              { backgroundColor: color },
              avatarColor === color && styles.colorCircleSelected,
            ]}
            onPress={() => setAvatarColor(color)}
          >
            {avatarColor === color && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: colors.primary }]}
        onPress={saveProfile}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Save Profile</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarSection: { alignItems: 'center', marginBottom: 32, marginTop: 8 },
  avatarLarge: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarLargeText: { color: '#fff', fontSize: 40, fontWeight: '700' },
  emailLabel: { fontSize: 14 },
  label: {
    fontSize: 12, fontWeight: '600',
    letterSpacing: 1, marginBottom: 10, marginTop: 24,
  },
  input: {
    borderWidth: 1, borderRadius: 12,
    padding: 14, fontSize: 16,
  },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 4 },
  colorGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  colorCircle: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  checkmark: { color: '#fff', fontSize: 20, fontWeight: '700' },
  saveBtn: {
    marginTop: 40, padding: 16,
    borderRadius: 14, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});