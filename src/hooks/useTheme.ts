import { useColorScheme } from 'react-native';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  console.log("isDark--",isDark)

  return {
    isDark,
    colors: {
      background: isDark ? '#1a1a1a' : '#ffffff',
      surface: isDark ? '#2a2a2a' : '#f5f5f5',
      card: isDark ? '#2a2a2a' : '#ffffff',
      text: isDark ? '#ffffff' : '#1a1a1a',
      textSecondary: isDark ? '#999999' : '#666666',
      border: isDark ? '#333333' : '#f0f0f0',
      primary: '#4285F4',
      bubble: isDark ? '#2a2a2a' : '#ffffff',
      inputBg: isDark ? '#2a2a2a' : '#ffffff',
    }
  };
};