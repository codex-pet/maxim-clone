import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LeafletMap from '../../components/LeafletMap';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

export default function DriverActiveTripScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth(); // Logged-in Driver
  const { tripId } = route.params || {};

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Reliable Contact States
  const [driverPhone, setDriverPhone] = useState('Fetching...');
  const [passengerPhone, setPassengerPhone] = useState('Fetching...');
  const [passengerPhoto, setPassengerPhoto] = useState(null);

  useEffect(() => {
    fetchTrip();
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

  useEffect(() => {
    if (!trip) return;

    // 1. Resolve Driver (Self) Phone
    const dPhone = user?.phoneNumber || user?.phone;
    if (dPhone) {
      setDriverPhone(dPhone);
    } else {
      const myId = user?.id || user?._id;
      if (myId) {
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${myId}`)
          .then(res => res.json())
          .then(data => {
            const num = data?.user?.phoneNumber || data?.data?.phoneNumber || data?.phoneNumber;
            setDriverPhone(num || 'Not Set');
          }).catch(() => setDriverPhone('Error'));
      } else {
        setDriverPhone('Not Set');
      }
    }

    // 2. Resolve Passenger Phone
    const pObj = trip.passengerId;
    if (pObj && pObj.phoneNumber) {
      // Data already populated in trip object
      setPassengerPhone(pObj.phoneNumber);
      setPassengerPhoto(pObj.profilePhoto || null);
    } else {
      // Need to fetch from DB
      const pId = typeof pObj === 'object' ? (pObj?._id || pObj?.id) : pObj;
      if (pId) {
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${pId}`)
          .then(res => res.json())
          .then(data => {
            const pData = data?.user || data?.data || data;
            setPassengerPhone(pData?.phoneNumber || pData?.phone || 'Not Set');
            setPassengerPhoto(pData?.profilePhoto || null);
          }).catch(() => setPassengerPhone('Error'));
      } else {
        setPassengerPhone('Not Set');
      }
    }
  }, [trip, user]);

  const fetchTrip = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/trips/${tripId}`);
      const data = await response.json();
      if (data.success) {
        setTrip(data.trip);
      }
    } catch (error) {
      console.error('Fetch trip error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/trips/${tripId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        setTrip(data.trip);
        if (newStatus === 'Completed') {
          Alert.alert('Trip Completed', 'You have successfully finished this trip.', [
            { text: 'OK', onPress: () => navigation.navigate('DriverTabs') }
          ]);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !trip) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const passengerName = trip?.passengerId?.name && trip.passengerId.name.trim() !== ''
    ? trip.passengerId.name
    : 'Passenger';

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Current Trip</Text>
      </View>

      <View style={styles.mapContainer}>
        {trip && (
          <LeafletMap
            pickup={{ lat: trip.pickupLocation.latitude, lng: trip.pickupLocation.longitude }}
            destination={{ lat: trip.dropoffLocation.latitude, lng: trip.dropoffLocation.longitude }}
          />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.passengerCard}>

          <View style={styles.passengerHeader}>
            <View style={styles.avatar}>
              {passengerPhoto ? (
                <Image source={{ uri: passengerPhoto }} style={{ width: 56, height: 56, borderRadius: 28 }} />
              ) : (
                <Ionicons name="person" size={24} color={COLORS.background} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.passengerLabel}>Passenger</Text>
              <Text style={styles.passengerName}>{passengerName}</Text>
            </View>

            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => handleCall(passengerPhone)}
            >
              <Ionicons name="call" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.contactDetailsContainer}>
            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>Passenger Phone:</Text>
              <Text style={styles.contactNumber}>
                <Ionicons name="call" size={12} /> {passengerPhone}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.tripInfo}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>DISTANCE</Text>
              <Text style={styles.infoValue}>{trip?.distance.toFixed(1)} km</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>FARE</Text>
              <Text style={styles.infoValue}>₱ {trip?.estimatedFare}</Text>
            </View>
          </View>

          <View style={styles.locationContainer}>
            <View style={styles.locRow}>
              <View style={[styles.dot, { backgroundColor: COLORS.primaryGreen }]} />
              <Text style={styles.locText} numberOfLines={1}>{trip?.pickupLocation?.address}</Text>
            </View>
            <View style={styles.line} />
            <View style={styles.locRow}>
              <View style={[styles.dot, { backgroundColor: COLORS.danger }]} />
              <Text style={styles.locText} numberOfLines={1}>{trip?.dropoffLocation?.address}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          {trip?.tripStatus === 'Accepted' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
              onPress={() => updateStatus('Arriving')}
              disabled={updating}
            >
              {updating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionBtnText}>I Have Arrived</Text>}
            </TouchableOpacity>
          )}

          {trip?.tripStatus === 'Arriving' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.cta }]}
              onPress={() => updateStatus('In Progress')}
              disabled={updating}
            >
              {updating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionBtnText}>Start Trip</Text>}
            </TouchableOpacity>
          )}

          {trip?.tripStatus === 'In Progress' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.primaryGreen }]}
              onPress={() => updateStatus('Completed')}
              disabled={updating}
            >
              {updating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionBtnText}>Complete Trip</Text>}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: COLORS.primary, paddingBottom: 16, alignItems: 'center' },
  headerTitle: { color: COLORS.background, fontSize: 18, fontWeight: 'bold' },
  mapContainer: { flex: 1 },
  content: { backgroundColor: COLORS.background, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -30, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12 },
  passengerCard: { gap: 10 },
  passengerHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  passengerLabel: { fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  passengerName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  callBtn: { marginLeft: 'auto', width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  contactDetailsContainer: { backgroundColor: '#F9F9F9', borderRadius: 8, padding: 12, marginTop: 5, marginBottom: 5 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  contactLabel: { fontSize: 13, color: COLORS.textSecondary },
  contactNumber: { fontSize: 13, fontWeight: 'bold', color: COLORS.primary },
  divider: { height: 1, backgroundColor: '#F1F3F5', marginVertical: 8 },
  tripInfo: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#F8F9FA', paddingVertical: 16, borderRadius: 16 },
  infoItem: { alignItems: 'center' },
  infoLabel: { fontSize: 10, color: COLORS.textSecondary, marginBottom: 4, textTransform: 'uppercase' },
  infoValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  locationContainer: { backgroundColor: '#F9F9F9', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#F1F3F5', marginTop: 10 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  locText: { fontSize: 14, color: COLORS.text, flex: 1, fontWeight: '500' },
  line: { width: 2, height: 20, backgroundColor: '#E9ECEF', marginLeft: 5, marginVertical: 2 },
  actions: { marginTop: 28 },
  actionBtn: { paddingVertical: 18, borderRadius: 16, alignItems: 'center', elevation: 2 },
  actionBtnText: { color: COLORS.background, fontSize: 17, fontWeight: 'bold' },
});