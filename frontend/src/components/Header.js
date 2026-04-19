import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

export default function Header() {
  return (
    <View style={styles.header}>

      <View style={styles.leftSide}>
        <View style={styles.container}>
          <Ionicons name="car-outline" size={24} color={COLORS.primary} />
        </View>
        <Text style={styles.logo}>MAXIM</Text>
      </View>

      <View style={styles.rightSide}>
        <View style={styles.container}>
          <Ionicons name="person-outline" size={24} color={COLORS.primary} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },

  leftSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary
  },

  rightSide: {
    alignItems: 'center',
    justifyContent: 'center'
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
}
})