import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

const WalkieTalkie = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, original: 'Saan po kayo?', translated: 'Where are you?', lang: 'TL', sender: 'driver' }
  ]);
  
  // Animation for the "Hold to Speak" button
  const pulseAnim = useState(new Animated.Value(1))[0];

  const handlePressIn = () => {
    setIsRecording(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true })
      ])
    ).start();
  };

  const handlePressOut = () => {
    setIsRecording(false);
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);

    // Mock completing a voice recording -> getting translation back from server
    const newMsg = {
      id: Date.now(),
      original: "Wait lang po",
      translated: "Please wait a moment",
      lang: 'TL',
      sender: 'passenger'
    };
    setMessages(prev => [...prev, newMsg]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Translator Radio</Text>
      
      <View style={styles.chatArea}>
        {messages.map(msg => (
          <View key={msg.id} style={[styles.bubbleWrapper, msg.sender === 'passenger' ? styles.bubbleRight : styles.bubbleLeft]}>
            <View style={[styles.bubble, msg.sender === 'passenger' ? styles.passengerBubble : styles.driverBubble]}>
              <Text style={styles.originalText}>"{msg.original}"</Text>
              <View style={styles.divider} />
              <Text style={styles.translatedText}>{msg.translated}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.recordArea}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={[styles.micButton, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.micIcon}>{isRecording ? '🎙️ (Recording...)' : '🎙️ Hold to Speak'}</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginVertical: 20,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center'
  },
  chatArea: {
    minHeight: 120,
    marginBottom: 20,
  },
  bubbleWrapper: {
    marginBottom: 15,
    width: '100%',
  },
  bubbleRight: { alignItems: 'flex-end' },
  bubbleLeft: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 8,
  },
  driverBubble: { backgroundColor: '#E8F4F8' },
  passengerBubble: { backgroundColor: '#F0F0F0' },
  originalText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginBottom: 5,
  },
  translatedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  recordArea: {
    alignItems: 'center',
  },
  micButton: {
    backgroundColor: '#0A3D62',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
  },
  micIcon: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default WalkieTalkie;
