import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

export default function LanguageSelector({ fromLanguage, toLanguage, onSwap, onPressFrom, onPressTo }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.langButton} onPress={onPressFrom}>
        <Text style={styles.language}>{fromLanguage}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onSwap}>
        <Ionicons name="swap-horizontal-outline" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.langButton} onPress={onPressTo}>
        <Text style={styles.language}>{toLanguage}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    backgroundColor: COLORS.background,
    marginBottom: 16,
  },
  langButton: {
    flex: 1,
    alignItems: 'center',
  },
  language: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});