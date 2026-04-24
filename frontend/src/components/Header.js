import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useState, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import SOSModal from './SOSModal';

export default function Header() {
  const [sosVisible, setSosVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const navigation = useNavigation();
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(300)).current;

  const openProfile = () => {
    setProfileVisible(true);
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

  const closeProfile = () => {
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
    ]).start(() => setProfileVisible(false));
  };

  const handleLogout = () => {
    closeProfile();
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    }, 300);
  };

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
        <TouchableOpacity
          style={styles.container}
          onPress={openProfile}
        >
          <Ionicons name="person-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* SOS MODAL */}
      <SOSModal
        visible={sosVisible}
        onClose={() => setSosVisible(false)}
      />

      {/* PROFILE MODAL */}
      <Modal
        visible={profileVisible}
        transparent
        animationType="none"
        onRequestClose={closeProfile}
      >
        <Animated.View style={[styles.modalContainer, { opacity: overlayAnim }]}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={closeProfile}
          />
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: modalAnim }] }]}>
            <View style={styles.modalHandle} />

            {/* PROFILE INFO */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person-outline" size={36} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.profileName}>Guest User</Text>
                <Text style={styles.profileEmail}>Not logged in</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* MENU ITEMS */}
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="person-outline" size={22} color={COLORS.primary} />
              <Text style={styles.menuItemText}>Edit Profile</Text>
              <Ionicons name="chevron-forward-outline" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="time-outline" size={22} color={COLORS.primary} />
              <Text style={styles.menuItemText}>Trip History</Text>
              <Ionicons name="chevron-forward-outline" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="settings-outline" size={22} color={COLORS.primary} />
              <Text style={styles.menuItemText}>Settings</Text>
              <Ionicons name="chevron-forward-outline" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* LOGOUT */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

          </Animated.View>
        </Animated.View>
      </Modal>

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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
});