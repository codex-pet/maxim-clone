import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export default function DriverPendingScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ANIMATED ICON */}
      <View style={styles.iconWrapper}>
        <View style={styles.iconOuter}>
          <View style={styles.iconInner}>
            <Ionicons name="time-outline" size={48} color={COLORS.primary} />
          </View>
        </View>
      </View>

      {/* CONTENT */}
      <Text style={styles.title}>Application Submitted!</Text>
      <Text style={styles.subtitle}>
        Your documents are under review. Our team will verify your account within 24 hours.
      </Text>

      {/* STATUS STEPS */}
      <View style={styles.stepsCard}>
        <View style={styles.step}>
          <View style={[styles.stepIcon, { backgroundColor: COLORS.primaryGreen }]}>
            <Ionicons name="checkmark-outline" size={16} color={COLORS.background} />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Documents Submitted</Text>
            <Text style={styles.stepSubtitle}>Your ID and photo have been received</Text>
          </View>
        </View>

        <View style={styles.stepLine} />

        <View style={styles.step}>
          <View style={[styles.stepIcon, { backgroundColor: COLORS.cta }]}>
            <Ionicons name="search-outline" size={16} color={COLORS.background} />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Under Review</Text>
            <Text style={styles.stepSubtitle}>Our team is verifying your documents</Text>
          </View>
        </View>

        <View style={styles.stepLine} />

        <View style={styles.step}>
          <View style={[styles.stepIcon, { backgroundColor: COLORS.border }]}>
            <Ionicons name="car-outline" size={16} color={COLORS.background} />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Account Activated</Text>
            <Text style={styles.stepSubtitle}>You'll receive an SMS when approved</Text>
          </View>
        </View>
      </View>

      {/* INFO CARD */}
      <View style={styles.infoCard}>
        <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
        <Text style={styles.infoText}>
          You'll receive an SMS notification once your account is approved. This usually takes 24 hours.
        </Text>
      </View>

      {/* BACK TO LOGIN */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Auth')}
      >
        <Text style={styles.backButtonText}>Back to Login</Text>
      </TouchableOpacity>

      <Text style={styles.contactText}>
        Need help?{' '}
        <Text style={styles.contactLink}>Contact Support</Text>
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginBottom: 24,
  },
  iconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  stepsCard: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  stepSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  stepLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.border,
    marginLeft: 15,
    marginVertical: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#E8F0FE',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 18,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  backButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  contactLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});