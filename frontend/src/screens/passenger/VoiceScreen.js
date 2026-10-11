import { View, Text, StyleSheet, ScrollView, Switch, Modal, TouchableOpacity, FlatList, Animated, Alert } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync } from 'expo-audio';
import { File, UploadType } from 'expo-file-system';
import MicButton from '../../components/MicButton';
import LanguageSelector from '../../components/LanguageSelector';
import TranscriptItem from '../../components/TranscriptItem';
import { COLORS } from '../../constants/colors';
import { getApiUrl } from '../../config/api';

const LANGUAGES = [
  { label: 'English', code: 'en' },
  { label: 'Filipino', code: 'tl' },
  { label: 'Bisaya/Cebuano', code: 'ceb' },
  { label: 'Ilocano', code: 'ilo' },
  { label: 'Korean', code: 'ko' },
  { label: 'Chinese', code: 'zh' },
  { label: 'Japanese', code: 'ja' },
];

export default function VoiceScreen() {
  const insets = useSafeAreaInsets();
  const [autoDetect, setAutoDetect] = useState(true);
  const [fromLang, setFromLang] = useState(LANGUAGES[1]);
  const [toLang, setToLang] = useState(LANGUAGES[0]);
  const [recordingState, setRecordingState] = useState('idle');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSide, setSelectedSide] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  
  const isRecording = useRef(false);
  const isProcessing = useRef(false);
  const recordingStartTime = useRef(null);

  const modalAnim = useRef(new Animated.Value(300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const perm = await AudioModule.requestRecordingPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Denied', 'Please allow microphone access in device settings.');
        }
      } catch (e) {
        console.warn('Audio permissions error:', e);
      }
    })();
  }, []);

  const openModal = (side) => {
    setSelectedSide(side);
    setModalVisible(true);
    Animated.parallel([
      Animated.spring(modalAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalAnim, { toValue: 300, duration: 300, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setModalVisible(false));
  };

  const handleSwap = () => {
    const temp = fromLang;
    setFromLang(toLang);
    setToLang(temp);
  };

  const handleSelectLanguage = (lang) => {
    if (selectedSide === 'from') setFromLang(lang);
    else setToLang(lang);
    closeModal();
  };

  const handlePressIn = async () => {
    if (isRecording.current || isProcessing.current) return;

    try {
      const perm = await AudioModule.getRecordingPermissionsAsync();
      if (!perm.granted) {
        const req = await AudioModule.requestRecordingPermissionsAsync();
        if (!req.granted) {
          Alert.alert('Permission Required', 'Microphone permission is required to record voice messages.');
          return;
        }
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Crucial: Must prepare recorder before starting in expo-audio
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      recordingStartTime.current = Date.now();
      isRecording.current = true;
      setRecordingState('recording');
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Recording error', err.message || 'Could not start recording.');
      setRecordingState('idle');
      isRecording.current = false;
      try {
        await setAudioModeAsync({ allowsRecording: false });
      } catch (modeError) {}
    }
  };

  const handlePressOut = async () => {
    if (!isRecording.current || isProcessing.current) return;

    const duration = Date.now() - (recordingStartTime.current || 0);

    // If held for less than 1 second, discard
    if (duration < 1000) {
      isRecording.current = false;
      setRecordingState('idle');
      try {
        await audioRecorder.stop();
        await setAudioModeAsync({ allowsRecording: false });
      } catch (e) {}
      Alert.alert('Too short', 'Please hold the mic button while speaking.');
      return;
    }

    isRecording.current = false;
    isProcessing.current = true;
    setRecordingState('processing');
    let tempId = null;

    try {
      await audioRecorder.stop();
      await setAudioModeAsync({ allowsRecording: false });

      // Wait 350ms for the OS to finalize the audio container on disk
      await new Promise((resolve) => setTimeout(resolve, 350));

      const uri = audioRecorder.uri;
      console.log('Recorded URI:', uri);

      if (!uri) {
        throw new Error('No audio recording URI found. Please try again.');
      }

      const audioFile = new File(uri);
      console.log('File details - exists:', audioFile.exists, 'size:', audioFile.size);

      if (!audioFile.exists || !audioFile.size || audioFile.size === 0) {
        throw new Error('The recorded audio file is empty or unavailable. Please record again.');
      }

      tempId = Date.now();
      setTranscripts(prev => [{ id: tempId, original: '...', translation: 'Translating...' }, ...prev]);

      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 60000);
      let response;
      try {
        response = await audioFile.upload(getApiUrl('/api/translate-audio'), {
          httpMethod: 'POST',
          uploadType: UploadType.MULTIPART,
          fieldName: 'audio',
          mimeType: 'audio/mp4',
          sessionType: 'foreground',
          signal: abortController.signal,
          parameters: {
            toLang: toLang.code,
            fromLang: fromLang.code,
            autoDetect: String(autoDetect),
            translationMode: 'translate_only',
          },
        });
      } catch (uploadError) {
        if (uploadError.name === 'AbortError') {
          throw new Error('Translation request timed out. Check your connection.');
        }
        throw uploadError;
      } finally {
        clearTimeout(timeoutId);
      }

      const data = JSON.parse(response.body);
      if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || `Translation service returned status ${response.status}.`);
      }
      if (typeof data.original !== 'string' || typeof data.translation !== 'string') {
        throw new Error('Translation service returned an invalid response.');
      }

      setTranscripts(prev => prev.map(item =>
        item.id === tempId ? { ...item, original: data.original, translation: data.translation } : item
      ));

    } catch (error) {
      console.error('Translation error:', error);
      Alert.alert('Translation failed', error.message || 'Could not upload or translate the recording.');
      if (tempId !== null) {
        setTranscripts(prev => prev.filter(item => item.id !== tempId));
      }
    } finally {
      isProcessing.current = false;
      setRecordingState('idle');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.page }}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <Ionicons name="mic-outline" size={28} color={COLORS.background} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Voice Comm</Text>
            <Text style={styles.headerSubtitle}>Auto Translate - Hands Free - Real Time</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.content}>
          <View style={styles.toggleRow}>
            <Switch
              value={autoDetect}
              onValueChange={setAutoDetect}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.background}
            />
            <Text style={styles.toggleLabel}>Auto Detect Source Language</Text>
          </View>

          {!autoDetect ? (
            <LanguageSelector
              fromLanguage={fromLang.label}
              toLanguage={toLang.label}
              onSwap={handleSwap}
              onPressFrom={() => openModal('from')}
              onPressTo={() => openModal('to')}
            />
          ) : (
            <View style={styles.autoDetectBanner}>
              <Ionicons name="globe-outline" size={16} color={COLORS.primary} />
              <Text style={styles.autoDetectText}>AI auto-detecting spoken language</Text>
              <TouchableOpacity onPress={() => openModal('to')} style={styles.miniTargetBtn}>
                <Text style={styles.miniTargetText}>To: {toLang.label}</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.pushToTalkLabel}>PUSH TO TALK</Text>
          <MicButton recordingState={recordingState} onPressIn={handlePressIn} onPressOut={handlePressOut} />

          <Text style={styles.hint}>
            {recordingState === 'idle' && 'Hold mic button to speak - Release to send'}
            {recordingState === 'recording' && 'Listening... Release to send'}
            {recordingState === 'processing' && 'AI is translating...'}
          </Text>

          {transcripts.length > 0 && (
            <View style={styles.transcriptContainer}>
              {transcripts.map(item => (
                <TranscriptItem key={item.id} original={item.original} translation={item.translation} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
        <Animated.View style={[styles.modalContainer, { opacity: overlayAnim }]}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal} />
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: modalAnim }] }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select {selectedSide === 'from' ? 'Source' : 'Target'} Language</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={item => item.code}
              renderItem={({ item }) => {
                const isSelected = (selectedSide === 'from' ? fromLang : toLang).code === item.code;
                return (
                  <TouchableOpacity
                    style={[styles.languageItem, isSelected && styles.languageItemSelected]}
                    onPress={() => handleSelectLanguage(item)}
                  >
                    <Text style={[styles.languageItemText, isSelected && styles.languageItemTextSelected]}>
                      {item.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-outline" size={20} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingBottom: 24 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.background },
  headerSubtitle: { fontSize: 12, color: COLORS.background, opacity: 0.8, marginTop: 2 },
  content: { padding: 16 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  toggleLabel: { fontSize: 16, color: COLORS.text },
  autoDetectBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.secondaryLight, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.secondary },
  autoDetectText: { fontSize: 13, color: COLORS.primary, flex: 1 },
  miniTargetBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  miniTargetText: { color: COLORS.background, fontSize: 12, fontWeight: 'bold' },
  pushToTalkLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.textSecondary, textAlign: 'center', letterSpacing: 2, marginTop: 8 },
  hint: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  transcriptContainer: { backgroundColor: COLORS.background, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalOverlay: { flex: 1 },
  modalContent: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, elevation: 10 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  languageItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  languageItemSelected: { backgroundColor: COLORS.secondaryLight, borderColor: COLORS.secondary },
  languageItemText: { fontSize: 16, color: COLORS.text },
  languageItemTextSelected: { color: COLORS.primary, fontWeight: 'bold' },
});