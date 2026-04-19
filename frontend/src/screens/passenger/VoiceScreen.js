import { View, Text, StyleSheet, ScrollView, Switch, Modal, TouchableOpacity, FlatList, Animated } from 'react-native';
import { useState, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MicButton from '../../components/MicButton';
import LanguageSelector from '../../components/LanguageSelector';
import TranscriptItem from '../../components/TranscriptItem';
import { COLORS } from '../../constants/colors';

const LANGUAGES = [
  { label: 'English', code: 'en' },
  { label: 'Filipino', code: 'fil' },
  { label: 'Bisaya/Cebuano', code: 'ceb' },
  { label: 'Ilocano', code: 'ilo' },
];

export default function VoiceScreen() {
  const insets = useSafeAreaInsets();
  const [autoDetect, setAutoDetect] = useState(true);
  const [fromLang, setFromLang] = useState(LANGUAGES[1]);
  const [toLang, setToLang] = useState(LANGUAGES[0]);
  const [recordingState, setRecordingState] = useState('idle');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSide, setSelectedSide] = useState(null);
  const [transcripts, setTranscripts] = useState([
    { id: 1, original: 'Taga asa ka sir?', translation: 'Where are you from sir?' },
    { id: 2, original: 'Baho kaykay ilok.', translation: "You're so handsome." },
  ]);

  const modalAnim = useRef(new Animated.Value(300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const openModal = (side) => {
    setSelectedSide(side);
    setModalVisible(true);
    Animated.parallel([
      Animated.spring(modalAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setModalVisible(false));
  };

  const handleSwap = () => {
    const temp = fromLang;
    setFromLang(toLang);
    setToLang(temp);
  };

  const handlePressFrom = () => openModal('from');
  const handlePressTo = () => openModal('to');

  const handleSelectLanguage = (lang) => {
    if (selectedSide === 'from') setFromLang(lang);
    else setToLang(lang);
    closeModal();
  };

  const handlePressIn = () => setRecordingState('recording');

  const handlePressOut = () => {
    setRecordingState('processing');
    setTimeout(() => {
      setTranscripts(prev => [...prev, {
        id: Date.now(),
        original: 'Sample recorded text...',
        translation: 'Sample translation...',
      }]);
      setRecordingState('idle');
    }, 1500);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <Ionicons name="mic-outline" size={28} color={COLORS.background} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Voice Comm</Text>
            <Text style={styles.headerSubtitle}>
              Auto Translate - Hands Free - Real Time
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.content}>

          {/* AUTO DETECT TOGGLE */}
          <View style={styles.toggleRow}>
            <Switch
              value={autoDetect}
              onValueChange={setAutoDetect}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.background}
            />
            <Text style={styles.toggleLabel}>Auto Detect</Text>
          </View>

          {/* LANGUAGE SELECTOR */}
          {!autoDetect && (
            <LanguageSelector
              fromLanguage={fromLang.label}
              toLanguage={toLang.label}
              onSwap={handleSwap}
              onPressFrom={handlePressFrom}
              onPressTo={handlePressTo}
            />
          )}

          {autoDetect && (
            <View style={styles.autoDetectBanner}>
              <Ionicons name="globe-outline" size={16} color={COLORS.primary} />
              <Text style={styles.autoDetectText}>
                Language will be detected automatically
              </Text>
            </View>
          )}

          {/* PUSH TO TALK */}
          <Text style={styles.pushToTalkLabel}>PUSH TO TALK</Text>
          <MicButton
            recordingState={recordingState}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          />
          <Text style={styles.hint}>
            {recordingState === 'idle' && 'Hold mic button to speak - Release to send'}
            {recordingState === 'recording' && 'Listening... Release to send'}
            {recordingState === 'processing' && 'Analyzing and translating...'}
          </Text>

          {/* TRANSCRIPTS */}
          {transcripts.length > 0 && (
            <View style={styles.transcriptContainer}>
              {transcripts.map(item => (
                <TranscriptItem
                  key={item.id}
                  original={item.original}
                  translation={item.translation}
                />
              ))}
            </View>
          )}

        </View>
      </ScrollView>

      {/* LANGUAGE PICKER MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <Animated.View style={[styles.modalContainer, { opacity: overlayAnim }]}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={closeModal}
          />
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: modalAnim }] }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              Select {selectedSide === 'from' ? 'Source' : 'Target'} Language
            </Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    (selectedSide === 'from' ? fromLang : toLang).code === item.code
                    && styles.languageItemSelected
                  ]}
                  onPress={() => handleSelectLanguage(item)}
                >
                  <Text style={[
                    styles.languageItemText,
                    (selectedSide === 'from' ? fromLang : toLang).code === item.code
                    && styles.languageItemTextSelected
                  ]}>
                    {item.label}
                  </Text>
                  {(selectedSide === 'from' ? fromLang : toLang).code === item.code && (
                    <Ionicons name="checkmark-outline" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </Animated.View>
        </Animated.View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.background,
    opacity: 0.8,
    marginTop: 2,
  },
  content: {
    padding: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  autoDetectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F0FE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  autoDetectText: {
    fontSize: 13,
    color: COLORS.primary,
    flex: 1,
  },
  pushToTalkLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: 8,
  },
  hint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  transcriptContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  languageItemSelected: {
    backgroundColor: '#E8F0FE',
    borderColor: COLORS.primary,
  },
  languageItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  languageItemTextSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});