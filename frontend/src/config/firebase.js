import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Export the raw config object
export const firebaseConfig = {
    apiKey: "AIzaSyCm769tE_ydkKWDrTFdTWcx2vW4szMcV10",
    authDomain: "maxim-clone.firebaseapp.com",
    projectId: "maxim-clone",
    storageBucket: "maxim-clone.firebasestorage.app",
    messagingSenderId: "819601648865",
    appId: "1:819601648865:web:07d4505387b9bbbf085ba0"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export default app;