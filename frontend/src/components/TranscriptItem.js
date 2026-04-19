import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

export default function TranscriptItem({ original, translation }) {
  return (
    <View style={styles.container}>
      <Ionicons name="mic-outline" size={16} color={COLORS.textSecondary} style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={styles.original}>{original}</Text>
        <Text style={styles.translation}>
          <Text style={styles.transLabel}>Trans: </Text>
          {translation}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  icon: {
    marginRight: 8,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  original: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  translation: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  transLabel: {
    fontWeight: 'bold',
    color: COLORS.primary,
    fontStyle: 'normal',
  },
});