import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { useEffect } from 'react';
import * as Location from 'expo-location';

export default function App() {
  useEffect(() => {
    async function requestPermissions() {
      await Location.requestForegroundPermissionsAsync();
    }
    requestPermissions();
  }, []);

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}