import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LeafletMap from '../../components/LeafletMap';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

export default function ActiveTripScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth(); // Logged-in Passenger
  const { tripId } = route.params || {};

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef(null);

  // Reliable Contact States
  const [driverPhone, setDriverPhone] = useState('Fetching...');
  const [passengerPhone, setPassengerPhone] = useState('Fetching...');
  const [driverVehicle, setDriverVehicle] = useState({});
  const [driverPhoto, setDriverPhoto] = useState(null);

  useEffect(() => {
    fetchTrip();
    startPolling();
    return () => stopPolling();
  }, []);

  // Safe Phone Call Handler (Bypasses Simulator Bugs)
  const handleCall = (phone) => {
    if (!phone || phone.includes('Fetch') || phone.includes('Not Set') || phone.includes('Error')) {
      Alert.alert("Missing Details", "The phone number is not available yet.");
      return;
    }

    // Remove all non-numeric characters except the '+' sign
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const url = `tel:${cleanPhone}`;

    // Force open the dialer
    Linking.openURL(url).catch(() => {
      Alert.alert(
        "Action Not Supported",
        `Your device cannot make calls.\nPhone number: ${cleanPhone}`
      );
    });
  };

  // Run this whenever 'trip' updates to fetch the real contact numbers
  useEffect(() => {
    if (!trip) return;

    // 1. Resolve Passenger (Self) Phone
    const pPhone = user?.phoneNumber || user?.phone;
    if (pPhone) {
      setPassengerPhone(pPhone);
    } else {
      const myId = user?.id || user?._id;
      if (myId) {
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${myId}`)
          .then(res => res.json())
          .then(data => {
            const num = data?.user?.phoneNumber || data?.data?.phoneNumber || data?.phoneNumber;
            setPassengerPhone(num || 'Not Set');
          }).catch(() => setPassengerPhone('Error'));
      } else {
        setPassengerPhone('Not Set');
      }
    }

    // 2. Resolve Driver Phone & Vehicle
    const dObj = trip.driverId;
    if (dObj && dObj.phoneNumber) {
      // Data already populated in trip object
      setDriverPhone(dObj.phoneNumber);
      setDriverVehicle(dObj.vehicleInfo || {});
      setDriverPhoto(dObj.profilePhoto || null);
    } else {
      // Need to fetch from DB
      const dId = typeof dObj === 'object' ? (dObj?._id || dObj?.id) : dObj;
      if (dId) {
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${dId}`)
          .then(res => res.json())
          .then(data => {
            const dData = data?.user || data?.data || data;
            setDriverPhone(dData?.phoneNumber || dData?.phone || 'Not Set');
            setDriverVehicle(dData?.vehicleInfo || {});
            setDriverPhoto(dData?.profilePhoto || null);
          }).catch(() => setDriverPhone('Error'));
      } else {
        setDriverPhone('Not Set');
      }
    }
  }, [trip, user]);

  const fetchTrip = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/trips/${tripId}`);
      const data = await response.json();
      if (data.success) {
        setTrip(data.trip);
        if (data.trip.tripStatus === 'Completed' || data.trip.tripStatus === 'Cancelled') {
          stopPolling();
          Alert.alert('Trip Ended', `This trip has been ${data.trip.tripStatus.toLowerCase()}.`, [
            { text: 'OK', onPress: () => navigation.navigate('MainTabs') }
          ]);
        }
      }
    } catch (error) {
      console.error('Fetch trip error:', error);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    pollingRef.current = setInterval(fetchTrip, 3000);
  };

  const stopPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
  };

  if (loading && !trip) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'Accepted': return 'Driver is on the way';
      case 'Arriving': return 'Driver is arriving at pickup';
      case 'In Progress': return 'Trip in progress';
      case 'Completed': return 'Arrived at destination';
      default: return status;
    }
  };

  const driverName = trip?.driverId?.name || 'Driver Assigned';

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.navigate('MainTabs')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.background} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Trip</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.mapContainer}>
        {trip && (
          <LeafletMap
            pickup={{ lat: trip.pickupLocation.latitude, lng: trip.pickupLocation.longitude }}
            destination={{ lat: trip.dropoffLocation.latitude, lng: trip.dropoffLocation.longitude }}
          />
        )}
      </View>

      <View style={styles.statusBanner}>
        <Ionicons name="time-outline" size={20} color={COLORS.background} />
        <Text style={styles.statusText}>{getStatusText(trip?.tripStatus)}</Text>
      </View>

      <View style={styles.driverCard}>
        <View style={styles.driverInfo}>
          <View style={styles.avatar}>
            {driverPhoto ? (
              <Image source={{ uri: driverPhoto }} style={{ width: 60, height: 60, borderRadius: 30 }} />
            ) : (
              <Ionicons name="person" size={30} color={COLORS.background} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName}>{driverName}</Text>
            <Text style={styles.vehicleInfo}>
              {driverVehicle?.color || 'White'} {driverVehicle?.model || 'Vehicle'} •{' '}
              <Text style={{ fontWeight: 'bold' }}>{driverVehicle?.plateNumber || 'TBA'}</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => handleCall(driverPhone)}
          >
            <Ionicons name="call" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Real Contact Info (Driver & Passenger) */}
        <View style={styles.contactDetailsContainer}>
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>Driver Phone:</Text>
            <Text style={styles.contactNumber}>
              <Ionicons name="call" size={12} /> {driverPhone}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.tripDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={18} color={COLORS.primaryGreen} />
            <Text style={styles.detailText} numberOfLines={1}>{trip?.pickupLocation?.address}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="pin" size={18} color={COLORS.danger} />
            <Text style={styles.detailText} numberOfLines={1}>{trip?.dropoffLocation?.address}</Text>
          </View>
        </View>

        <View style={styles.fareContainer}>
          <Text style={styles.fareLabel}>Total Fare</Text>
          <Text style={styles.fareValue}>₱ {trip?.estimatedFare}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: COLORS.background, fontSize: 18, fontWeight: 'bold' },
  mapContainer: { flex: 1 },
  statusBanner: { backgroundColor: COLORS.primaryGreen, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
  statusText: { color: COLORS.background, fontWeight: 'bold', fontSize: 15 },
  driverCard: { backgroundColor: COLORS.background, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40, borderTopLeftRadius: 32, borderTopRightRadius: 32, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12 },
  driverInfo: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  driverName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
  vehicleInfo: { fontSize: 13, color: COLORS.textSecondary },
  callBtn: { marginLeft: 'auto', width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  contactDetailsContainer: { backgroundColor: '#F9F9F9', borderRadius: 8, padding: 12, marginBottom: 5 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  contactLabel: { fontSize: 13, color: COLORS.textSecondary },
  contactNumber: { fontSize: 13, fontWeight: 'bold', color: COLORS.primary },
  divider: { height: 1, backgroundColor: '#F1F3F5', marginVertical: 20 },
  tripDetails: { gap: 14, paddingHorizontal: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailText: { fontSize: 14, color: COLORS.text, flex: 1, fontWeight: '500' },
  fareContainer: { marginTop: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F1F3F5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fareLabel: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  fareValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.primaryGreen },
});