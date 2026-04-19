import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';
import MapPlaceholder from '../../components/MapPlaceholder';
import LocationInput from '../../components/LocationInput';
import RideTypeSelector from '../../components/RideTypeSelector';
import BookButton from '../../components/BookButton';
import LadiesOnlyBanner from '../../components/LadiesOnlyBanner';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import { COLORS } from '../../constants/colors';

export default function BookScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isConnected } = useNetworkStatus();
  const [rideType, setRideType] = useState('standard');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const nav = useNavigation();

  const isLadiesOnly = rideType === 'ladiesOnly';

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header />

      {/* POOR CONNECTION BANNER */}
      {!isConnected && (
        <TouchableOpacity
          style={styles.offlineBanner}
          onPress={() => nav.navigate('Lite')}
        >
          <Ionicons name="flash-outline" size={16} color={COLORS.background} />
          <Text style={styles.offlineBannerText}>
            Poor connection — Tap to switch to Lite Mode
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>

        {/* MAP */}
        <View style={styles.map}>
          <MapPlaceholder color={isLadiesOnly ? COLORS.ladiesOnly : null} />
        </View>

        <View style={styles.content}>

          {/* LADIES ONLY BANNER */}
          {isLadiesOnly && <LadiesOnlyBanner />}

          {/* LOCATION INPUTS */}
          <View style={styles.inputContainer}>
            <LocationInput
              dotColor={COLORS.primaryGreen}
              placeholder="Ateneo de Davao University"
              value={pickup}
              onChangeText={setPickup}
            />
            <View style={styles.divider} />
            <LocationInput
              dotColor={COLORS.primary}
              placeholder="Where to?"
              value={destination}
              onChangeText={setDestination}
            />
          </View>

          {/* RIDE TYPE */}
          <Text style={styles.label}>Ride type</Text>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <RideTypeSelector
              selected={rideType}
              onSelect={setRideType}
            />
          </View>

          {/* FARE ESTIMATE */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={styles.label}>Estimated fare</Text>
            <Text style={styles.fare}>₱ 85 — 110</Text>
          </View>

          {/* BOOK BUTTON */}
          <BookButton
            isLadiesOnly={isLadiesOnly}
            onPress={() => navigation.navigate('Payment', { isLadiesOnly })}
          />

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
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
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  fare: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  map: {
    alignItems: 'center',
    marginTop: 16,
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