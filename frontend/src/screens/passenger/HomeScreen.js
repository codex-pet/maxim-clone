import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import MapPlaceholder from '../../components/MapPlaceholder';
import FeatureCard from '../../components/FeatureCard';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import useLocation from '../../hooks/useLocation';
import { COLORS } from '../../constants/colors';

export default function HomeScreen({ route }) {
  const insets = useSafeAreaInsets();
  const { isConnected } = useNetworkStatus();
  const { location } = useLocation();
  const { user } = useAuth();
  const navigation = useNavigation();

  // User data from context or fallback to route params
  const userName = user?.name || route?.params?.userName || 'Guest User';
  const userEmail = user?.email || route?.params?.userEmail || '';

  // Button Action Handlers
  const handleOfflineBooking = () => {
    navigation.navigate('Lite');
  };

  const handleVoiceCommunication = () => {
    Alert.alert(
      "Voice Communication",
      "Hands-free voice communication and real-time translation will automatically activate once your driver picks you up."
    );
  };

  const handleLadiesOnlyMode = () => {
    const passengerGender = user?.gender?.toLowerCase() || '';

    // Block male passengers from accessing this feature
    if (passengerGender !== 'female' && passengerGender !== 'f') {
      Alert.alert(
        'Access Denied',
        'Ladies-Only mode is exclusively for verified female passengers to ensure safety.'
      );
      return;
    }

    // Navigate to the Book screen (You can pass a parameter to auto-select it if your BookScreen is configured to read it)
    navigation.navigate('Book', { preselectRideType: 'ladiesOnly' });
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header userName={userName} userEmail={userEmail} />

      {!isConnected && (
        <TouchableOpacity
          style={styles.offlineBanner}
          onPress={handleOfflineBooking}
        >
          <Ionicons name="flash-outline" size={16} color={COLORS.background} />
          <Text style={styles.offlineBannerText}>
            Poor connection detected — Tap to use Lite Mode
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.container}>
          <MapPlaceholder
            latitude={location?.coords.latitude}
            longitude={location?.coords.longitude}
          />
        </View>

        <View style={styles.view}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: COLORS.text }}>
            New Features
          </Text>

          {/* Wrapped in TouchableOpacity to guarantee it registers clicks */}
          <TouchableOpacity activeOpacity={0.7} onPress={handleOfflineBooking}>
            <FeatureCard
              icon="flash-outline"
              title="Offline Booking Mode"
              description="Allows user to book offline via SMS"
            />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} onPress={handleVoiceCommunication}>
            <FeatureCard
              icon="mic-outline"
              title="Voice Communication"
              description="Auto translate - Hands Free - Real Time"
            />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} onPress={handleLadiesOnlyMode}>
            <FeatureCard
              color={COLORS.ladiesOnly}
              icon="female-outline"
              title="Ladies Only Mode"
              description="Exclusively matched with female drivers"
            />
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  view: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 5, // Adds a little spacing between the cards
  },
  offlineBanner: {
    backgroundColor: COLORS.cta,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  offlineBannerText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: 'bold',
  },
});