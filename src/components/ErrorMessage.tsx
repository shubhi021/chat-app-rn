import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          onPress={onRetry}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', padding: 24,
  },
  icon: { fontSize: 48, marginBottom: 16 },
  message: {
    fontSize: 16, textAlign: 'center',
    lineHeight: 24, marginBottom: 24,
  },
  retryBtn: {
    paddingHorizontal: 32, paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});