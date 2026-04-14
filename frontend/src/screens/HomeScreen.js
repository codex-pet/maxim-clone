import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Linking, ScrollView } from 'react-native';
import WalkieTalkie from '../components/WalkieTalkie';

const HomeScreen = ({ navigation }) => {
  const [isLiteMode, setIsLiteMode] = useState(false);
  const [isLadiesOnly, setIsLadiesOnly] = useState(false);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [latency, setLatency] = useState(50); // mock latency in ms

  // Mock Latency Monitor (FR 3.1)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate fluctuating network ping
      const currentPing = Math.floor(Math.random() * 3000);
      setLatency(currentPing);

      if (currentPing > 2000 && !isLiteMode) {
        setIsLiteMode(true);
        Alert.alert(
          "Weak Connection Detected",
          "We've switched you to Lite Mode. You can now book offline via SMS."
        );
      } else if (currentPing < 500 && isLiteMode) {
        setIsLiteMode(false);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isLiteMode]);

  const handleBooking = () => {
    if (!pickup || !dropoff) {
      Alert.alert('Error', 'Please enter pickup and dropoff locations.');
      return;
    }

    if (isLiteMode) {
      // Offline Booking formulation (FR 3.3)
      const modeString = isLadiesOnly ? 'MODE: Ladies' : '';
      const smsBody = `MAXIM BOOK: ${pickup} TO ${dropoff} ${modeString}`.trim();

      // Open native SMS app
      // Replace with your Twilio/Gateway webhook number
      const gatewayNumber = '1234567890';
      Linking.openURL(`sms:${gatewayNumber}?body=${encodeURIComponent(smsBody)}`);
    } else {
      // Online REST API call would go here
      Alert.alert('Booking', `Online Request Sent for a ${isLadiesOnly ? 'Ladies-Only' : 'Standard'} ride.`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Status Bar */}
      <View style={[styles.statusBar, isLiteMode ? styles.statusOffline : styles.statusOnline]}>
        <Text style={styles.statusText}>
          {isLiteMode ? `LITE MODE (Offline) - Ping: ${latency}ms` : `ONLINE - Ping: ${latency}ms`}
        </Text>
      </View>

      <Text style={styles.title}>Maxim</Text>

      {/* Input Fields (Text-only fallback UI) */}
      <TextInput
        style={styles.input}
        placeholder="Enter Pickup Location"
        value={pickup}
        onChangeText={setPickup}
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        placeholder="Enter Dropoff Location"
        value={dropoff}
        onChangeText={setDropoff}
        placeholderTextColor="#999"
      />

      {/* Ladies-Only Toggle (FR 2.3, 2.4) */}
      <TouchableOpacity
        style={[styles.ladiesToggle, isLadiesOnly && styles.ladiesToggleActive]}
        onPress={() => setIsLadiesOnly(!isLadiesOnly)}
      >
        <Text style={[styles.ladiesText, isLadiesOnly && styles.ladiesTextActive]}>
          {isLadiesOnly ? "🌸 Ladies-Only Mode: ON" : "Enable Ladies-Only Mode"}
        </Text>
      </TouchableOpacity>

      {/* CTA Button (High Visibility - UI Paradigm 4.2) */}
      <TouchableOpacity style={styles.button} onPress={handleBooking}>
        <Text style={styles.buttonText}>
          {isLiteMode ? 'Book via SMS' : 'Book Ride'}
        </Text>
      </TouchableOpacity>

      {/* Integration of Remote Language Support explicitly for FR 4 */}
      <WalkieTalkie />

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8F9FA', // Light generic bg
    padding: 20,
    justifyContent: 'center',
  },
  statusBar: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusOnline: { backgroundColor: '#4CAF50' }, // Green for Good Network
  statusOffline: { backgroundColor: '#F44336' }, // Red for Lite Mode
  statusText: { color: '#FFF', fontWeight: 'bold' },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0A3D62', // Dark Blue Primary
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    color: '#333'
  },
  ladiesToggle: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E84393', // Accent Pink
    marginBottom: 30,
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  ladiesToggleActive: {
    backgroundColor: '#E84393',
  },
  ladiesText: {
    color: '#E84393',
    fontWeight: 'bold',
    fontSize: 16,
  },
  ladiesTextActive: {
    color: '#FFF',
  },
  button: {
    backgroundColor: '#F39C12', // Yellow/Orange CTA
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  }
});

export default HomeScreen;
