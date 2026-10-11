import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Export the raw config object
export const firebaseConfig = {
    apiKey: "AIzaSyCm769tE_ydkKWDrTFdTWcx2vW4szMcV10",
    authDomain: "maxim-clone.firebaseapp.com",
    projectId: "maxim-clone",
    storageBucket: "maxim-clone.firebasestorage.app",
    messagingSenderId: "819601648865",
    appId: "1:819601648865:web:07d4505387b9bbbf085ba0"
};

// Initialize app (safe for hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Lazy auth singleton using dynamic require to avoid "Component auth has not been
// registered yet" — getReactNativePersistence must be loaded after Firebase internals are set up.
let _auth = null;
export function getFirebaseAuth() {
    if (_auth) return _auth;
    try {
        const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
        _auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage)
        });
    } catch {
        const { getAuth } = require('firebase/auth');
        _auth = getAuth(app);
    }
    return _auth;
}

export default app;