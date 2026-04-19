import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

export default function LadiesOnlyBanner() {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Ionicons name="female-outline" size={24} color={COLORS.ladiesOnly} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Ladies-Only Mode Active</Text>
          <Text style={styles.description}>
            You'll be matched exclusively with verified female drivers for your safety and comfort.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FCE4EC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.ladiesOnly,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    color: COLORS.ladiesOnly,
    fontSize: 14,
  },
  description: {
    fontSize: 12,
    color: COLORS.text,
    marginTop: 4,
  },
});