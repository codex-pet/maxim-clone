import { useState, useRef } from 'react';
import { Audio } from 'expo-av';

export default function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const recordingRef = useRef(null);

  const startRecording = async () => {
    try {
      setError(null);

      // Request permission
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Microphone permission denied');
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);

    } catch (err) {
      setError('Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return null;

      setIsRecording(false);
      setIsProcessing(true);

      await recordingRef.current.stopAndUnloadAsync();

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      setIsProcessing(false);
      return uri;

    } catch (err) {
      setError('Failed to stop recording. Please try again.');
      setIsProcessing(false);
      return null;
    }
  };

  const clearError = () => setError(null);

  return {
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    clearError,
  };
}