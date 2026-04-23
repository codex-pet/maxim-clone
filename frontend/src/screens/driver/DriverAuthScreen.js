import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export default function DriverAuthScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [useEmail, setUseEmail] = useState(false);

  const handleContinue = () => {
    navigation.navigate('OTP', { phone, email, isLogin, isDriver: true });
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background, paddingTop: insets.top }}>

      {/* BACK BUTTON */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back-outline" size={24} color={COLORS.background} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="car-sport-outline" size={40} color={COLORS.background} />
          </View>
          <Text style={styles.appName}>MAXIM</Text>
          <Text style={styles.role}>Driver Portal</Text>
          <Text style={styles.tagline}>Earn, Drive, Deliver</Text>
        </View>

        {/* AUTH CARD */}
        <View style={styles.card}>

          {/* TAB SWITCHER */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, isLogin && styles.activeTab]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, !isLogin && styles.activeTab]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* TITLE */}
          <Text style={styles.title}>
            {isLogin ? 'Welcome Back, Driver!' : 'Become a Driver'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin
              ? 'Login to start accepting rides'
              : 'Register and start earning today'}
          </Text>

          {/* DRIVER BADGE */}
          <View style={styles.driverBadge}>
            <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.primary} />
            <Text style={styles.driverBadgeText}>
              Driver accounts require identity verification
            </Text>
          </View>

          {/* NAME FIELD - Register only */}
          {!isLogin && (
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.textSecondary}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>
          )}

          {/* PHONE INPUT */}
          {!useEmail && (
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

          {/* EMAIL INPUT */}
          {useEmail && (
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>
          )}

          {/* TOGGLE LOGIN METHOD */}
          <TouchableOpacity
            style={styles.toggleMethod}
            onPress={() => setUseEmail(!useEmail)}
          >
            <Ionicons
              name={useEmail ? 'phone-portrait-outline' : 'mail-outline'}
              size={16}
              color={COLORS.primary}
            />
            <Text style={styles.toggleMethodText}>
              {useEmail ? 'Use phone number instead' : 'Use email instead'}
            </Text>
          </TouchableOpacity>

          {/* CONTINUE BUTTON */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>
              {isLogin ? 'Send OTP' : 'Continue to Verification'}
            </Text>
            <Ionicons name="arrow-forward-outline" size={20} color={COLORS.background} />
          </TouchableOpacity>

          {/* REQUIREMENTS - Register only */}
          {!isLogin && (
            <View style={styles.requirementsCard}>
              <Text style={styles.requirementsTitle}>You will need:</Text>
              <View style={styles.requirementItem}>
                <Ionicons name="card-outline" size={16} color={COLORS.primary} />
                <Text style={styles.requirementText}>Valid Government ID</Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons name="camera-outline" size={16} color={COLORS.primary} />
                <Text style={styles.requirementText}>Clear Profile Photo</Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons name="phone-portrait-outline" size={16} color={COLORS.primary} />
                <Text style={styles.requirementText}>Active Phone Number</Text>
              </View>
            </View>
          )}

          {/* PASSENGER LINK */}
          <TouchableOpacity
            style={styles.passengerLink}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.passengerLinkText}>
              Looking to book a ride?{' '}
              <Text style={styles.passengerLinkBold}>Passenger Login</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  header: {
    backgroundColor: COLORS.primaryGreen,
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.background,
    letterSpacing: 4,
  },
  role: {
    fontSize: 16,
    color: COLORS.background,
    opacity: 0.9,
    marginTop: 4,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.background,
    opacity: 0.7,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 24,
    minHeight: 500,
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
    color: COLORS.primaryGreen,
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
    marginBottom: 16,
  },
  driverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F0FE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  driverBadgeText: {
    fontSize: 13,
    color: COLORS.primary,
    flex: 1,
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
    backgroundColor: COLORS.primaryGreen,
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
  requirementsCard: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  passengerLink: {
    alignItems: 'center',
  },
  passengerLinkText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  passengerLinkBold: {
    color: COLORS.primaryGreen,
    fontWeight: 'bold',
  },
});