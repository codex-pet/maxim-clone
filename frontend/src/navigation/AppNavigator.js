import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Maxim Clone' }} 
      />
      {/* 
        Add more screens here later:
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="RideRequest" component={RideRequestScreen} />
      */}
    </Stack.Navigator>
  );
}
