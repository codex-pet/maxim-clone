import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, Animated } from 'react-native';
import { useState, useRef, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapPlaceholder from '../../components/MapPlaceholder';
import LeafletMap from '../../components/LeafletMap';
import Header from '../../components/Header';
import SOSModal from '../../components/SOSModal';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

export default function DriverHomeScreen({ navigation, route }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { gender, userName, userEmail } = route.params || {};
  const driverName = user?.name || userName || 'Driver';

  const driverGender = user?.gender || gender || '';
  const isFemaleDriver = driverGender.toLowerCase() === 'female' || driverGender.toLowerCase() === 'f';

  const [isOnline, setIsOnline] = useState(false);
  const [sosVisible, setSosVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [declinedTripIds, setDeclinedTripIds] = useState([]);
  const lastNavigatedTripId = useRef(null);
  const [stats, setStats] = useState({ tripsCount: 0, earningsToday: 0, rating: 4.8 });
  const [recentTripsData, setRecentTripsData] = useState([]);

  useEffect(() => {
    if (route.params?.declinedTripId) {
      const tripId = route.params.declinedTripId;
      if (!declinedTripIds.includes(tripId)) {
        setDeclinedTripIds(prev => [...prev, tripId]);
        console.log('[TEST LOG] Trip added to declined list:', tripId);
      }
    }
  }, [route.params?.declinedTripId]);

  const fetchDriverSummary = useCallback(async () => {
    try {
      const driverId = route.params?.userId || user?.id;
      if (!driverId) return;

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/trips/driver-summary/${driverId}`);
      const result = await response.json();
      if (result.success) {
        setStats(result.stats);
        const processed = await Promise.all(result.recentTrips.map(async (t) => {
          if (t.from === 'Current Location' && t.fromCoords?.latitude) {
            try {
              const rev = await Location.reverseGeocodeAsync({
                latitude: t.fromCoords.latitude,
                longitude: t.fromCoords.longitude
              });
              if (rev && rev.length > 0) {
                const item = rev[0];
                const addr = `${item.name || ''} ${item.street || ''}, ${item.city || ''}`.trim().replace(/,$/, '');
                return { ...t, from: addr || 'Current Location' };
              }
            } catch (e) { /* ignore */ }
          }
          return t;
        }));
        setRecentTripsData(processed);
      }
    } catch (error) {
      console.error('[TEST LOG] Error fetching driver summary:', error);
    }
  }, [route.params?.userId, user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchDriverSummary();
    }, [fetchDriverSummary])
  );

  // UPDATED POLLING LOGIC
  useFocusEffect(
    useCallback(() => {
      let pollInterval;
      if (isOnline) {
        pollInterval = setInterval(async () => {
          try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/trips/latest-pending?driverGender=${driverGender}`);
            const result = await response.json();

            if (result.success && result.trip) {
              const trip = result.trip;

              // FIX: Ignore if already declined OR if it's already been accepted by another driver
              if (declinedTripIds.includes(trip._id) || lastNavigatedTripId.current === trip._id || trip.tripStatus !== 'Looking for Driver') {
                return;
              }

              lastNavigatedTripId.current = trip._id;

              // FIX: Ensure coordinates are passed as Numbers (parseFloat) so the Map works
              navigation.navigate('DriverRideRequest', {
                isLadiesOnly: trip.rideType === 'Ladies-Only',
                tripId: trip._id,
                driverId: route.params?.userId || user?.id,
                pickupLocation: {
                  address: trip.pickupLocation.address,
                  latitude: parseFloat(trip.pickupLocation.latitude),
                  longitude: parseFloat(trip.pickupLocation.longitude)
                },
                dropoffLocation: {
                  address: trip.dropoffLocation.address,
                  latitude: parseFloat(trip.dropoffLocation.latitude),
                  longitude: parseFloat(trip.dropoffLocation.longitude)
                },
                estimatedFare: trip.estimatedFare,
                distance: trip.distance,
                passengerId: trip.passengerId,
                passengerName: trip.passengerName // For SMS Users
              });
            } else {
              // If no pending trip exists, reset our ref so the next one can trigger correctly
              lastNavigatedTripId.current = null;
            }
          } catch (error) {
            console.error('[DRIVER POLL] Error:', error);
          }
        }, 5000);
      }

      return () => {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      };
    }, [isOnline, declinedTripIds, driverGender])
  );

  const toggleOnline = async (val) => {
    setIsOnline(val);
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/trips/driver-status/${route.params?.userId || user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: val ? 'Online' : 'Offline' })
      });
    } catch (e) {
      console.log('Status update error:', e.message);
    }
  };

  const overlayAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(300)).current;

  const openProfile = () => {
    setProfileVisible(true);
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(modalAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
    ]).start();
  };

  const closeProfile = () => {
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(modalAnim, { toValue: 300, duration: 300, useNativeDriver: true }),
    ]).start(() => setProfileVisible(false));
  };

  const handleLogout = () => {
    closeProfile();
    setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
    }, 300);
  };

  const simulateRequest = async (isLadiesOnly) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/trips/latest-pending?driverGender=${driverGender}`);
      const result = await response.json();
      if (result.success && result.trip) {
        navigation.navigate('DriverRideRequest', {
          isLadiesOnly: result.trip.rideType === 'Ladies-Only',
          tripId: result.trip._id,
          driverId: route.params?.userId || user?.id
        });
      } else {
        navigation.navigate('DriverRideRequest', { isLadiesOnly });
      }
    } catch (error) {
      navigation.navigate('DriverRideRequest', { isLadiesOnly });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.backgroundLight, paddingTop: insets.top }}>
      <Header userName={driverName} userEmail={user?.email || userEmail} />

      <TouchableOpacity
        style={[styles.statusBanner, { backgroundColor: isOnline ? COLORS.primaryGreen : COLORS.danger }]}
        onPress={() => toggleOnline(!isOnline)}
      >
        <Ionicons name={isOnline ? "radio-outline" : "power-outline"} size={16} color={COLORS.background} />
        <Text style={styles.statusBannerText}>
          {isOnline ? 'You are ONLINE — Ready for requests' : 'You are OFFLINE — Tap to go Online'}
        </Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {isFemaleDriver && (
          <View style={styles.ladiesOnlyBanner}>
            <Ionicons name="female-outline" size={16} color={COLORS.ladiesOnly} />
            <Text style={styles.ladiesOnlyText}>
              Ladies-Only Verified Driver — You can receive Ladies-Only ride requests
            </Text>
          </View>
        )}

        <View style={[styles.statusCard, { borderColor: isOnline ? COLORS.primaryGreen : COLORS.border }]}>
          <View style={styles.statusCardLeft}>
            <Ionicons
              name={isOnline ? 'radio-outline' : 'power-outline'}
              size={32}
              color={isOnline ? COLORS.primaryGreen : COLORS.textSecondary}
            />
            <View>
              <Text style={styles.statusCardTitle}>
                {isOnline ? 'You are Online' : 'You are Offline'}
              </Text>
              <Text style={styles.statusCardSubtitle}>
                {isOnline ? 'Waiting for ride requests...' : 'Toggle to start accepting rides'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.toggleButton, { backgroundColor: isOnline ? COLORS.primaryGreen : COLORS.primary }]}
            onPress={() => toggleOnline(!isOnline)}
          >
            <Text style={styles.toggleButtonText}>{isOnline ? 'Go Offline' : 'Go Online'}</Text>
          </TouchableOpacity>
        </View>

        {isOnline && (
          <TouchableOpacity style={styles.testRequestButton} onPress={() => simulateRequest(false)}>
            <Ionicons name="notifications-outline" size={16} color={COLORS.background} />
            <Text style={styles.testRequestText}>Simulate Ride Request</Text>
          </TouchableOpacity>
        )}

        {isOnline && isFemaleDriver && (
          <TouchableOpacity style={[styles.testRequestButton, { backgroundColor: COLORS.ladiesOnly }]} onPress={() => simulateRequest(true)}>
            <Ionicons name="female-outline" size={16} color={COLORS.background} />
            <Text style={styles.testRequestText}>Simulate Ladies-Only Request</Text>
          </TouchableOpacity>
        )}

        <View style={styles.mapContainer}><LeafletMap /></View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="car-outline" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{stats.tripsCount}</Text>
            <Text style={styles.statLabel}>Trips Today</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={24} color={COLORS.primaryGreen} />
            <Text style={styles.statValue}>₱ {stats.earningsToday.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Earnings Today</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star-outline" size={24} color={COLORS.ctaYellow} />
            <Text style={styles.statValue}>{stats.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Trips</Text>
          {recentTripsData.length > 0 ? (
            recentTripsData.map(trip => (
              <View key={trip.id} style={styles.tripCard}>
                <View style={styles.tripLeft}>
                  <View style={styles.tripIconContainer}><Ionicons name="car-outline" size={20} color={COLORS.primary} /></View>
                  <View style={styles.tripInfo}>
                    <View style={styles.tripHeaderRow}>
                      <Text style={styles.tripPassenger} numberOfLines={1}>{trip.passenger}</Text>
                      {trip.bookingMethod === 'SMS_LITE_MODE' && <View style={styles.liteModeBadge}><Text style={styles.liteModeBadgeText}>LITE</Text></View>}
                      {trip.rideType === 'Ladies-Only' && <View style={styles.ladiesOnlyBadge}><Ionicons name="female" size={10} color={COLORS.ladiesOnly} /><Text style={styles.ladiesOnlyBadgeText}>Ladies</Text></View>}
                    </View>
                    <Text style={styles.tripRoute} numberOfLines={1}>{trip.from}</Text>
                    <Text style={styles.tripRoute} numberOfLines={1}>→ {trip.to}</Text>
                    <Text style={styles.tripDate}>{trip.date}</Text>
                  </View>
                </View>
                <View style={styles.tripRight}>
                  <View style={[styles.statusBadge, { backgroundColor: trip.status === 'Completed' ? '#E8F5E9' : '#FFEBEE' }]}><Text style={[styles.statusBadgeText, { color: trip.status === 'Completed' ? COLORS.primaryGreen : COLORS.danger }]}>{trip.status}</Text></View>
                  <Text style={styles.tripFare}>{trip.fare}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}><Text style={styles.emptyStateText}>No recent trips found</Text></View>
          )}
        </View>
      </ScrollView>

      <SOSModal visible={sosVisible} onClose={() => setSosVisible(false)} />

      <Modal visible={profileVisible} transparent animationType="none" onRequestClose={closeProfile}>
        <Animated.View style={[styles.modalContainer, { opacity: overlayAnim }]}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeProfile} />
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: modalAnim }] }]}>
            <View style={styles.modalHandle} />
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainerModal}><Ionicons name="person-outline" size={36} color={COLORS.primary} /></View>
              <View><Text style={styles.profileName}>{driverName}</Text><Text style={styles.profileEmail}>{user?.email || 'Driver Account'}</Text></View>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuItem}><Ionicons name="person-outline" size={22} color={COLORS.primary} /><Text style={styles.menuItemText}>Edit Profile</Text><Ionicons name="chevron-forward-outline" size={18} color={COLORS.textSecondary} /></TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}><Ionicons name="time-outline" size={22} color={COLORS.primary} /><Text style={styles.menuItemText}>Trip History</Text><Ionicons name="chevron-forward-outline" size={18} color={COLORS.textSecondary} /></TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}><Ionicons name="settings-outline" size={22} color={COLORS.primary} /><Text style={styles.menuItemText}>Settings</Text><Ionicons name="chevron-forward-outline" size={18} color={COLORS.textSecondary} /></TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}><Ionicons name="log-out-outline" size={22} color={COLORS.danger} /><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
  statusBannerText: { color: COLORS.background, fontSize: 14, fontWeight: 'bold' },
  ladiesOnlyBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FCE4EC', padding: 12, marginHorizontal: 16, marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.ladiesOnly },
  ladiesOnlyText: { flex: 1, fontSize: 13, color: COLORS.ladiesOnly },
  statusCard: { backgroundColor: COLORS.background, borderRadius: 12, padding: 16, margin: 16, borderWidth: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  statusCardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  statusCardSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  toggleButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  toggleButtonText: { color: COLORS.background, fontSize: 13, fontWeight: 'bold' },
  testRequestButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, padding: 12, borderRadius: 12, marginHorizontal: 16, marginBottom: 12, justifyContent: 'center' },
  testRequestText: { color: COLORS.background, fontWeight: 'bold', fontSize: 14 },
  mapContainer: { alignItems: 'center', marginBottom: 16, height: 200, marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: COLORS.background, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },
  section: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  tripCard: { backgroundColor: COLORS.background, borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.border },
  tripLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  tripIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.backgroundLight, alignItems: 'center', justifyContent: 'center' },
  tripInfo: { flex: 1 },
  tripHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 10 },
  tripPassenger: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, flexShrink: 1 },
  tripRoute: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, paddingRight: 8 },
  tripDate: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  tripFare: { fontSize: 15, fontWeight: 'bold', color: COLORS.primaryGreen },
  tripRight: { alignItems: 'flex-end', justifyContent: 'center', gap: 8, minWidth: 70 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  liteModeBadge: { backgroundColor: '#FFEBEE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: COLORS.danger },
  liteModeBadgeText: { fontSize: 9, color: COLORS.danger, fontWeight: 'bold', letterSpacing: 0.5 },
  ladiesOnlyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFE4E6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 2 },
  ladiesOnlyBadgeText: { fontSize: 9, color: COLORS.ladiesOnly, fontWeight: 'bold' },
  emptyState: { padding: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
  emptyStateText: { color: COLORS.textSecondary, fontSize: 14 },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalOverlay: { flex: 1 },
  modalContent: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  avatarContainerModal: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.backgroundLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.border },
  profileName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  profileEmail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  menuItemText: { flex: 1, fontSize: 15, color: COLORS.text },
  logoutButton: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  logoutText: { fontSize: 15, fontWeight: 'bold', color: COLORS.danger },
});