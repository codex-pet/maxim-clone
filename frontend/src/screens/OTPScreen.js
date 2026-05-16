import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

// --- FIREBASE IMPORTS ---
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function OTPScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  // Extract verificationId passed from AuthScreen
  const { phone, email, name, gender, isLogin, isDriver, verificationId, emailOtp } = route.params;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) inputs.current[index + 1].focus();
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) inputs.current[index - 1].focus();
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6) return;

    setLoading(true);

    try {
      let idToken = null;
      let syncData = { role: isDriver ? 'DRIVER' : 'PASSENGER', name, gender };

      if (emailOtp) {
        // --- EMAIL OTP VERIFICATION (CUSTOM) ---
        if (otpCode !== emailOtp) {
          throw new Error("Invalid OTP code.");
        }
        syncData.email = email;
        syncData.method = 'email';
      } else {
        // --- SMS OTP VERIFICATION (FIREBASE) ---
        const credential = PhoneAuthProvider.credential(verificationId, otpCode);
        const userCredential = await signInWithCredential(auth, credential);
        idToken = await userCredential.user.getIdToken();
        syncData.idToken = idToken;
        syncData.method = 'firebase';
      }

      // 🚨 IMPORTANT: Change this to your local IP or 'localhost' if testing locally 🚨
      // For now using the previous IP provided by the user
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncData)
      });

      const data = await response.json();

      if (data.success) {
        const userData = data.user; // { name, email, role, ... }
        
        // Save to Global Context
        login({
          id: userData?._id,
          name: userData?.name || name || 'User',
          email: userData?.email || email || '',
          role: userData?.role || (isDriver ? 'DRIVER' : 'PASSENGER'),
          gender: userData?.gender || gender || 'unspecified',
          phoneNumber: userData?.phoneNumber || phone || '',
          profilePhoto: userData?.profilePhoto || null,
          vehicleInfo: userData?.vehicleInfo || null,
        });

        navigation.navigate(isDriver ? 'DriverTabs' : 'MainTabs', {
          userId: userData?._id,
          userName: userData?.name || name || 'User',
          userEmail: userData?.email || email || '',
          userRole: userData?.role || (isDriver ? 'DRIVER' : 'PASSENGER'),
          gender: userData?.gender || gender || 'unspecified',
        });
      } else {
        Alert.alert("Authentication Error", data.message || "Failed to sync with server.");
      }

    } catch (err) {
      console.log(err);
      Alert.alert("Verification Failed", err.message || "The code you entered is incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background, paddingTop: insets.top }}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back-outline" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark-outline" size={48} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Verify Your Account</Text>
        <Text style={styles.subtitle}>We sent a 6-digit OTP to{'\n'}<Text style={styles.highlight}>{phone}</Text></Text>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => inputs.current[index] = ref}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              value={digit}
              onChangeText={text => handleChange(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, otp.every(d => d !== '') && styles.verifyButtonActive]}
          onPress={handleVerify}
          disabled={!otp.every(d => d !== '') || loading}
        >
          {loading ? <ActivityIndicator color={COLORS.background} /> : <Text style={styles.verifyButtonText}>Verify & Continue</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  highlight: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    backgroundColor: COLORS.backgroundLight,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: '#E8F0FE',
  },
  resendButton: {
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  resendBold: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.border,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  verifyButtonActive: {
    backgroundColor: COLORS.primary,
  },
  verifyButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});