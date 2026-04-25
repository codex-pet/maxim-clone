import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Switch } from 'react-native';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import SOSModal from './SOSModal';
import { COLORS } from '../constants/colors';

export default function DriverHeader({ driverName, isOnline, onToggleOnline, gender }) {
  const navigation = useNavigation();
  const [sosVisible, setSosVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
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

      {/* LEFT SIDE */}
      <View style={styles.leftSide}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={openProfile}
        >
          <Ionicons name="person-outline" size={22} color={COLORS.background} />
        </TouchableOpacity>
        <View>
          <Text style={styles.driverName}>{driverName || 'Driver'}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.primaryGreen : COLORS.danger }]} />
            <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
      </View>

      {/* RIGHT SIDE */}
      <View style={styles.rightSide}>
        <TouchableOpacity
          style={styles.sosButton}
          onPress={() => setSosVisible(true)}
        >
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>
        <Switch
          value={isOnline}
          onValueChange={onToggleOnline}
          trackColor={{ false: 'rgba(255,255,255,0.3)', true: COLORS.primaryGreen }}
          thumbColor={COLORS.background}
        />
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

            {/* DRIVER PROFILE INFO */}
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                <Ionicons name="person-outline" size={36} color={COLORS.primaryGreen} />
              </View>
              <View>
                <Text style={styles.profileName}>{driverName || 'Driver'}</Text>
                <Text style={styles.profileRole}>MAXIM Driver</Text>
                {gender === 'female' && (
                  <View style={styles.ladiesBadge}>
                    <Ionicons name="female-outline" size={12} color={COLORS.ladiesOnly} />
                    <Text style={styles.ladiesBadgeText}>Ladies-Only Verified</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            {/* STATUS TOGGLE */}
            <View style={styles.statusToggleRow}>
              <View style={styles.statusToggleLeft}>
                <Ionicons
                  name={isOnline ? 'radio-outline' : 'power-outline'}
                  size={22}
                  color={isOnline ? COLORS.primaryGreen : COLORS.textSecondary}
                />
                <Text style={styles.menuItemText}>
                  {isOnline ? 'Online — Accepting rides' : 'Offline — Not accepting rides'}
                </Text>
              </View>
              <Switch
                value={isOnline}
                onValueChange={onToggleOnline}
                trackColor={{ false: COLORS.border, true: COLORS.primaryGreen }}
                thumbColor={COLORS.background}
              />
            </View>

            <View style={styles.divider} />

            {/* MENU ITEMS */}
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="car-outline" size={22} color={COLORS.primaryGreen} />
              <Text style={styles.menuItemText}>Trip History</Text>
              <Ionicons name="chevron-forward-outline" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="cash-outline" size={22} color={COLORS.primaryGreen} />
              <Text style={styles.menuItemText}>Earnings</Text>
              <Ionicons name="chevron-forward-outline" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="settings-outline" size={22} color={COLORS.primaryGreen} />
              <Text style={styles.menuItemText}>Settings</Text>
              <Ionicons name="chevron-forward-outline" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* LOGOUT */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
  },
  leftSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.background,
    opacity: 0.9,
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryGreen,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  profileRole: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ladiesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ladiesBadgeText: {
    fontSize: 11,
    color: COLORS.ladiesOnly,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  statusToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statusToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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