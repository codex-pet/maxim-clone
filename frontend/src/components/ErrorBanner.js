import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

export default function ErrorBanner({ icon, message, onRetry, color }) {
  const bannerColor = color || COLORS.danger;

  return (
    <View style={[styles.container, { backgroundColor: bannerColor + '15', borderColor: bannerColor }]}>
      <Ionicons name={icon || 'warning-outline'} size={20} color={bannerColor} />
      <Text style={[styles.message, { color: bannerColor }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={[styles.retryButton, { borderColor: bannerColor }]} onPress={onRetry}>
          <Text style={[styles.retryText, { color: bannerColor }]}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  message: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  retryText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});