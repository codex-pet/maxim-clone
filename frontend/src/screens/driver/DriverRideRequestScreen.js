import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Alert } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapPlaceholder from '../../components/MapPlaceholder';
import LeafletMap from '../../components/LeafletMap';
import SOSModal from '../../components/SOSModal';
import { COLORS } from '../../constants/colors';

// Import AuthContext to get driver info
import { useAuth } from '../../context/AuthContext';

const TIMER_SECONDS = 30;

export default function DriverRideRequestScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  // Get driver info
  const { user } = useAuth();

  const {
    isLadiesOnly,
    tripId,
    pickupLocation,
    dropoffLocation,
    estimatedFare,
    distance,
    passengerId
  } = route.params || {};

  const passengerName = (passengerId?.name && passengerId.name.trim() !== '')
    ? passengerId.name
    : 'Passenger';

  // Failsafe: Immediately auto-decline or hide the screen if the driver is MALE
  useEffect(() => {
    const driverGender = user?.gender?.toLowerCase() || '';
    if (isLadiesOnly && driverGender !== 'female' && driverGender !== 'f') {
      console.log('Blocked: Male driver received a Ladies-Only request. Auto-rejecting.');
      navigation.goBack(); // Instantly removes the screen for male drivers
    }
  }, [isLadiesOnly, user]);

  const [sosVisible, setSosVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [hasResponded, setHasResponded] = useState(false);
  const [displayPickup, setDisplayPickup] = useState(route.params?.pickupLocation?.address || 'Detecting...');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const resolveAddress = async () => {
      if (displayPickup === 'Current Location' && route.params?.pickupLocation?.latitude) {
        try {
          const rev = await Location.reverseGeocodeAsync({
            latitude: route.params.pickupLocation.latitude,
            longitude: route.params.pickupLocation.longitude
          });
          if (rev && rev.length > 0) {
            const item = rev[0];
            const addr = `${item.name || ''} ${item.street || ''}, ${item.city || ''}`.trim().replace(/,$/, '');
            if (addr) setDisplayPickup(addr);
          }
        } catch (e) { console.log('Resolve error:', e); }
      }
    };
    resolveAddress();
  }, [route.params?.pickupLocation]);

  // Pulse animation for incoming request banner
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (hasResponded) return; // Stop timer if action taken
    if (timeLeft <= 0) {
      handleDecline(); // Automatically decline if timer runs out
      return;
    }
    const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, hasResponded]);

  // Timer bar animation
  useEffect(() => {
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: TIMER_SECONDS * 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  const handleAccept = async () => {
    if (hasResponded) return;
    setHasResponded(true);

    const acceptDriverId = route.params?.driverId || user?.id || '6578a1b2c3d4e5f60708090b';

    if (!tripId) {
      // If it's just a simulation without a real tripId, navigate back to home
      navigation.navigate('DriverTabs', { screen: 'DriverHome' });
      return;
    }

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/trips/${tripId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: acceptDriverId })
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Success', 'Ride accepted! Navigate to pickup point.');
        navigation.replace('DriverActiveTrip', { tripId: result.trip._id });
      } else {
        // FIX: Handle "Already Taken" scenario by redirecting to Home Screen
        Alert.alert(
          'Ride Unavailable',
          result.message || 'This ride has already been taken by another driver.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to the Driver Dashboard (Home Screen)
                navigation.navigate('DriverTabs', { screen: 'DriverHome' });
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Acceptance error:', error);
      Alert.alert('Error', 'Could not connect to the server.');
      setHasResponded(false); // Reset so they can try clicking again if it was a network drop
    }
  };

  const handleDecline = async () => {
    if (hasResponded) return;
    setHasResponded(true);

    try {
      // Notify passenger by setting status to Cancelled (Prototype logic)
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/trips/${tripId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' })
      });
      navigation.navigate('DriverTabs', {
        screen: 'DriverHome',
        params: { declinedTripId: tripId }
      });
    } catch (error) {
      console.error('Decline error:', error);
      navigation.goBack();
    }
  };

  const timerColor = timeLeft > 15
    ? COLORS.primaryGreen
    : timeLeft > 5
      ? COLORS.cta
      : COLORS.danger;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.backgroundLight, paddingTop: insets.top }}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Incoming Ride Request</Text>
        <TouchableOpacity
          style={styles.sosButton}
          onPress={() => setSosVisible(true)}
        >
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>
      </View>

      {/* TIMER BAR */}
      <View style={styles.timerBarContainer}>
        <Animated.View style={[styles.timerBar, {
          backgroundColor: timerColor,
          width: timerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          })
        }]} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

        {/* INCOMING REQUEST BANNER */}
        <Animated.View style={[
          styles.requestBanner,
          { transform: [{ scale: pulseAnim }] },
          isLadiesOnly && styles.requestBannerLadies
        ]}>
          <View style={styles.timerCircle}>
            <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}</Text>
            <Text style={styles.timerLabel}>secs</Text>
          </View>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>
              {isLadiesOnly ? '👩 Ladies-Only Request' : '🚗 New Ride Request'}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {isLadiesOnly
                ? 'Female passenger requesting female driver'
                : 'Passenger is requesting a ride'}
            </Text>
          </View>
        </Animated.View>

        {/* LADIES ONLY BADGE */}
        {isLadiesOnly && (
          <View style={styles.ladiesOnlyBanner}>
            <Ionicons name="female-outline" size={16} color={COLORS.ladiesOnly} />
            <Text style={styles.ladiesOnlyText}>
              Ladies-Only ride — Female passenger requesting verified female driver only
            </Text>
          </View>
        )}

        {/* PASSENGER INFO */}
        <View style={styles.passengerCard}>
          <View style={styles.passengerLeft}>
            <View style={styles.avatarContainer}>
              <Ionicons
                name={isLadiesOnly ? 'female-outline' : 'person-outline'}
                size={28}
                color={isLadiesOnly ? COLORS.ladiesOnly : COLORS.primary}
              />
            </View>
            <View>
              <Text style={styles.passengerName}>{passengerName}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={COLORS.ctaYellow} />
                <Text style={styles.ratingText}>4.8 • 124 trips</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.callPassengerButton}>
            <Ionicons name="call-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* MAP */}
        <View style={styles.mapContainer}>
          {pickupLocation && dropoffLocation ? (
            <LeafletMap
              pickup={{ lat: pickupLocation.latitude, lng: pickupLocation.longitude }}
              destination={{ lat: dropoffLocation.latitude, lng: dropoffLocation.longitude }}
            />
          ) : (
            <MapPlaceholder color={isLadiesOnly ? COLORS.ladiesOnly : null} />
          )}
        </View>

        {/* TRIP DETAILS */}
        <View style={styles.tripCard}>
          <Text style={styles.tripCardTitle}>Trip Details</Text>

          <View style={styles.tripRow}>
            <View style={styles.tripDotContainer}>
              <View style={[styles.tripDot, { backgroundColor: COLORS.primaryGreen }]} />
              <View style={styles.tripLine} />
              <View style={[styles.tripDot, { backgroundColor: COLORS.primary }]} />
            </View>
            <View style={styles.tripLocations}>
              <View style={styles.tripLocation}>
                <Text style={styles.tripLocationLabel}>Pickup</Text>
                <Text style={styles.tripLocationText}>{displayPickup}</Text>
              </View>
              <View style={styles.tripLocation}>
                <Text style={styles.tripLocationLabel}>Destination</Text>
                <Text style={styles.tripLocationText}>{dropoffLocation?.address || 'Not set'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.tripStatsRow}>
            <View style={styles.tripStat}>
              <Ionicons name="navigate-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.tripStatText}>{distance ? distance.toFixed(1) : '0.0'} km</Text>
            </View>
            <View style={styles.tripStat}>
              <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.tripStatText}>~{distance ? Math.round(distance * 3) : '??'} mins</Text>
            </View>
            <View style={styles.tripStat}>
              <Ionicons name="cash-outline" size={16} color={COLORS.primaryGreen} />
              <Text style={[styles.tripStatText, { color: COLORS.primaryGreen, fontWeight: 'bold' }]}>
                ₱ {estimatedFare || (isLadiesOnly ? '100' : '90')}
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* ACCEPT / DECLINE BUTTONS */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={handleDecline}
        >
          <Ionicons name="close-outline" size={24} color={COLORS.danger} />
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.acceptButton, isLadiesOnly && styles.acceptButtonLadies]}
          onPress={handleAccept}
        >
          <Ionicons name="checkmark-outline" size={24} color={COLORS.background} />
          <Text style={styles.acceptButtonText}>Accept Ride</Text>
        </TouchableOpacity>
      </View>

      <SOSModal
        visible={sosVisible}
        onClose={() => setSosVisible(false)}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  sosButton: {
    backgroundColor: COLORS.danger,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  sosText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  timerBarContainer: {
    height: 4,
    backgroundColor: COLORS.border,
    width: '100%',
  },
  timerBar: {
    height: 4,
  },
  requestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.primary,
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  requestBannerLadies: {
    backgroundColor: COLORS.ladiesOnly,
  },
  timerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  timerLabel: {
    fontSize: 10,
    color: COLORS.background,
    opacity: 0.8,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: COLORS.background,
    opacity: 0.8,
    marginTop: 4,
  },
  ladiesOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FCE4EC',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.ladiesOnly,
    marginBottom: 8,
  },
  ladiesOnlyText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.ladiesOnly,
  },
  passengerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passengerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarContainerLadies: {
    backgroundColor: '#FCE4EC',
    borderColor: COLORS.ladiesOnly,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  callPassengerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapContainer: {
    alignItems: 'center',
    marginBottom: 16,
    height: 300,
    width: '100%',
    paddingHorizontal: 16,
  },
  tripCard: {
    backgroundColor: COLORS.background,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tripCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  tripRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tripDotContainer: {
    alignItems: 'center',
    paddingTop: 4,
  },
  tripDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tripLine: {
    width: 2,
    height: 40,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  tripLocations: {
    flex: 1,
    gap: 16,
  },
  tripLocation: {
    gap: 2,
  },
  tripLocationLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tripLocationText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tripStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tripStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripStatText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.danger,
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primaryGreen,
  },
  acceptButtonLadies: {
    backgroundColor: COLORS.ladiesOnly,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.background,
  },
});