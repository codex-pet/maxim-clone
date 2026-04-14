const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['PASSENGER', 'DRIVER', 'ADMIN'],
    default: 'PASSENGER'
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  // FR 2.1 - Geolocation tracking for drivers
  liveLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create 2dsphere index for geospatial queries
userSchema.index({ liveLocation: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
