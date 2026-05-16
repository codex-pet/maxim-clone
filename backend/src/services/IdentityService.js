const admin = require('firebase-admin');
const User = require('../models/User');

class IdentityService {
  static async verifyAndSyncUser(idToken, role, name, gender) {
    try {
      // 1. Verify token with Firebase
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const { uid, phone_number } = decodedToken;

      if (!phone_number) {
        throw new Error("Phone number not found in token.");
      }

      // 2. Check if user exists in MongoDB
      let user = await User.findOne({ firebaseUid: uid });

      if (!user) {
        // Create new user if they don't exist
        user = new User({
          firebaseUid: uid,
          phoneNumber: phone_number,
          name: name || '',
          role: role || 'PASSENGER',
          gender: gender || 'unspecified'
        });
        await user.save();
        console.log(`✨ New User Registered: ${phone_number} (${name || 'No Name'})`);
      } else {
        // Update name if provided and not already set
        if (name && !user.name) {
          user.name = name;
          await user.save();
        }
        console.log(`🔑 User Logged In: ${phone_number}`);
      }

      return user;
    } catch (error) {
      console.error("IdentityService Error:", error.message);
      throw error;
    }
  }

  static async syncEmailUser(email, role, name, gender) {
    try {
      let user = await User.findOne({ email });

      if (!user) {
        user = new User({
          email,
          name: name || '',
          role: role || 'PASSENGER',
          gender: gender || 'unspecified',
          firebaseUid: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}` 
        });
        await user.save();
        console.log(`✨ New Email User Registered: ${email} (${name || 'No Name'})`);
      } else {
        let needsSave = false;
        if (name && !user.name) {
          user.name = name;
          needsSave = true;
        }
        // Backfill firebaseUid for users created before the field was added
        if (!user.firebaseUid) {
          user.firebaseUid = `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          needsSave = true;
        }
        if (needsSave) await user.save();
        console.log(`🔑 Email User Logged In: ${email}`);
      }
      return user;
    } catch (error) {
      console.error("IdentityService Email Sync Error:", error.message);
      throw error;
    }
  }
  static async findUserByEmail(email) {
    return await User.findOne({ email });
  }

  static async findUserByPhone(phoneNumber) {
    // Also check for firebaseUid mapping if needed, but phone is indexed
    return await User.findOne({ phoneNumber });
  }
}

module.exports = IdentityService;