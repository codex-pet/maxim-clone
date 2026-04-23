import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export default function DriverUploadScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { phone, email } = route.params || {};
  const [idPhoto, setIdPhoto] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [gender, setGender] = useState(null);

  const handleSubmit = () => {
    navigation.navigate('DriverPending', { phone, email, gender });
  };

  const bothUploaded = idPhoto && profilePhoto && gender;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background, paddingTop: insets.top }}>

      {/* BACK BUTTON */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back-outline" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.content}>

          {/* HEADER */}
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark-outline" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Driver Verification</Text>
            <Text style={styles.subtitle}>
              Upload your valid ID and profile photo to complete your driver registration.
              Our team will review and activate your account within 24 hours.
            </Text>
          </View>

          {/* STEPS */}
          <View style={styles.stepsCard}>
            <View style={styles.stepItem}>
              <View style={[styles.stepIcon, { backgroundColor: COLORS.primaryGreen }]}>
                <Ionicons name="checkmark-outline" size={16} color={COLORS.background} />
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>Phone Verified</Text>
                <Text style={styles.stepSubtitle}>{phone ? `+63 ${phone}` : email}</Text>
              </View>
            </View>

            <View style={styles.stepDivider} />

            <View style={styles.stepItem}>
              <View style={[styles.stepIcon, { backgroundColor: idPhoto ? COLORS.primaryGreen : COLORS.cta }]}>
                <Ionicons
                  name={idPhoto ? "checkmark-outline" : "card-outline"}
                  size={16}
                  color={COLORS.background}
                />
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>Upload Valid ID</Text>
                <Text style={styles.stepSubtitle}>
                  {idPhoto ? 'ID uploaded successfully' : 'Required — UMID, Drivers License, Passport'}
                </Text>
              </View>
            </View>

            <View style={styles.stepDivider} />

            <View style={styles.stepItem}>
              <View style={[styles.stepIcon, { backgroundColor: profilePhoto ? COLORS.primaryGreen : COLORS.border }]}>
                <Ionicons
                  name={profilePhoto ? "checkmark-outline" : "person-outline"}
                  size={16}
                  color={COLORS.background}
                />
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>Profile Photo</Text>
                <Text style={styles.stepSubtitle}>
                  {profilePhoto ? 'Photo uploaded successfully' : 'Required — Clear face photo'}
                </Text>
              </View>
            </View>
          </View>

          {/* ID UPLOAD */}
          <Text style={styles.sectionTitle}>Valid ID</Text>
          <TouchableOpacity
            style={[styles.uploadBox, idPhoto && styles.uploadBoxDone]}
            onPress={() => setIdPhoto('uploaded')}
          >
            {idPhoto ? (
              <View style={styles.uploadedContent}>
                <Ionicons name="checkmark-circle-outline" size={40} color={COLORS.primaryGreen} />
                <Text style={styles.uploadedText}>ID Uploaded</Text>
                <Text style={styles.uploadedSubtext}>Tap to change</Text>
              </View>
            ) : (
              <View style={styles.uploadContent}>
                <Ionicons name="cloud-upload-outline" size={40} color={COLORS.textSecondary} />
                <Text style={styles.uploadText}>Tap to upload your ID</Text>
                <Text style={styles.uploadSubtext}>UMID, Driver's License, Passport, SSS</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* PROFILE PHOTO UPLOAD */}
          <Text style={styles.sectionTitle}>Profile Photo</Text>
          <TouchableOpacity
            style={[styles.uploadBox, profilePhoto && styles.uploadBoxDone]}
            onPress={() => setProfilePhoto('uploaded')}
          >
            {profilePhoto ? (
              <View style={styles.uploadedContent}>
                <Ionicons name="checkmark-circle-outline" size={40} color={COLORS.primaryGreen} />
                <Text style={styles.uploadedText}>Photo Uploaded</Text>
                <Text style={styles.uploadedSubtext}>Tap to change</Text>
              </View>
            ) : (
              <View style={styles.uploadContent}>
                <Ionicons name="camera-outline" size={40} color={COLORS.textSecondary} />
                <Text style={styles.uploadText}>Tap to upload your photo</Text>
                <Text style={styles.uploadSubtext}>Clear face photo, no sunglasses</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* GENDER SELECTION */}
          <Text style={styles.sectionTitle}>Gender</Text>
          <Text style={styles.genderNote}>
            Required for Ladies-Only ride matching
          </Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
              onPress={() => setGender('male')}
            >
              <Ionicons
                name="male-outline"
                size={24}
                color={gender === 'male' ? COLORS.background : COLORS.textSecondary}
              />
              <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>
                Male
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.genderButton, gender === 'female' && styles.genderButtonActiveFemale]}
              onPress={() => setGender('female')}
            >
              <Ionicons
                name="female-outline"
                size={24}
                color={gender === 'female' ? COLORS.background : COLORS.textSecondary}
              />
              <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>
                Female
              </Text>
              {gender === 'female' && (
                <View style={styles.ladiesOnlyBadge}>
                  <Text style={styles.ladiesOnlyBadgeText}>Ladies-Only Eligible</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* NOTE */}
          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.noteText}>
              Your documents are encrypted and stored securely. They will only be used for verification purposes.
            </Text>
          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.submitButton, !bothUploaded && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!bothUploaded}
          >
            <Text style={styles.submitButtonText}>Submit for Verification</Text>
            <Ionicons name="arrow-forward-outline" size={20} color={COLORS.background} />
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  genderNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  genderButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundLight,
    gap: 8,
  },
  genderButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderButtonActiveFemale: {
    backgroundColor: COLORS.ladiesOnly,
    borderColor: COLORS.ladiesOnly,
  },
  genderText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  genderTextActive: {
    color: COLORS.background,
  },
  ladiesOnlyBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  ladiesOnlyBadgeText: {
    fontSize: 10,
    color: COLORS.background,
    fontWeight: 'bold',
  },

  backButton: {
    padding: 16,
  },
  content: {
    paddingHorizontal: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  stepsCard: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  stepSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  stepDivider: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.border,
    marginLeft: 15,
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  uploadBox: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundLight,
    marginBottom: 20,
    minHeight: 140,
  },
  uploadBoxDone: {
    borderColor: COLORS.primaryGreen,
    borderStyle: 'solid',
    backgroundColor: '#E8F5E9',
  },
  uploadContent: {
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  uploadSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  uploadedContent: {
    alignItems: 'center',
    gap: 8,
  },
  uploadedText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
  },
  uploadedSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#E8F0FE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  submitButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 