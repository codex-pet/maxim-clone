const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Mock OTP storage (In production, use Redis for expiration)
const otpStore = new Map();

class IdentityService {
  /**
   * Generates a random 6-digit OTP and "sends" it to the user.
   */
  static async requestOTP(phoneNumber) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with timestamp (valid for 5 mins)
    otpStore.set(phoneNumber, {
      otp: otp,
      expiry: Date.now() + 5 * 60 * 1000
    });

    console.log(`[SMS MOCK] To: ${phoneNumber} | Message: Your Maxim-Clone verification code is: ${otp}`);
    
    // TODO: Integrate with real SMS Gateway (Twilio/GlobeLabs) here
    return { success: true, message: 'OTP sent successfully' };
  }

  /**
   * Verifies the OTP and returns a JWT if valid.
   */
  static async verifyOTP(phoneNumber, otp) {
    const storedData = otpStore.get(phoneNumber);

    if (!storedData) {
      throw new Error('OTP not requested for this number');
    }

    if (Date.now() > storedData.expiry) {
      otpStore.delete(phoneNumber);
      throw new Error('OTP expired');
    }

    if (storedData.otp !== otp) {
      throw new Error('Invalid OTP');
    }

    // OTP is valid - Find or Create user using Mongoose
    let user = await User.findOne({ phoneNumber });

    if (!user) {
      // Create draft user with default values
      user = await User.create({
        phoneNumber,
        role: 'PASSENGER'
      });
    }

    // Clean up OTP store
    otpStore.delete(phoneNumber);

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, phoneNumber: user.phoneNumber, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { token, user };
  }

  /**
   * Updates user profile (FR 1.3 - Driver verification metadata)
   */
  static async updateProfile(userId, updates) {
    // Using Mongoose findByIdAndUpdate for clean updates
    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
}

module.exports = IdentityService;
