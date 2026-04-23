import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapPlaceholder from '../../components/MapPlaceholder';
import SOSModal from '../../components/SOSModal';
import { COLORS } from '../../constants/colors';

export default function DriverHomeScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { gender } = route.params || {};
  const isFemaleDriver = gender === 'female';
  const [isOnline, setIsOnline] = useState(false);
  const [sosVisible, setSosVisible] = useState(false);

  const recentTrips = [
    { id: 1, passenger: 'Juan Dela Cruz', from: 'Ateneo de Davao', to: 'SM Lanang', fare: '₱ 85', date: 'Today, 9:30 AM' },
    { id: 2, passenger: 'Maria Santos', from: 'Damosa Gateway', to: 'Matina Town Square', fare: '₱ 110', date: 'Today, 8:15 AM' },
    { id: 3, passenger: 'Pedro Reyes', from: 'NCCC Mall', to: 'Buhangin', fare: '₱ 95', date: 'Yesterday, 5:45 PM' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.backgroundLight, paddingTop: insets.top }}>

      {/* DRIVER HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-outline" size={24} color={COLORS.background} />
          </View>
          <View>
            <Text style={styles.driverName}>Erl Yves</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.primaryGreen : COLORS.danger }]} />
              <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.sosButton}
            onPress={() => setSosVisible(true)}
          >
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: COLORS.border, true: COLORS.primaryGreen }}
            thumbColor={COLORS.background}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* LADIES ONLY BADGE */}
        {isFemaleDriver && (
          <View style={styles.ladiesOnlyBanner}>
            <Ionicons name="female-outline" size={16} color={COLORS.ladiesOnly} />
            <Text style={styles.ladiesOnlyText}>
              Ladies-Only Verified Driver — You can receive Ladies-Only ride requests
            </Text>
          </View>
        )}

        {/* ONLINE STATUS CARD */}
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
                {isOnline
                  ? 'Waiting for ride requests...'
                  : 'Toggle to start accepting rides'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.toggleButton, { backgroundColor: isOnline ? COLORS.primaryGreen : COLORS.primary }]}
            onPress={() => setIsOnline(!isOnline)}
          >
            <Text style={styles.toggleButtonText}>
              {isOnline ? 'Go Offline' : 'Go Online'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* SIMULATE RIDE REQUEST BUTTON */}
        {isOnline && (
          <TouchableOpacity
            style={styles.testRequestButton}
            onPress={() => navigation.navigate('DriverRideRequest', { isLadiesOnly: false })}
          >
            <Ionicons name="notifications-outline" size={16} color={COLORS.background} />
            <Text style={styles.testRequestText}>Simulate Ride Request</Text>
          </TouchableOpacity>
        )}

        {/* SIMULATE LADIES ONLY REQUEST */}
        {isOnline && isFemaleDriver && (
          <TouchableOpacity
            style={[styles.testRequestButton, { backgroundColor: COLORS.ladiesOnly }]}
            onPress={() => navigation.navigate('DriverRideRequest', { isLadiesOnly: true })}
          >
            <Ionicons name="female-outline" size={16} color={COLORS.background} />
            <Text style={styles.testRequestText}>Simulate Ladies-Only Request</Text>
          </TouchableOpacity>
        )}

        {/* MAP */}
        <View style={styles.mapContainer}>
          <MapPlaceholder />
        </View>

        {/* STATS ROW */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="car-outline" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Trips Today</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={24} color={COLORS.primaryGreen} />
            <Text style={styles.statValue}>₱ 1,240</Text>
            <Text style={styles.statLabel}>Earnings Today</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star-outline" size={24} color={COLORS.ctaYellow} />
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* RECENT TRIPS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Trips</Text>
          {recentTrips.map(trip => (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.tripLeft}>
                <View style={styles.tripIconContainer}>
                  <Ionicons name="car-outline" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.tripInfo}>
                  <Text style={styles.tripPassenger}>{trip.passenger}</Text>
                  <Text style={styles.tripRoute}>{trip.from} → {trip.to}</Text>
                  <Text style={styles.tripDate}>{trip.date}</Text>
                </View>
              </View>
              <Text style={styles.tripFare}>{trip.fare}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.background,
    opacity: 0.9,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  ladiesOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FCE4EC',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.ladiesOnly,
  },
  ladiesOnlyText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.ladiesOnly,
  },
  statusCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusCardSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  toggleButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: 'bold',
  },
  testRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    justifyContent: 'center',
  },
  testRequestText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 14,
  },
  mapContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  tripCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  tripIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripInfo: {
    flex: 1,
  },
  tripPassenger: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tripRoute: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tripDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tripFare: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
  },
});