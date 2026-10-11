import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import * as Location from 'expo-location';
import { AuthProvider } from './src/context/AuthContext';
import { COLORS } from './src/constants/colors';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.page,
    primary: COLORS.primary,
  },
};

export default function App() {
  const [splashVisible, setSplashVisible] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const splashScale = useRef(new Animated.Value(0.86)).current;

  useEffect(() => {
    async function requestPermissions() {
      await Location.requestForegroundPermissionsAsync();
    }
    requestPermissions();
  }, []);

  useEffect(() => {
    let hideTimer;
    const entrance = Animated.spring(splashScale, {
      toValue: 1,
      speed: 12,
      bounciness: 5,
      useNativeDriver: true,
    });

    entrance.start(({ finished }) => {
      if (!finished) return;
      hideTimer = setTimeout(() => {
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(({ finished: hidden }) => {
          if (hidden) setSplashVisible(false);
        });
      }, 500);
    });

    return () => {
      clearTimeout(hideTimer);
      entrance.stop();
      splashOpacity.stopAnimation();
      splashScale.stopAnimation();
    };
  }, [splashOpacity, splashScale]);

  return (
    <AuthProvider>
      <View style={styles.root}>
        <NavigationContainer theme={navigationTheme}>
          <AppNavigator />
        </NavigationContainer>
        <StatusBar style="dark" backgroundColor={COLORS.page} />
        {splashVisible && (
          <Animated.View style={[styles.splash, { opacity: splashOpacity }]}>
            <Animated.View style={{ transform: [{ scale: splashScale }], alignItems: 'center' }}>
              <Image
                source={require('./assets/img/goryde-splash-icon.png')}
                style={styles.splashIcon}
                resizeMode="contain"
                accessibilityLabel="GoRyde"
              />
              <Text style={styles.splashTagline}>Your ride, your way.</Text>
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
    backgroundColor: COLORS.page,
  },
  splash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    elevation: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.page,
  },
  splashIcon: {
    width: 200,
    height: 200,
    marginBottom: 12,
  },
  splashTagline: {
    marginTop: 6,
    color: COLORS.textSecondary,
    fontSize: 15,
    opacity: 0.85,
  },
});