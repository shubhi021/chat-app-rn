import { useEffect } from 'react';
import { AppState } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { updateUserPresence } from './src/services/firebase';
import { auth } from './src/services/firebase';

export default function App() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (auth.currentUser) {
        updateUserPresence(state === 'active');
      }
    });
    return () => subscription.remove();
  }, []);

  return <AppNavigator />;
}