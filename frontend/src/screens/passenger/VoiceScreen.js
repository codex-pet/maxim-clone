import { View, Text, StyleSheet, ScrollView, Switch, Modal, TouchableOpacity, FlatList, Animated, Alert } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import MicButton from '../../components/MicButton';
import LanguageSelector from '../../components/LanguageSelector';
import TranscriptItem from '../../components/TranscriptItem';
import { COLORS } from '../../constants/colors';

const LANGUAGES = [
  { label: 'English', code: 'en' },
  { label: 'Filipino', code: 'tl' },
  { label: 'Bisaya/Cebuano', code: 'ceb' },
  { label: 'Ilocano', code: 'ilo' },
  { label: 'Korean', code: 'ko' },
  { label: 'Chinese', code: 'zh' },
  { label: 'Japanese', code: 'ja' },
];

const BACKEND_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/translate-audio`;

export default function VoiceScreen() {
  const insets = useSafeAreaInsets();
  const [autoDetect, setAutoDetect] = useState(true);
  const [fromLang, setFromLang] = useState(LANGUAGES[1]);
  const [toLang, setToLang] = useState(LANGUAGES[0]);
  const [recordingState, setRecordingState] = useState('idle');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSide, setSelectedSide] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  const [recording, setRecording] = useState(null);

  const modalAnim = useRef(new Animated.Value(300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow microphone access.');
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
    try {
      setRecordingState('recording');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
      setRecordingState('idle');
    }
  };

  const handlePressOut = async () => {
    if (!recording) return;
    setRecordingState('processing');

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      const tempId = Date.now();

      // ✅ CHANGED: Put new translation at the TOP of the array [newItem, ...previousItems]
      setTranscripts(prev => [{ id: tempId, original: '...', translation: 'Translating...' }, ...prev]);

      const formData = new FormData();
      formData.append('audio', { uri, type: 'audio/m4a', name: 'recording.m4a' });
      formData.append('toLang', toLang.code);

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const rawText = await response.text();
      const data = JSON.parse(rawText);

      if (!response.ok) throw new Error(data.error);

      setTranscripts(prev => prev.map(item =>
        item.id === tempId ? { ...item, original: data.original, translation: data.translation } : item
      ));

    } catch (error) {
      Alert.alert('Error', 'Translation failed.');
      console.error(error);
      // Remove the failed placeholder
      setTranscripts(prev => prev.filter(item => item.id !== tempId));
    } finally {
      setRecordingState('idle');
      setRecording(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
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
            <Switch value={autoDetect} onValueChange={setAutoDetect} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor={COLORS.background} />
            <Text style={styles.toggleLabel}>Auto Detect Source Language</Text>
          </View>

          {!autoDetect ? (
            <LanguageSelector fromLanguage={fromLang.label} toLanguage={toLang.label} onSwap={handleSwap} onPressFrom={() => openModal('from')} onPressTo={() => openModal('to')} />
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

          {/* This container now shows the newest items at the top */}
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
                  <TouchableOpacity style={[styles.languageItem, isSelected && styles.languageItemSelected]} onPress={() => handleSelectLanguage(item)}>
                    <Text style={[styles.languageItemText, isSelected && styles.languageItemTextSelected]}>{item.label}</Text>
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
  autoDetectBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E8F0FE', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.primary },
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
  languageItemSelected: { backgroundColor: '#E8F0FE', borderColor: COLORS.primary },
  languageItemText: { fontSize: 16, color: COLORS.text },
  languageItemTextSelected: { color: COLORS.primary, fontWeight: 'bold' },
});