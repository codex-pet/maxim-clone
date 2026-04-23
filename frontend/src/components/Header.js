import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useState } from 'react';
import SOSModal from './SOSModal';

export default function Header() {
  const [sosVisible, setSosVisible] = useState(false);

  return (
    <View style={styles.header}>
      <View style={styles.leftSide}>
        <View style={styles.container}>
          <Ionicons name="car-outline" size={24} color={COLORS.primary} />
        </View>
        <Text style={styles.logo}>MAXIM</Text>
      </View>

      <View style={styles.rightSide}>
        <TouchableOpacity
          style={styles.sosButton}
          onPress={() => setSosVisible(true)}
        >
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>
        <View style={styles.container}>
          <Ionicons name="person-outline" size={24} color={COLORS.primary} />
        </View>
      </View>

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  container: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
});