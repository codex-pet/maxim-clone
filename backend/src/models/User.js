const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, sparse: true },
  phoneNumber: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  name: { type: String, trim: true, default: '' },
  profilePhoto: { type: String, default: '' },
  role: {
    type: String,
    enum: ['PASSENGER', 'DRIVER', 'ADMIN'],
    default: 'PASSENGER'
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'unspecified'],
    default: 'unspecified'
  },
  liveLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  vehicleInfo: {
    model: { type: String, default: '' },
    plateNumber: { type: String, default: '' },
    color: { type: String, default: '' }
  },
  createdAt: { type: Date, default: Date.now }
});

// For future Driver Tracking features
userSchema.index({ liveLocation: '2dsphere' });

module.exports = mongoose.model('User', userSchema);