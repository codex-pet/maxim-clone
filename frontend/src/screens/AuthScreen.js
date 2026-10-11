import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { apiFetch } from '../config/api';

// --- FIREBASE IMPORTS ---
import { PhoneAuthProvider } from 'firebase/auth';
import { getFirebaseAuth, firebaseConfig } from '../config/firebase';
import emailjs from '@emailjs/react-native';

// EmailJS credentials loaded from .env at runtime
const EMAILJS_SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY;

export default function AuthScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [useEmail, setUseEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState(''); // 'male' or 'female'

  const [isDriver, setIsDriver] = useState(false);
  const submissionInProgress = useRef(false);

  const checkUserExists = async (email, phone) => {
    const response = await apiFetch('/api/auth/check-exists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone })
    });
    const data = await response.json();

    if (!response.ok || typeof data.exists !== 'boolean') {
      throw new Error(data.message || 'Could not check this account. Please try again.');
    }

    return data.exists;
  };

  const handleContinue = async () => {
    if (submissionInProgress.current) return;

    if (useEmail) {
      if (!email || !email.includes('@')) {
        Alert.alert("Error", "Please enter a valid email address.");
        return;
      }
      await sendEmailOTP();
      return;
    }

    if (!phone || phone.length < 10) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number.");
      return;
    }

    if (!isLogin && !gender) {
      Alert.alert("Error", "Please select your gender.");
      return;
    }

    submissionInProgress.current = true;
    setLoading(true);

    try {
      const fullPhone = `+63${phone}`;

      // Check if user exists
      const exists = await checkUserExists(null, fullPhone);
      if (isLogin && !exists) {
        Alert.alert("No Account Found", "This phone number is not registered. Please register first.");
        setLoading(false);
        return;
      }
      if (!isLogin && exists) {
        Alert.alert("Account Exists", "This phone number is already registered. Please login instead.");
        setLoading(false);
        return;
      }

      let verificationId = 'dev-otp-123456';
      try {
        const phoneProvider = new PhoneAuthProvider(getFirebaseAuth());
        verificationId = await phoneProvider.verifyPhoneNumber(fullPhone);
      } catch (smsErr) {
        console.log("Firebase SMS fallback for Expo Go:", smsErr.message);
        verificationId = 'dev-otp-123456';
      }

      // 2. Navigate to OTP passing the Verification ID
      navigation.navigate('OTP', {
        phone: fullPhone,
        email,
        name,
        gender,
        isLogin,
        isDriver,
        verificationId
      });

    } catch (err) {
      console.log("SMS Error:", err);
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
      submissionInProgress.current = false;
    }
  };

  const sendEmailOTP = async () => {
    if (!isLogin && !gender) {
      Alert.alert("Error", "Please select your gender.");
      return;
    }

    if (submissionInProgress.current) return;
    submissionInProgress.current = true;
    setLoading(true);
    try {
      // Check if user exists
      const exists = await checkUserExists(email, null);
      if (isLogin && !exists) {
        Alert.alert("No Account Found", "This email is not registered. Please register first.");
        setLoading(false);
        return;
      }
      if (!isLogin && exists) {
        Alert.alert("Account Exists", "This email is already registered. Please login instead.");
        setLoading(false);
        return;
      }

      // Generate 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      console.log('EmailJS Config:', { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY });

      const templateParams = {
        to_email: email,
        otp_code: generatedOtp,
        user_name: name || 'Valued User'
      };

      // Pass the public key directly as the 4th argument — this is the reliable approach
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        { publicKey: EMAILJS_PUBLIC_KEY }
      );

      console.log("OTP sent to email:", email, "Code:", generatedOtp);
      Alert.alert("Success", "OTP sent to your email!");

      navigation.navigate('OTP', {
        phone: null,
        email,
        name,
        gender,
        isLogin,
        isDriver,
        verificationId: null,
        emailOtp: generatedOtp
      });
    } catch (err) {
      console.log("EmailJS Error:", err);
      Alert.alert("Error", err.message || "Failed to send email OTP.");
    } finally {
      setLoading(false);
      submissionInProgress.current = false;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.primary, paddingTop: insets.top }}>

      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: COLORS.primary }}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/img/goryde-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="GoRyde"
            />
          </View>
          {isDriver && <Text style={styles.driverLabel}>DRIVER</Text>}
          <Text style={styles.tagline}>{isDriver ? 'Drive and Earn with Ease' : 'Safe, Reliable, Always There'}</Text>
        </View>

        {/* AUTH CARD */}
        <View style={styles.card}>
          <View style={styles.tabRow}>
            <TouchableOpacity style={[styles.tab, isLogin && styles.activeTab]} onPress={() => setIsLogin(true)}>
              <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, !isLogin && styles.activeTab]} onPress={() => setIsLogin(false)}>
              <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Register</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{isLogin ? 'Welcome Back!' : 'Create Account'}</Text>
          <Text style={styles.subtitle}>
            {isDriver
              ? (isLogin ? 'Login to your driver account' : 'Register to start earning')
              : (isLogin ? 'Login to continue your ride experience' : 'Register to start booking rides')}
          </Text>

          {!isLogin && (
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />
                <TextInput style={styles.input} placeholder="Enter your full name" placeholderTextColor={COLORS.textSecondary} value={name} onChangeText={setName} />
              </View>
            </View>
          )}

          {!isLogin && (
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[styles.genderOption, gender === 'male' && styles.activeGender]}
                  onPress={() => setGender('male')}
                >
                  <Ionicons name="male-outline" size={20} color={gender === 'male' ? COLORS.background : COLORS.textSecondary} />
                  <Text style={[styles.genderText, gender === 'male' && styles.activeGenderText]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderOption, gender === 'female' && styles.activeGender]}
                  onPress={() => setGender('female')}
                >
                  <Ionicons name="female-outline" size={20} color={gender === 'female' ? COLORS.background : COLORS.textSecondary} />
                  <Text style={[styles.genderText, gender === 'female' && styles.activeGenderText]}>Female</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {useEmail ? (
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>
          ) : (
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.countryCode}>+63</Text>
                <View style={styles.inputDivider} />
                <TextInput
                  style={styles.input}
                  placeholder="9XX XXX XXXX"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={10}
                />
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.toggleMethod} onPress={() => setUseEmail(!useEmail)}>
            <Ionicons name={useEmail ? "phone-portrait-outline" : "mail-outline"} size={18} color={COLORS.primary} />
            <Text style={styles.toggleMethodText}>{useEmail ? 'Use Phone Number Instead' : 'Use Email Instead'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <>
                <Text style={styles.continueButtonText}>{isLogin ? 'Send OTP' : 'Create Account'}</Text>
                <Ionicons name="arrow-forward-outline" size={20} color={COLORS.background} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}><View style={styles.dividerLine} /><Text style={styles.dividerText}>or continue as</Text><View style={styles.dividerLine} /></View>

          <TouchableOpacity style={styles.guestButton} onPress={() => navigation.navigate('MainTabs')}>
            <Ionicons name="person-outline" size={20} color={COLORS.primary} /><Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.driverLink} onPress={() => {
            setIsDriver(!isDriver);
            setIsLogin(false);
          }}>
            <Text style={styles.driverLinkText}>
              {isDriver ? "Are you a passenger? " : "Are you a driver? "}
              <Text style={styles.driverLinkBold}>{isDriver ? "Login here" : "Register here"}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  logoCircle: {
    width: 164,
    height: 164,
    borderRadius: 82,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    marginBottom: 8,
  },
  logoImage: {
    width: 142,
    height: 142,
  },
  driverLabel: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.background,
    marginTop: 4,
    opacity: 0.9,
  },
  card: {
    backgroundColor: COLORS.background,
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginTop: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 2,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: COLORS.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  inputDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  toggleMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  toggleMethodText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  continueButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 16,
  },
  guestButtonText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  driverLink: {
    alignItems: 'center',
    marginTop: 8,
  },
  driverLinkText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  driverLinkBold: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeGender: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeGenderText: {
    color: COLORS.background,
  },
});