import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default function GPSCard({ latitude, longitude, locked }) {
  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        
        <Text style={styles.label}>GPS COORDINATES</Text>

        <View style={styles.row}>
          <Text style={styles.coordinates}>
            {latitude ? `${latitude.toFixed(4)}N, ${longitude.toFixed(2)}E` : 'Fetching...'}
          </Text>

          {locked && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>✓ LOCKED</Text>
            </View>
          )}
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: '#FFEDE0',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cta,
    marginBottom: 16,
  },
  inner: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
  },
  label: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordinates: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  badge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryGreen,
  },
  badgeText: {
    fontSize: 11,
    color: COLORS.primaryGreen,
    fontWeight: 'bold',
  },
});