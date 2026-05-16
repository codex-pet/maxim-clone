// backend/src/routes/index.js

const express = require('express');
const router = express.Router();
const IdentityService = require('../services/IdentityService');
const multer = require('multer');
const fs = require('fs');
const { OpenAI } = require('openai');
require('dotenv').config();

// Initialize Groq Client
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

// --- MULTER SETUP ---
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '.m4a');
  }
});
const upload = multer({ storage: storage });

// Mapping codes to full names so the AI understands perfectly
const languageMap = {
  'en': 'English',
  'tl': 'Filipino/Tagalog',
  'ceb': 'Bisaya/Cebuano',
  'ilo': 'Ilocano',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ja': 'Japanese'
};

// ==========================================
// TRANSLATION ROUTE (UPGRADED TO AI)
// ==========================================
router.post('/translate-audio', upload.single('audio'), async (req, res) => {
  try {
    const { file } = req;
    const { toLang } = req.body; // e.g., 'en'

    if (!file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // 1. Transcription (Audio to Text)
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(file.path),
      model: 'whisper-large-v3',
    });

    const originalText = transcription.text;

    if (!originalText) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Could not understand audio' });
    }

    // 2. AI Translation (Text to Text)
    // Using Groq's Llama model to translate - it's amazing at dialects!
    const targetLanguageName = languageMap[toLang] || 'English';

    const translationResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the user's text into ${targetLanguageName}. 
          - Only output the translated text. 
          - Do not include any conversational filler or explanations.
          - Maintain the original tone (formal/informal).`
        },
        { role: "user", content: originalText }
      ]
    });


    const translatedText = translationResponse.choices[0].message.content.trim();

    // 3. Clean up
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    // 4. Return results
    res.json({
      original: originalText,
      translation: translatedText,
    });

  } catch (error) {
    console.error('Translation error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to process audio' });
  }
});

// --- AUTH ROUTES ---
router.post('/auth/check-exists', async (req, res) => {
  try {
    const { email, phone } = req.body;
    let user = null;

    if (email) {
      user = await IdentityService.findUserByEmail(email);
    } else if (phone) {
      user = await IdentityService.findUserByPhone(phone);
    }

    res.json({ success: true, exists: !!user });
  } catch (error) {
    console.error('Check exists error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/auth/verify', async (req, res) => {
  try {
    const { idToken, email, role, method, name, gender } = req.body;
    let user;

    if (method === 'firebase') {
      // Use IdentityService to verify Firebase token and sync user
      user = await IdentityService.verifyAndSyncUser(idToken, role, name, gender);
    } else if (method === 'email') {
      // Use IdentityService to sync Email user
      user = await IdentityService.syncEmailUser(email, role, name, gender);
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/auth/update-profile', async (req, res) => {
  try {
    const { userId, name, email, phoneNumber, profilePhoto, vehicleInfo } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (profilePhoto) updateData.profilePhoto = profilePhoto;
    if (vehicleInfo) updateData.vehicleInfo = vehicleInfo;

    const User = require('../models/User'); // Import here to avoid circular dependencies if any
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const User = require('../models/User'); // Import your User model

    // First, try to find by MongoDB _id
    let user = null;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(req.params.id);
    }

    // If not found by _id, try finding by Firebase UID
    if (!user) {
      user = await User.findOne({ firebaseUid: req.params.id });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Fetch user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = router;