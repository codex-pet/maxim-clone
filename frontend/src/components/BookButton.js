import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default function BookButton({ isLadiesOnly, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: isLadiesOnly ? COLORS.ladiesOnly : COLORS.primary }]}
      onPress={onPress}
    >
      <Text style={styles.text}>
        {isLadiesOnly ? 'Book Ladies-Only Ride' : 'Book Standard Ride'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  text: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});