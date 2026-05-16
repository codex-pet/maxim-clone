import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import * as Location from 'expo-location';
import { AuthProvider } from './src/context/AuthContext';

export default function App() {
  useEffect(() => {
    async function requestPermissions() {
      await Location.requestForegroundPermissionsAsync();
    }
    requestPermissions();
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}