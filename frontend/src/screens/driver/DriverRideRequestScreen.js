import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LeafletMap from '../../components/LeafletMap';
import MapPlaceholder from '../../components/MapPlaceholder';
import SOSModal from '../../components/SOSModal';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

const TIMER_SECONDS = 30;

export default function DriverRideRequestScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Extracting data from route params with heavy fallbacks
  const {
    isLadiesOnly = false,
    tripId,
    pickupLocation = {},
    dropoffLocation = {},
    estimatedFare = 0,
    distance = 0,
    passengerId = '',
    passengerName: rawName = '',
    passengerPhone: rawPhone = '',
    bookingMethod = ''
  } = route.params || {};

  // Helper to remove SMS labels safely without crashing
  const cleanSmsLabels = (str) => {
    if (!str) return '';
    if (typeof str !== 'string') return String(str);
    return str.replace(/(Passenger:|Pickup:|Dest:|Contact:|Type:|PGPS:|DGPS:)/gi, '').trim();
  };

  // State
  const [isSmsMode, setIsSmsMode] = useState(bookingMethod === 'SMS_LITE_MODE');
  const [resolvedPhone, setResolvedPhone] = useState('Loading...');
  const [passengerName, setPassengerName] = useState(cleanSmsLabels(rawName) || 'Loading...');
  const [sosVisible, setSosVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [hasResponded, setHasResponded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [displayPickup, setDisplayPickup] = useState(cleanSmsLabels(pickupLocation?.address) || 'Detecting...');
  const [displayDropoff, setDisplayDropoff] = useState(cleanSmsLabels(dropoffLocation?.address) || 'Anywhere');

  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;

  // Safe Coordinates for Map rendering (Prevents Leaflet from crashing)
  const pLat = parseFloat(pickupLocation?.latitude || 0);
  const pLng = parseFloat(pickupLocation?.longitude || 0);
  const dLat = parseFloat(dropoffLocation?.latitude || 0);
  const dLng = parseFloat(dropoffLocation?.longitude || 0);

  const hasValidPickupCoords = !isNaN(pLat) && !isNaN(pLng) && pLat !== 0 && pLng !== 0;
  const hasValidDropoffCoords = !isNaN(dLat) && !isNaN(dLng) && dLat !== 0 && dLng !== 0;

  // 1. Resolve Passenger Details Safely
  useEffect(() => {
    const resolveDetails = async () => {
      // If we already know it's SMS mode
      if (bookingMethod === 'SMS_LITE_MODE') {
        setResolvedPhone(cleanSmsLabels(rawPhone) || 'SMS User');
        setPassengerName(cleanSmsLabels(rawName) || 'SMS Passenger');
        return;
      }

      // App User Logic
      if (passengerId && typeof passengerId === 'object') {
        setResolvedPhone(passengerId.phoneNumber || 'Not Available');
        setPassengerName(passengerId.name || 'Passenger');
      } else if (typeof passengerId === 'string' && passengerId !== 'SMS_USER_ID') {
        try {
          const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${passengerId}`);
          const data = await response.json();

          if (data?.success && data?.user) {
            setResolvedPhone(data.user.phoneNumber || 'Not Available');
            setPassengerName(data.user.name || 'Passenger');
          } else {
            // User not found -> It's a Lite Mode SMS booking!
            setIsSmsMode(true);
            setResolvedPhone(cleanSmsLabels(rawPhone) || 'SMS Trip');
            setPassengerName(cleanSmsLabels(rawName) || 'SMS Passenger');
          }
        } catch (err) {
          // Fallback if network fails
          setResolvedPhone(cleanSmsLabels(rawPhone) || 'Not Available');
          setPassengerName(cleanSmsLabels(rawName) || 'Passenger');
        }
      } else {
        setIsSmsMode(true);
        setResolvedPhone(cleanSmsLabels(rawPhone) || 'SMS Trip');
        setPassengerName(cleanSmsLabels(rawName) || 'SMS Passenger');
      }
    };
    resolveDetails();
  }, [passengerId, rawPhone, rawName, bookingMethod]);

  // 2. Reverse Geocode Pickup if it's just coordinates
  useEffect(() => {
    const resolveAddress = async () => {
      if ((displayPickup.includes('Current') || displayPickup.includes('8.')) && hasValidPickupCoords) {
        try {
          const rev = await Location.reverseGeocodeAsync({
            latitude: pLat,
            longitude: pLng
          });
          if (rev && rev.length > 0) {
            const item = rev[0];
            const addr = `${item.name || ''} ${item.street || ''}, ${item.city || ''}`.trim().replace(/,$/, '');
            if (addr) setDisplayPickup(addr);
          }
        } catch (e) { console.log('Reverse Geocode Error:', e); }
      }
    };
    resolveAddress();
  }, [pLat, pLng, displayPickup, hasValidPickupCoords]);

  // 3. Timer Logic
  useEffect(() => {
    if (hasResponded || isProcessing) return;
    if (timeLeft <= 0) { handleDecline(); return; }
    const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, hasResponded, isProcessing]);

  // 4. Animations
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
    Animated.timing(timerAnim, { toValue: 0, duration: TIMER_SECONDS * 1000, useNativeDriver: false }).start();
  }, []);

  const handleAccept = async () => {
    if (hasResponded || isProcessing) return;
    setHasResponded(true);
    setIsProcessing(true);

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/trips/${tripId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: user?.id || user?._id })
      });

      const result = await response.json();
      if (result.success) {
        navigation.replace('DriverActiveTrip', { tripId: result.trip._id });
      } else {
        Alert.alert('Trip Taken', result.message || 'Already accepted by another driver.');
        navigation.navigate('DriverTabs');
      }
    } catch (error) {
      setIsProcessing(false);
      setHasResponded(false);
      Alert.alert('Error', 'Failed to accept trip. Check your connection.');
    }
  };

  const handleDecline = () => {
    if (hasResponded) return;
    setHasResponded(true);
    navigation.navigate('DriverTabs', { declinedTripId: tripId });
  };

  const timerColor = timeLeft > 15 ? COLORS.primaryGreen : timeLeft > 5 ? COLORS.cta : COLORS.danger;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.backgroundLight, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Incoming Request</Text>
        <TouchableOpacity style={styles.sosButton} onPress={() => setSosVisible(true)}>
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timerBarContainer}>
        <Animated.View style={[styles.timerBar, {
          backgroundColor: timerColor,
          width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
        }]} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={[
          styles.requestBanner,
          { transform: [{ scale: pulseAnim }] },
          isLadiesOnly && styles.requestBannerLadies
        ]}>
          <View style={styles.timerCircle}>
            <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}</Text>
          </View>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>{isLadiesOnly ? '👩 Ladies-Only Request' : '🚗 New Ride Request'}</Text>
            <Text style={styles.bannerSubtitle}>{passengerName} is looking for a ride</Text>
          </View>
        </Animated.View>

        <View style={styles.passengerCard}>
          <View style={[styles.avatarContainer, isLadiesOnly && { backgroundColor: '#FCE4EC' }]}>
            <Ionicons
              name={isLadiesOnly ? 'female' : 'person'}
              size={24}
              color={isLadiesOnly ? COLORS.ladiesOnly : COLORS.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.passengerName} numberOfLines={1}>{passengerName}</Text>
            <Text style={styles.phoneText}>{resolvedPhone}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: isSmsMode ? '#E3F2FD' : '#E8F5E9' }]}>
            <Text style={[styles.badgeText, { color: isSmsMode ? '#1976D2' : COLORS.primaryGreen }]}>
              {isSmsMode ? 'LITE' : 'APP'}
            </Text>
          </View>
        </View>

        {/* Prevent Map Crashes if Macrodroid didn't send coordinates */}
        <View style={styles.mapContainer}>
          {hasValidPickupCoords ? (
            <LeafletMap
              pickup={{ lat: pLat, lng: pLng }}
              destination={hasValidDropoffCoords ? { lat: dLat, lng: dLng } : null}
            />
          ) : (
            <MapPlaceholder />
          )}
        </View>

        <View style={styles.tripCard}>
          <Text style={styles.tripCardTitle}>TRIP DETAILS</Text>

          <View style={styles.tripRow}>
            <Ionicons name="location" size={18} color={COLORS.primaryGreen} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.locLabel}>PICKUP</Text>
              <Text style={styles.locText} numberOfLines={2}>{displayPickup}</Text>
            </View>
          </View>

          <View style={styles.lineDivider} />

          <View style={styles.tripRow}>
            <Ionicons name="flag" size={18} color={COLORS.danger} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.locLabel}>DESTINATION</Text>
              <Text style={styles.locText} numberOfLines={2}>{displayDropoff}</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>DISTANCE</Text>
              <Text style={styles.statValue}>{parseFloat(distance || 0).toFixed(2)} km</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>EST. FARE</Text>
              <Text style={[styles.statValue, { color: COLORS.primaryGreen }]}>₱{estimatedFare}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.declineBtn} onPress={handleDecline} disabled={isProcessing}>
          <Text style={styles.declineBtnText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.acceptBtn, isLadiesOnly && styles.acceptBtnLadies]}
          onPress={handleAccept}
          disabled={isProcessing}
        >
          {isProcessing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.acceptBtnText}>Accept Ride</Text>}
        </TouchableOpacity>
      </View>

      <SOSModal visible={sosVisible} onClose={() => setSosVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.primary },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  sosButton: { backgroundColor: COLORS.danger, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  sosText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  timerBarContainer: { height: 4, backgroundColor: '#EEE', width: '100%' },
  timerBar: { height: 4 },
  requestBanner: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: COLORS.primary, margin: 16, borderRadius: 16, padding: 16, elevation: 4 },
  requestBannerLadies: { backgroundColor: COLORS.ladiesOnly },
  timerCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  timerText: { fontSize: 20, fontWeight: 'bold' },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  bannerSubtitle: { fontSize: 12, color: '#FFF', opacity: 0.9 },
  passengerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 12, elevation: 2, gap: 12 },
  avatarContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  passengerName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  phoneText: { fontSize: 12, color: COLORS.textSecondary },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  mapContainer: { height: 300, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 16, backgroundColor: '#EEE' },
  tripCard: { backgroundColor: '#FFF', marginHorizontal: 16, borderRadius: 16, padding: 16, elevation: 2 },
  tripCardTitle: { fontSize: 10, fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: 15, letterSpacing: 1 },
  tripRow: { flexDirection: 'row', alignItems: 'flex-start' },
  locLabel: { fontSize: 9, color: COLORS.textSecondary, fontWeight: 'bold' },
  locText: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 2 },
  lineDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12, marginLeft: 28 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  footer: { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 30, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE' },
  declineBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.danger, alignItems: 'center' },
  declineBtnText: { color: COLORS.danger, fontWeight: 'bold' },
  acceptBtn: { flex: 2, paddingVertical: 16, borderRadius: 12, backgroundColor: COLORS.primaryGreen, alignItems: 'center' },
  acceptBtnLadies: { backgroundColor: COLORS.ladiesOnly },
  acceptBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});