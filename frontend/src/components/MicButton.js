import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

export default function MicButton({ recordingState, onPressIn, onPressOut }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (recordingState === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [recordingState]);

  const getButtonColor = () => {
    if (recordingState === 'recording') return COLORS.danger;
    if (recordingState === 'processing') return COLORS.textSecondary;
    return COLORS.primary;
  };

  const getIcon = () => {
    if (recordingState === 'processing') return 'sync-outline';
    return 'mic-outline';
  };

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.outerRing, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: getButtonColor() }]}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={0.8}
        >
          <Ionicons name={getIcon()} size={48} color={COLORS.background} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  outerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: `${COLORS.primary}30`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});