import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export default function EditProfileScreen({ navigation }) {
  const { user, updateUserProfile } = useAuth();

  // Base state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || null);
  
  // Driver specific state
  const isDriver = user?.role === 'DRIVER';
  const [vehicleModel, setVehicleModel] = useState(user?.vehicleInfo?.model || '');
  const [plateNumber, setPlateNumber] = useState(user?.vehicleInfo?.plateNumber || '');
  const [vehicleColor, setVehicleColor] = useState(user?.vehicleInfo?.color || '');

  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    // Request permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You've refused to allow this app to access your photos!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Updated for SDK 54 compatibility
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2, // Reduced quality to make base64 smaller
      base64: true, // Use base64 for prototype
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      if (selectedAsset.base64) {
        setProfilePhoto(`data:image/jpeg;base64,${selectedAsset.base64}`);
      } else {
         // Fallback if base64 is missing for some reason
        setProfilePhoto(selectedAsset.uri);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required.');
      return;
    }

    if (isDriver) {
      if (!vehicleModel.trim() || !plateNumber.trim() || !vehicleColor.trim()) {
        Alert.alert('Error', 'All vehicle information fields are required for drivers.');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        userId: user.id || user._id,
        name,
        email,
        phoneNumber,
        profilePhoto,
      };

      if (isDriver) {
        payload.vehicleInfo = {
          model: vehicleModel,
          plateNumber,
          color: vehicleColor
        };
      }

      const response = await fetch(`${API_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // Update local context
        await updateUserProfile(data.user);
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile.');
      }
    } catch (error) {
      console.error('Save profile error:', error);
      Alert.alert('Error', 'An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={40} color={COLORS.textSecondary} />
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>Tap to change photo</Text>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Driver Specific Info */}
        {isDriver && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Vehicle Model</Text>
              <TextInput
                style={styles.input}
                value={vehicleModel}
                onChangeText={setVehicleModel}
                placeholder="e.g., Toyota Vios"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Plate Number</Text>
              <TextInput
                style={styles.input}
                value={plateNumber}
                onChangeText={setPlateNumber}
                placeholder="e.g., ABC 1234"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Color</Text>
              <TextInput
                style={styles.input}
                value={vehicleColor}
                onChangeText={setVehicleColor}
                placeholder="e.g., Silver"
              />
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  saveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    padding: 8,
  },
  content: {
    padding: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  photoContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.border,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  photoHint: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
  },
});
