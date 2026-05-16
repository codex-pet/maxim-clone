import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  Alert
} from 'react-native';
import { useRef, useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import GPSCard from '../../components/GPSCard';
import LocationInput from '../../components/LocationInput';
import BookingStatusItem from '../../components/BookingStatusItem';
import useLocation from '../../hooks/useLocation';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import { COLORS } from '../../constants/colors';

const { height } = Dimensions.get('window');
const HEADER_SPACE = height * 0.35;

export default function LiteScreen({ route }) {
  const { user } = useAuth();
  const userName = user?.name || route?.params?.userName || route?.params?.params?.userName || 'User';
  const userEmail = user?.email || route?.params?.userEmail || route?.params?.params?.userEmail || '';
  const insets = useSafeAreaInsets();

  const { location } = useLocation();
  const { isConnected } = useNetworkStatus();

  const [destination, setDestination] = useState('');
  const [pickup, setPickup] = useState('Fetching location...');
  const [panelVisible, setPanelVisible] = useState(false);

  // NEW: State for Ride Type
  const [rideType, setRideType] = useState('Standard'); // 'Standard' or 'Ladies Mode'

  const scrollRef = useRef(null);
  const confirmAnim = useRef(new Animated.Value(600)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  // 1. CACHE LAST KNOWN ADDRESS (Leaflet + OpenStreetMap Photon API with Debounce)
  useEffect(() => {
    const cacheLocation = async () => {
      if (isConnected && location) {
        try {
          const url = `https://photon.komoot.io/reverse?lon=${location.coords.longitude}&lat=${location.coords.latitude}`;
          const response = await fetch(url);
          const data = await response.json();

          if (data.features && data.features.length > 0) {
            const props = data.features[0].properties;
            const addressName = props.name || props.street || '';
            const city = props.city || props.state || '';
            const finalAddress = [addressName, city].filter(Boolean).join(', ');

            if (finalAddress) {
              await AsyncStorage.setItem('lastKnownPickup', finalAddress);
              setPickup(finalAddress);
            }
          }
        } catch (error) {
          console.log("Error fetching reverse geocode:", error);
        }
      } else if (!isConnected) {
        // If offline, pull the saved address
        const savedAddress = await AsyncStorage.getItem('lastKnownPickup');
        if (savedAddress) {
          setPickup(savedAddress);
        } else {
          setPickup('Potol, Dapitan City'); // Fallback
        }
      }
    };

    // Debounce to prevent spamming the free Photon API
    const timeoutId = setTimeout(cacheLocation, 3000);
    return () => clearTimeout(timeoutId);
  }, [location, isConnected]);

  // Handle Sheet Animations
  useFocusEffect(
    useCallback(() => {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }, 50);
      slideAnim.setValue(height);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
        speed: 12,
      }).start();
    }, [])
  );

  const showPanel = () => {
    setPanelVisible(true);
    Animated.timing(confirmAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const hidePanel = () => {
    Animated.timing(confirmAnim, {
      toValue: 600,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setPanelVisible(false));
  };

  // 2. FORMAT AND SEND THE SMS BOOKING
  const handleSendBooking = async () => {
    const isAvailable = await SMS.isAvailableAsync();

    if (isAvailable) {
      const lat = location?.coords?.latitude?.toFixed(4) || 'Unknown';
      const lng = location?.coords?.longitude?.toFixed(4) || 'Unknown';

      // Ensure this matches the regex in your Node.js Backend exactly!
      const message = `New Ride Request:
        Passenger: ${userName}
        Pickup: ${pickup}
        Destination: ${destination || 'Any'}
        Contact: ${user?.phoneNumber || '09123456789'}
        Type: ${rideType}
        GPS: ${lat}N, ${lng}E`;

      // 🚨 REPLACE THIS WITH THE SIM NUMBER OF YOUR SPARE ANDROID PHONE
      const GATEWAY_SIM_NUMBER = '+639357708642';

      const { result } = await SMS.sendSMSAsync(
        [GATEWAY_SIM_NUMBER],
        message
      );

      // 'sent' for iOS, 'unknown' is typical for Android but means it successfully opened the SMS app
      if (result === 'sent' || result === 'unknown') {
        showPanel();
      }
    } else {
      Alert.alert('Error', 'SMS is not available on this device.');
    }
  };

  // Preview string for the UI (dynamically uses rideType)
  const latString = location?.coords?.latitude?.toFixed(4) || 'Unknown';
  const lngString = location?.coords?.longitude?.toFixed(2) || 'Unknown';
  const smsPreview = `New Ride Request:\nPassenger: ${userName}\nPickup: ${pickup}\nDestination: ${destination || '(Any)'}\nContact: ${user?.phoneNumber || '09123456789'}\nType: ${rideType}\nGPS: ${latString}N, ${lngString}E`;

  return (
    <View style={styles.container}>

      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <Header userName={userName} userEmail={userEmail} />
      </View>

      <Animated.View style={[styles.animatedSheet, { transform: [{ translateY: slideAnim }] }]}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
          scrollEventThrottle={16}
        >
          <View style={{ height: HEADER_SPACE }} />

          <View style={styles.sheet}>
            <View style={styles.dragArea}>
              <View style={styles.handle} />
            </View>

            <View style={styles.orangeSection}>
              <View style={styles.banner}>
                <Ionicons name="flash-outline" size={14} color={COLORS.background} />
                <Text style={styles.bannerText}>Lite Mode - Booking via SMS</Text>
              </View>
              <View style={styles.liteModeHeader}>
                <Ionicons name="flash-outline" size={28} color={COLORS.background} />
                <Text style={styles.liteModeTitle}>Lite Mode</Text>
                <Text style={styles.liteModeSubtitle}>
                  Low signal detected - SMS booking active
                </Text>
              </View>
            </View>

            <View style={styles.card}>

              {isConnected && (
                <View style={styles.onlineWarning}>
                  <Ionicons name="wifi-outline" size={16} color={COLORS.primaryGreen} />
                  <Text style={styles.onlineWarningText}>
                    You're online! Use the Book tab for a better experience.
                  </Text>
                </View>
              )}

              <Text style={styles.sectionTitle}>Your Location</Text>
              <GPSCard
                latitude={location?.coords?.latitude}
                longitude={location?.coords?.longitude}
                locked={!!location}
              />

              <Text style={styles.sectionTitle}>Booking Details</Text>
              <View style={styles.inputContainer}>
                <LocationInput
                  dotColor={COLORS.cta}
                  placeholder="Pickup location"
                  value={pickup}
                  onChangeText={setPickup}
                />
                <View style={styles.divider} />
                <LocationInput
                  dotColor={COLORS.primaryGreen}
                  placeholder="Destination"
                  value={destination}
                  onChangeText={setDestination}
                />
              </View>

              <Text style={styles.sectionTitle}>SMS Booking Preview</Text>

              {/* NEW: Ride Type Toggle Buttons */}
              <View style={styles.typeToggleContainer}>
                <TouchableOpacity
                  style={[styles.typeButton, rideType === 'Standard' && styles.typeButtonActive]}
                  onPress={() => setRideType('Standard')}
                >
                  <Text style={[styles.typeButtonText, rideType === 'Standard' && styles.typeButtonTextActive]}>
                    Standard
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, rideType === 'Ladies Mode' && styles.typeButtonActive]}
                  onPress={() => setRideType('Ladies Mode')}
                >
                  <Text style={[styles.typeButtonText, rideType === 'Ladies Mode' && styles.typeButtonTextActive]}>
                    Ladies Mode
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.smsCard}>
                <Text style={styles.smsTitle}>Auto Generated SMS</Text>
                <Text style={styles.smsText}>{smsPreview}</Text>
              </View>

              <Text style={styles.sectionTitle}>Booking Status</Text>
              <View style={styles.statusCard}>
                <BookingStatusItem
                  icon="location-outline"
                  iconBackground={COLORS.primaryGreen}
                  title="GPS Location Cached"
                  subtitle={location ? `${latString}N, ${lngString}E` : 'Fetching...'}
                />
                <BookingStatusItem
                  icon="phone-portrait-outline"
                  iconBackground={COLORS.primary}
                  title="SMS Ready to Send"
                  subtitle="Tap button to send Booking"
                />
                <BookingStatusItem
                  icon="sync-outline"
                  iconBackground={COLORS.cta}
                  title="Server Processing"
                  subtitle="Waiting for SMS to be sent"
                />
                <BookingStatusItem
                  icon="car-outline"
                  iconBackground={COLORS.danger}
                  title="Driver Match"
                  subtitle="Searching for driver, Response via SMS"
                />
              </View>

              {/* 3. UPDATED BUTTON EVENT */}
              <TouchableOpacity style={styles.sendButton} onPress={handleSendBooking}>
                <Text style={styles.sendButtonText}>SEND BOOKING</Text>
              </TouchableOpacity>
              <Text style={styles.noInternet}>No internet needed</Text>

            </View>
          </View>
        </ScrollView>

        {panelVisible && (
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={hidePanel}
          />
        )}

        {panelVisible && (
          <Animated.View style={[styles.panel, { transform: [{ translateY: confirmAnim }] }]}>
            <View style={styles.panelHandle} />
            <Text style={styles.panelTitle}>Booking Confirmed! 🎉</Text>
            <Text style={styles.panelSubtitle}>
              Your SMS booking has been sent successfully.
            </Text>
            <BookingStatusItem
              icon="checkmark-circle-outline"
              iconBackground={COLORS.primaryGreen}
              title="GPS Location Captured"
              subtitle={location ? `${latString}N, ${lngString}E` : 'Fetching...'}
            />
            <BookingStatusItem
              icon="phone-portrait-outline"
              iconBackground={COLORS.primary}
              title="SMS Sent Successfully"
              subtitle="Booking request transmitted"
            />
            <BookingStatusItem
              icon="sync-outline"
              iconBackground={COLORS.cta}
              title="Server Processing"
              subtitle="Matching you with a driver"
            />
            <BookingStatusItem
              icon="car-outline"
              iconBackground={COLORS.danger}
              title="Driver Match"
              subtitle="Searching for driver, Response via SMS"
            />
          </Animated.View>
        )}
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.backgroundLight,
    zIndex: 100,
  },
  animatedSheet: {
    flex: 1,
    zIndex: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  sheet: {
    flex: 1,
    backgroundColor: COLORS.cta,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    minHeight: height,
  },
  dragArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: COLORS.cta,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 2,
  },
  orangeSection: {
    backgroundColor: COLORS.cta,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  bannerText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  liteModeHeader: {
    paddingBottom: 24,
  },
  liteModeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.background,
    marginTop: 8,
  },
  liteModeSubtitle: {
    fontSize: 13,
    color: COLORS.background,
    opacity: 0.9,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.backgroundLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingTop: 24,
    flexGrow: 1,
  },
  onlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryGreen,
  },
  onlineWarningText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primaryGreen,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
    marginTop: 8,
  },
  inputContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },

  // NEW: Type Toggle Buttons Styling
  typeToggleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: COLORS.cta,
    borderColor: COLORS.cta,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  typeButtonTextActive: {
    color: COLORS.background,
  },

  smsCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  smsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.cta,
    textAlign: 'center',
    marginBottom: 12,
  },
  smsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  statusCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  sendButton: {
    backgroundColor: COLORS.cta,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 8,
  },
  sendButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  noInternet: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 200,
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 300,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    elevation: 10,
  },
  panelHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  panelSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
});