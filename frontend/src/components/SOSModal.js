import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Linking, Share } from 'react-native';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import useLocation from '../hooks/useLocation';
import { COLORS } from '../constants/colors';

export default function SOSModal({ visible, onClose }) {
  const { location } = useLocation();
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(300)).current;

  const openModal = () => {
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(modalAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const handleCall911 = () => {
    closeModal();
    Linking.openURL('tel:911');
  };

  const handleShareLocation = async () => {
    if (location) {
      await Share.share({
        message: `🆘 EMERGENCY! I need help!\nMy location: https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`,
      });
    } else {
      await Share.share({
        message: '🆘 EMERGENCY! I need help! Location unavailable.',
      });
    }
    closeModal();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeModal}
      onShow={openModal}
    >
      <Animated.View style={[styles.modalContainer, { opacity: overlayAnim }]}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        />
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: modalAnim }] }]}>
          <View style={styles.modalHandle} />

          {/* EMERGENCY HEADER */}
          <View style={styles.emergencyHeader}>
            <View style={styles.emergencyIconContainer}>
              <Ionicons name="warning-outline" size={32} color={COLORS.danger} />
            </View>
            <Text style={styles.emergencyTitle}>Emergency SOS</Text>
            <Text style={styles.emergencySubtitle}>
              Choose an emergency action below
            </Text>
          </View>

          {/* LOCATION INFO */}
          <View style={styles.locationCard}>
            <Ionicons name="location-outline" size={16} color={COLORS.primaryGreen} />
            <Text style={styles.locationText}>
              {location
                ? `${location.coords.latitude.toFixed(4)}N, ${location.coords.longitude.toFixed(2)}E`
                : 'Fetching location...'}
            </Text>
          </View>

          {/* CALL 911 */}
          <TouchableOpacity style={styles.callButton} onPress={handleCall911}>
            <Ionicons name="call-outline" size={24} color={COLORS.background} />
            <View>
              <Text style={styles.callButtonText}>Call 911</Text>
              <Text style={styles.callButtonSubtext}>Emergency Services</Text>
            </View>
          </TouchableOpacity>

          {/* SHARE LOCATION */}
          <TouchableOpacity style={styles.shareButton} onPress={handleShareLocation}>
            <Ionicons name="share-outline" size={24} color={COLORS.primary} />
            <View>
              <Text style={styles.shareButtonText}>Share My Location</Text>
              <Text style={styles.shareButtonSubtext}>Send GPS to contacts</Text>
            </View>
          </TouchableOpacity>

          {/* CANCEL */}
          <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalOverlay: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  emergencyHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emergencyIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.danger,
  },
  emergencyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.danger,
    marginBottom: 4,
  },
  emergencySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryGreen,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.primaryGreen,
    fontWeight: 'bold',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.danger,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  callButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  callButtonSubtext: {
    color: COLORS.background,
    fontSize: 12,
    opacity: 0.8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  shareButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareButtonSubtext: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  cancelButton: {
    alignItems: 'center',
    padding: 16,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
});