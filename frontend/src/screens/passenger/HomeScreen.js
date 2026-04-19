import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import MapPlaceholder from '../../components/MapPlaceholder';
import FeatureCard from '../../components/FeatureCard';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import { COLORS } from '../../constants/colors';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { isConnected } = useNetworkStatus();
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header />

      {/* POOR CONNECTION BANNER */}
      {!isConnected && (
        <TouchableOpacity
          style={styles.offlineBanner}
          onPress={() => navigation.navigate('Lite')}
        >
          <Ionicons name="flash-outline" size={16} color={COLORS.background} />
          <Text style={styles.offlineBannerText}>
            Poor connection detected — Tap to use Lite Mode
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.container}>
          <MapPlaceholder />
        </View>

        <View style={styles.view}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: COLORS.text }}>
            New Features
          </Text>

          <FeatureCard
            icon="flash-outline"
            title="Offline Booking Mode"
            description="Allows user to book offline via SMS"
          />

          <FeatureCard
            icon="mic-outline"
            title="Voice Communication"
            description="Auto translate - Hands Free - Real Time"
          />

          <FeatureCard
            color={COLORS.ladiesOnly}
            icon="female-outline"
            title="Ladies Only Mode"
            description="Exclusively matched with female drivers"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  view: {
    paddingHorizontal: 16,
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