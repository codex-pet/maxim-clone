import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useState, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

export default function OTPScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);
  const { phone, email, isLogin, isDriver } = route.params;

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

const handleVerify = () => {
  if (isDriver) {
    navigation.navigate('DriverUpload', { phone, email });
  } else {
    navigation.navigate('MainTabs');
  }
};
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background, paddingTop: insets.top }}>

      {/* BACK BUTTON */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back-outline" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      <View style={styles.content}>

        {/* ICON */}
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark-outline" size={48} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Verify Your Account</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit OTP to{'\n'}
          <Text style={styles.highlight}>
            {phone ? `+63 ${phone}` : email}
          </Text>
        </Text>

        {/* OTP INPUTS */}
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

        {/* RESEND */}
        <TouchableOpacity style={styles.resendButton}>
          <Text style={styles.resendText}>
            Didn't receive the code?{' '}
            <Text style={styles.resendBold}>Resend OTP</Text>
          </Text>
        </TouchableOpacity>

        {/* VERIFY BUTTON */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            otp.every(d => d !== '') && styles.verifyButtonActive
          ]}
          onPress={handleVerify}
          disabled={!otp.every(d => d !== '')}
        >
          <Text style={styles.verifyButtonText}>Verify & Continue</Text>
          <Ionicons name="checkmark-outline" size={20} color={COLORS.background} />
        </TouchableOpacity>

        {/* NOTE */}
        <Text style={styles.note}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>

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
  },
});