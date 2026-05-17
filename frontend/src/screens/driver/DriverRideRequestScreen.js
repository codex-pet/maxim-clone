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

  // Extract params (ensure passengerPhone is included from the notification/poller)
  const {
    isLadiesOnly,
    tripId,
    pickupLocation,
    dropoffLocation,
    estimatedFare,
    distance,
    passengerId,
    passengerName: smsPassengerName,
    passengerPhone: rawPhone, // 👈 Added this
    bookingMethod
  } = route.params || {};

  const isSms = bookingMethod === 'SMS_LITE_MODE';

  // HELPER: Robust cleaning for names and addresses
  const cleanDisplayString = (str) => {
    if (!str) return 'Not set';
    return str.split(/Pickup:|Dest:|Contact:|Type:|PGPS:|DGPS:/i)[0].trim();
  };

  const passengerName = cleanDisplayString(smsPassengerName || passengerId?.name || 'Passenger');
  const passengerPhone = rawPhone ? rawPhone.trim() : 'Not Available';

  const [sosVisible, setSosVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [hasResponded, setHasResponded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [displayPickup, setDisplayPickup] = useState(pickupLocation?.address || 'Detecting...');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const resolveAddress = async () => {
      if ((displayPickup.includes('Current') || displayPickup.includes('Detecting')) && pickupLocation?.latitude) {
        try {
          const rev = await Location.reverseGeocodeAsync({
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude
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
  }, []);

  // Timer & Animation Logic
  useEffect(() => {
    if (hasResponded || isProcessing) return;
    if (timeLeft <= 0) { handleDecline(); return; }
    const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, hasResponded, isProcessing]);

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
        Alert.alert('Trip Taken', 'Already accepted by another driver.');
        navigation.navigate('DriverTabs');
      }
    } catch (error) {
      setIsProcessing(false);
      setHasResponded(false);
      Alert.alert('Error', 'Connection failed.');
    }
  };

  const handleDecline = async () => {
    if (hasResponded) return;
    setHasResponded(true);
    navigation.navigate('DriverTabs');
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
        {/* Animated Banner */}
        <Animated.View style={[styles.requestBanner, { transform: [{ scale: pulseAnim }] }, isLadiesOnly && styles.requestBannerLadies]}>
          <View style={styles.timerCircle}>
            <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}</Text>
          </View>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>{isLadiesOnly ? '👩 Ladies-Only Request' : '🚗 New Ride Request'}</Text>
            <Text style={styles.bannerSubtitle}>{passengerName} is nearby</Text>
          </View>
        </Animated.View>

        {/* Passenger Info Card */}
        <View style={styles.passengerCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name={isLadiesOnly ? 'female' : 'person'} size={24} color={isLadiesOnly ? COLORS.ladiesOnly : COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.passengerName} numberOfLines={1}>{passengerName}</Text>
            <Text style={styles.phoneText}>{passengerPhone}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: isSms ? '#E3F2FD' : '#E8F5E9' }]}>
            <Text style={[styles.badgeText, { color: isSms ? '#1976D2' : COLORS.primaryGreen }]}>
              {isSms ? 'LITE' : 'APP'}
            </Text>
          </View>
        </View>

        {/* Map View */}
        <View style={styles.mapContainer}>
          {pickupLocation?.latitude ? (
            <LeafletMap
              pickup={{ lat: pickupLocation.latitude, lng: pickupLocation.longitude }}
              destination={dropoffLocation?.latitude ? { lat: dropoffLocation.latitude, lng: dropoffLocation.longitude } : null}
            />
          ) : <MapPlaceholder />}
        </View>

        {/* Trip Details */}
        <View style={styles.tripCard}>
          <Text style={styles.tripCardTitle}>TRIP DETAILS</Text>

          <View style={styles.tripRow}>
            <Ionicons name="location" size={18} color={COLORS.primaryGreen} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.locLabel}>PICKUP</Text>
              <Text style={styles.locText} numberOfLines={2}>{cleanDisplayString(displayPickup)}</Text>
            </View>
          </View>

          <View style={styles.lineDivider} />

          <View style={styles.tripRow}>
            <Ionicons name="flag" size={18} color={COLORS.danger} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.locLabel}>DESTINATION</Text>
              <Text style={styles.locText} numberOfLines={2}>{cleanDisplayString(dropoffLocation?.address)}</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>DISTANCE</Text>
              <Text style={styles.statValue}>{distance || '0.0'} km</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>EST. FARE</Text>
              <Text style={[styles.statValue, { color: COLORS.primaryGreen }]}>₱{estimatedFare}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.declineBtn} onPress={handleDecline} disabled={isProcessing}>
          <Text style={styles.declineBtnText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.acceptBtn, isLadiesOnly && styles.acceptBtnLadies]} onPress={handleAccept} disabled={isProcessing}>
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