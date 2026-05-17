import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator, Image } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';

// Custom Components
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import LeafletMap from '../../components/LeafletMap';
import LocationInput from '../../components/LocationInput';
import RideTypeSelector from '../../components/RideTypeSelector';
import BookButton from '../../components/BookButton';
import LadiesOnlyBanner from '../../components/LadiesOnlyBanner';

// Hooks & Constants
import useNetworkStatus from '../../hooks/useNetworkStatus';
import { COLORS } from '../../constants/colors';

export default function BookScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { isConnected } = useNetworkStatus();
  const { user } = useAuth(); // Contains passenger info including gender
  const nav = useNavigation();

  // Trip Params
  const userName = route?.params?.userName || route?.params?.params?.userName || user?.name || 'User';
  const userEmail = route?.params?.userEmail || route?.params?.params?.userEmail || user?.email || '';
  const passengerId = user?.id || route?.params?.userId || route?.params?.params?.userId || '6578a1b2c3d4e5f60708090a';
  const acceptedTrip = route?.params?.acceptedTrip;

  // New State for Fetched Driver Data
  const [driverData, setDriverData] = useState(null);

  useEffect(() => {
    if (acceptedTrip) {
      const driverIdToFetch = typeof acceptedTrip.driverId === 'object' ? acceptedTrip.driverId._id : acceptedTrip.driverId;
      if (driverIdToFetch) {
        fetchDriverDetails(driverIdToFetch);
      }
    }
  }, [acceptedTrip]);

  const fetchDriverDetails = async (driverId) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${driverId}`);
      const data = await response.json();
      if (response.ok) {
        setDriverData(data.user || data);
      }
    } catch (error) {
      console.error('Error fetching driver details:', error);
    }
  };

  // Pre-select ride type if navigated from the Home Screen features
  const [rideType, setRideType] = useState(route.params?.preselectRideType || 'standard');
  const [pickup, setPickup] = useState('Detecting location...');
  const [destination, setDestination] = useState('');

  const [pickupCoords, setPickupCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [routeInfo, setRouteInfo] = useState({ distance: 0, duration: 0 });
  const [estimatedFare, setEstimatedFare] = useState(0);

  const [suggestions, setSuggestions] = useState([]);
  const [activeInput, setActiveInput] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const debounceTimer = useRef(null);

  const isLadiesOnly = rideType === 'ladiesOnly';

  // Intercept ride type selection to block male passengers
  const handleRideTypeSelect = (selectedType) => {
    const passengerGender = user?.gender?.toLowerCase() || '';

    if (selectedType === 'ladiesOnly') {
      if (passengerGender !== 'female' && passengerGender !== 'f') {
        Alert.alert(
          'Feature Restricted',
          'Ladies-Only mode is exclusively available for verified female passengers to ensure safety and comfort.'
        );
        setRideType('standard'); // Force it back to standard
        return;
      }
    }
    setRideType(selectedType);
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      let enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert("Location Disabled", "Please enable location services.");
        setPickup('Location disabled');
        return;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Enable location in settings to use auto-pickup.");
        setPickup('Permission denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { lat: location.coords.latitude, lng: location.coords.longitude };
      setPickupCoords(coords);

      try {
        const reverseGeocode = await Location.reverseGeocodeAsync(location.coords);
        if (reverseGeocode && reverseGeocode.length > 0) {
          const item = reverseGeocode[0];
          const actualAddress = `${item.name || ''} ${item.street || ''}, ${item.city || ''}`.trim().replace(/,$/, '');
          setPickup(actualAddress || 'Current Location');
        } else {
          setPickup('Current Location');
        }
      } catch (e) {
        console.log('Reverse geocode error:', e);
        setPickup('Current Location');
      }
    } catch (error) {
      console.error('GPS Error:', error);
      setPickup('Error detecting location');
    }
  };

  const fetchSuggestions = async (query, type) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setActiveInput(type);

    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`;

      // 1. Add headers to prevent the server from blocking the request and returning HTML
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MyRideApp/1.0' // Sometimes required by public APIs
        }
      });

      // 2. Extract as text first to safely check the response
      const text = await response.text();

      // 3. If response starts with '<', it's HTML (Error/Cloudflare Challenge)
      if (text.trim().startsWith('<')) {
        console.warn('Photon API returned HTML. Using Nominatim Fallback API...');

        // --- Fallback to OpenStreetMap Nominatim API ---
        const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
        const fallbackResponse = await fetch(fallbackUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'MyRideApp/1.0' // Required by Nominatim
          }
        });

        const fallbackData = await fallbackResponse.json();
        if (fallbackData && fallbackData.length > 0) {
          const formatted = fallbackData.map(f => ({
            display_name: f.display_name,
            lat: f.lat,
            lon: f.lon,
          }));
          setSuggestions(formatted);
        }
        return; // Exit here since we used the fallback
      }

      // 4. If it's valid JSON, parse and map it
      const data = JSON.parse(text);

      if (data && data.features) {
        const formatted = data.features.map(f => {
          const name = f.properties.name || '';
          const city = f.properties.city || f.properties.state || '';
          const separator = name && city ? ', ' : '';

          return {
            display_name: `${name}${separator}${city}`.trim(),
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0],
          };
        });
        setSuggestions(formatted);
      }
    } catch (error) {
      console.log('Search API error:', error);
    }
  };

  const handleInputChange = (text, type) => {
    if (type === 'pickup') setPickup(text);
    else setDestination(text);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchSuggestions(text, type), 800);
  };

  const handleSelectSuggestion = (item) => {
    const coords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
    const name = item.display_name.split(',')[0];

    if (activeInput === 'pickup') {
      setPickup(name);
      setPickupCoords(coords);
    } else {
      setDestination(name);
      setDestinationCoords(coords);
    }
    setSuggestions([]);
    setActiveInput(null);
  };

  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1.3;
  };

  useEffect(() => {
    if (pickupCoords && destinationCoords) {
      const dist = getDistanceFromLatLonInKm(pickupCoords.lat, pickupCoords.lng, destinationCoords.lat, destinationCoords.lng);
      setRouteInfo(prev => ({
        ...prev,
        distance: prev.distance > 0 ? prev.distance : dist,
        duration: prev.duration > 0 ? prev.duration : dist * 3
      }));
    }
  }, [pickupCoords, destinationCoords]);

  useEffect(() => {
    if (routeInfo.distance > 0) {
      const baseFare = 40;
      const ratePerKm = 15;
      let total = baseFare + (routeInfo.distance * ratePerKm);
      if (isLadiesOnly) total += 10;
      setEstimatedFare(Math.round(total));
    }
  }, [routeInfo, isLadiesOnly]);

  const handleBookPress = async () => {
    if (!destinationCoords || !pickupCoords) {
      Alert.alert('Missing Info', 'Please ensure both pickup and destination are set.');
      return;
    }

    // Backend Safety Check
    const passengerGender = user?.gender?.toLowerCase() || '';
    if (isLadiesOnly && passengerGender !== 'female' && passengerGender !== 'f') {
      Alert.alert('Access Denied', 'Ladies-Only rides are exclusively for female passengers.');
      return;
    }

    setIsBooking(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passengerId,
          pickupLocation: { address: pickup, latitude: pickupCoords.lat, longitude: pickupCoords.lng },
          dropoffLocation: { address: destination, latitude: destinationCoords.lat, longitude: destinationCoords.lng },
          distance: routeInfo.distance,
          estimatedFare,
          rideType: isLadiesOnly ? 'Ladies-Only' : 'Standard',
          requiredDriverGender: isLadiesOnly ? 'female' : 'any' // MUST TELL BACKEND TO FIND FEMALE
        })
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('API HTML Error (POST trips):', text.substring(0, 100));
        Alert.alert("Server Error", "Backend crashed or returned HTML.");
        return;
      }

      if (response.ok || result.success) {
        const extractedTripId = result.trip?._id || result.data?._id || result._id || result.id;

        if (!extractedTripId) {
          Alert.alert('Data Error', 'Backend did not return a valid Trip ID.');
          return;
        }

        navigation.navigate('Payment', {
          isLadiesOnly,
          tripId: extractedTripId,
          pickup,
          destination,
          pickupCoords,
          destinationCoords,
          distance: routeInfo.distance,
          estimatedFare
        });
      } else {
        Alert.alert("Booking Failed", result.message || "Could not process request.");
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert("Network Error", "Could not connect to the server.");
    } finally {
      setIsBooking(false);
    }
  };

  const driverName = driverData?.name || acceptedTrip?.driverId?.name || "Driver Assigned";
  const driverVehicle = driverData?.vehicleInfo || acceptedTrip?.driverId?.vehicleInfo || {};
  const driverPhone = driverData?.phoneNumber || acceptedTrip?.driverId?.phoneNumber || 'No Contact Info';
  const passengerPhone = user?.phoneNumber || 'No Contact Info';

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: COLORS.background }}>
      <Header userName={userName} userEmail={userEmail} />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.map, acceptedTrip && { height: 450 }]}>
          <LeafletMap
            pickup={acceptedTrip ? { lat: acceptedTrip.pickupLocation.latitude, lng: acceptedTrip.pickupLocation.longitude } : pickupCoords}
            destination={acceptedTrip ? { lat: acceptedTrip.dropoffLocation.latitude, lng: acceptedTrip.dropoffLocation.longitude } : destinationCoords}
            onRouteCalculated={(info) => setRouteInfo(info)}
          />
        </View>

        <View style={styles.content}>
          {isLadiesOnly && !acceptedTrip && <LadiesOnlyBanner />}

          {acceptedTrip ? (
            <View style={styles.driverInfoCard}>
              <View style={styles.driverStatusHeader}>
                <Ionicons name="checkmark-circle" size={26} color={COLORS.primaryGreen} />
                <Text style={styles.driverStatusText}>Driver is on the way!</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.driverProfileRow}>
                <View style={styles.driverAvatar}>
                  {driverData?.profilePhoto ? (
                    <Image source={{ uri: driverData.profilePhoto }} style={{ width: 60, height: 60, borderRadius: 30 }} />
                  ) : (
                    <Ionicons name="person" size={28} color={COLORS.background} />
                  )}
                </View>

                <View style={styles.driverDetails}>
                  <Text style={styles.driverName}>{driverName}</Text>

                  <Text style={styles.carDetails}>
                    {driverVehicle.color || 'White'} {driverVehicle.model || 'Vehicle'} •{' '}
                    <Text style={{ fontWeight: 'bold', color: COLORS.text }}>
                      {driverVehicle.plateNumber || 'TBA'}
                    </Text>
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginLeft: 4 }}>4.9 (Recent ratings)</Text>
                  </View>
                </View>
              </View>

              <View style={styles.contactDetailsContainer}>
                <View style={styles.contactRow}>
                  <Text style={styles.contactLabel}>Driver Phone:</Text>
                  <Text style={styles.contactNumber}>
                    <Ionicons name="call" size={12} /> {driverPhone}
                  </Text>
                </View>
                <View style={styles.contactRow}>
                  <Text style={styles.contactLabel}>Your Phone:</Text>
                  <Text style={styles.contactNumber}>
                    <Ionicons name="call" size={12} /> {passengerPhone}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.driverActions}>
                <TouchableOpacity style={styles.contactButton}>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.contactButtonText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.contactButton} onPress={() => {
                  if (driverPhone !== 'No Contact Info') Linking.openURL(`tel:${driverPhone}`);
                }}>
                  <Ionicons name="call-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.contactButtonText}>Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <LocationInput dotColor={COLORS.primaryGreen} placeholder="Pickup Location" value={pickup} onChangeText={(text) => handleInputChange(text, 'pickup')} />
                <View style={styles.divider} />
                <LocationInput dotColor={COLORS.primary} placeholder="Where to?" value={destination} onChangeText={(text) => handleInputChange(text, 'destination')} />
              </View>

              {suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {suggestions.map((item, index) => (
                    <TouchableOpacity key={index} style={styles.suggestionItem} onPress={() => handleSelectSuggestion(item)}>
                      <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
                      <Text style={styles.suggestionText} numberOfLines={1}>{item.display_name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.label}>Ride type</Text>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                {/* 
                   UPDATED: Uses handleRideTypeSelect to block males from picking ladiesOnly 
                */}
                <RideTypeSelector selected={rideType} onSelect={handleRideTypeSelect} />
              </View>

              {routeInfo.distance > 0 && (
                <View style={styles.statsRow}>
                  <View>
                    <Text style={styles.label}>Distance</Text>
                    <Text style={styles.statValue}>{routeInfo.distance.toFixed(1)} km</Text>
                  </View>
                  <View>
                    <Text style={styles.label}>ETA</Text>
                    <Text style={styles.statValue}>{Math.round(routeInfo.duration)} mins</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.label}>Estimated fare</Text>
                    <Text style={styles.fare}>₱ {estimatedFare}</Text>
                  </View>
                </View>
              )}

              <BookButton isLadiesOnly={isLadiesOnly} onPress={handleBookPress} disabled={isBooking} />
              {isBooking && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 10 }} />}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  inputContainer: { backgroundColor: COLORS.background, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  suggestionsContainer: { backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16, overflow: 'hidden' },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 8 },
  suggestionText: { fontSize: 14, color: COLORS.text, flex: 1 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  label: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  fare: { fontSize: 18, fontWeight: 'bold', color: COLORS.primaryGreen },
  map: { alignItems: 'center', marginTop: 16, paddingHorizontal: 16 },
  driverInfoCard: { backgroundColor: COLORS.background, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  driverStatusHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 5 },
  driverStatusText: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  driverProfileRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 10 },
  driverAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  driverDetails: { flex: 1 },
  driverName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  carDetails: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  contactDetailsContainer: { marginTop: 10, padding: 10, backgroundColor: '#F9F9F9', borderRadius: 8 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  contactLabel: { fontSize: 13, color: COLORS.textSecondary },
  contactNumber: { fontSize: 13, fontWeight: 'bold', color: COLORS.primary },
  driverActions: { flexDirection: 'row', gap: 12, marginTop: 5 },
  contactButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: COLORS.border },
  contactButtonText: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary },
});