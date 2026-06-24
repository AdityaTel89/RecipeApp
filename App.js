import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';

/**
 * App.js — entry point only.
 * One job: wrap the app in SafeAreaProvider and mount HomeScreen.
 * Nothing else belongs here.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <HomeScreen />
    </SafeAreaProvider>
  );
}