import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, Linking, Image, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LeafletMap from '../../components/LeafletMap';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

export default function DriverActiveTripScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { tripId } = route.params || {};

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [passengerPhone, setPassengerPhone] = useState('Fetching...');
  const [passengerPhoto, setPassengerPhoto] = useState(null);

  // HELPER: Cleans up any messy leftover text from SMS parsing
  const cleanDisplayString = (str) => {
    if (!str) return 'Not set';
    // Remove everything after known labels just in case backend parsing had leftovers
    let cleaned = str.split(/Pickup:|Dest:|Contact:|Type:|PGPS:|DGPS:/i)[0].trim();
    return cleaned;
  };

  useEffect(() => {
    if (tripId) {
      fetchTrip();
    } else {
      Alert.alert("Error", "No Trip ID provided.");
      navigation.goBack();
    }
  }, [tripId]);

  // Handle Phone and Photo Resolution
  useEffect(() => {
    if (!trip) return;

    if (trip.bookingMethod === 'SMS_LITE_MODE') {
      // SMS users: Use the phone number saved directly in the trip object
      const rawPhone = trip.passengerPhone || 'Not Set';
      setPassengerPhone(rawPhone.trim());
      setPassengerPhoto(null); // SMS users don't have profile photos
    } else {
      // App users: Check nested passengerId object
      const pObj = trip.passengerId;
      if (pObj && typeof pObj === 'object' && pObj.phoneNumber) {
        setPassengerPhone(pObj.phoneNumber);
        setPassengerPhoto(pObj.profilePhoto || null);
      } else {
        // Fallback: If passengerId is just a string ID, fetch the user profile
        const pId = typeof pObj === 'string' ? pObj : pObj?._id;
        if (pId) {
          fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${pId}`)
            .then(res => res.json())
            .then(data => {
              const pData = data?.user || data;
              setPassengerPhone(pData?.phoneNumber || 'Not Set');
              setPassengerPhoto(pData?.profilePhoto || null);
            })
            .catch(() => setPassengerPhone('Unavailable'));
        }
      }
    }
  }, [trip]);

  const fetchTrip = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/trips/${tripId}`);
      const data = await response.json();
      if (data.success) {
        setTrip(data.trip);
      } else {
        Alert.alert("Error", "Could not find trip details.");
      }
    } catch (error) {
      console.error('Fetch error:', error);
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
          Alert.alert("Success", "Trip completed!");
          navigation.navigate('DriverTabs');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCall = () => {
    if (!passengerPhone || passengerPhone === 'Fetching...' || passengerPhone === 'Not Set') {
      Alert.alert("Error", "Phone number not available.");
      return;
    }
    const cleanPhone = passengerPhone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`);
  };

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>
    );
  }

  const isSms = trip?.bookingMethod === 'SMS_LITE_MODE';
  const displayPassengerName = cleanDisplayString(trip?.passengerName || trip?.passengerId?.name || 'Passenger');

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Trip</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Map Section */}
      <View style={styles.mapContainer}>
        {trip && (
          <LeafletMap
            pickup={{ lat: trip.pickupLocation.latitude, lng: trip.pickupLocation.longitude }}
            destination={{ lat: trip.dropoffLocation.latitude, lng: trip.dropoffLocation.longitude }}
          />
        )}
      </View>

      {/* Details Section */}
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Passenger Profile Row */}
          <View style={styles.passengerHeader}>
            <View style={styles.avatar}>
              {passengerPhoto ? (
                <Image source={{ uri: passengerPhoto }} style={styles.avatarImg} />
              ) : (
                <Ionicons name="person" size={24} color="#FFF" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.passengerName} numberOfLines={1}>{displayPassengerName}</Text>
                {isSms && <View style={styles.liteBadge}><Text style={styles.liteBadgeText}>LITE</Text></View>}
              </View>
              <Text style={styles.passengerLabel}>{isSms ? 'SMS Offline Booking' : 'App User'}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
              <Ionicons name="call" size={22} color={COLORS.primaryGreen} />
            </TouchableOpacity>
          </View>

          {/* Contact Display Box */}
          <View style={styles.infoBox}>
            <Ionicons name="phone-portrait-outline" size={18} color={COLORS.primary} />
            <View>
              <Text style={styles.infoLabel}>CONTACT NUMBER</Text>
              <Text style={styles.infoValue}>{passengerPhone}</Text>
            </View>
          </View>

          {/* Distance and Fare Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>DISTANCE</Text>
              <Text style={styles.statValue}>{trip?.distance?.toFixed(1) || '0.0'} km</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>EST. FARE</Text>
              <Text style={[styles.statValue, { color: COLORS.primaryGreen }]}>₱{trip?.estimatedFare}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>METHOD</Text>
              <Text style={styles.statValue}>CASH</Text>
            </View>
          </View>

          {/* Cleaned Address Card */}
          <View style={styles.addressCard}>
            <View style={styles.locRow}>
              <View style={[styles.dot, { backgroundColor: COLORS.primaryGreen }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locHeader}>PICKUP</Text>
                <Text style={styles.locText} numberOfLines={2}>{cleanDisplayString(trip?.pickupLocation?.address)}</Text>
              </View>
            </View>
            <View style={styles.line} />
            <View style={styles.locRow}>
              <View style={[styles.dot, { backgroundColor: COLORS.danger }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locHeader}>DESTINATION</Text>
                <Text style={styles.locText} numberOfLines={2}>{cleanDisplayString(trip?.dropoffLocation?.address)}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons based on Status */}
          <View style={styles.actions}>
            {trip?.tripStatus === 'Accepted' && (
              <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.primary }]} onPress={() => updateStatus('Arriving')} disabled={updating}>
                {updating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>I Have Arrived</Text>}
              </TouchableOpacity>
            )}

            {trip?.tripStatus === 'Arriving' && (
              <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.cta }]} onPress={() => updateStatus('In Progress')} disabled={updating}>
                {updating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Start Ride</Text>}
              </TouchableOpacity>
            )}

            {trip?.tripStatus === 'In Progress' && (
              <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.primaryGreen }]} onPress={() => updateStatus('Completed')} disabled={updating}>
                {updating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Complete Trip</Text>}
              </TouchableOpacity>
            )}
          </View>

        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: COLORS.primary, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  mapContainer: { flex: 1 },
  content: {
    height: '55%',
    backgroundColor: COLORS.background,
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  passengerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  passengerName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, maxWidth: '65%' },
  passengerLabel: { fontSize: 11, color: COLORS.textSecondary },
  liteBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  liteBadgeText: { fontSize: 10, color: '#1976D2', fontWeight: 'bold' },
  callBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F5F5F5', padding: 12, borderRadius: 12, marginBottom: 15 },
  infoLabel: { fontSize: 9, color: COLORS.textSecondary, fontWeight: 'bold' },
  infoValue: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  stat: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  addressCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  locRow: { flexDirection: 'row', gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 14 },
  locHeader: { fontSize: 9, color: COLORS.textSecondary, fontWeight: 'bold' },
  locText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  line: { width: 1, height: 20, backgroundColor: '#EEE', marginLeft: 3.5, marginVertical: 2 },
  actions: { marginTop: 20 },
  btn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});