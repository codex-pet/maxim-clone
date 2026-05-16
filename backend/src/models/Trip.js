const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  passengerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  pickupLocation: {
    address: String,
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  dropoffLocation: {
    address: String,
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  distance: {
    type: Number, // in kilometers
    required: true
  },
  estimatedFare: {
    type: Number,
    required: true
  },
  rideType: {
    type: String,
    enum: ['Standard', 'Ladies-Only'],
    default: 'Standard'
  },
  paymentMethod: {
    type: String,
    enum: ['gcash', 'maya', 'cash', 'card'],
    default: 'cash'
  },
  tripStatus: {
    type: String,
    enum: ['Pending', 'Looking for Driver', 'Accepted', 'Arriving', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prototype logic: Indexing for faster queries if needed later
tripSchema.index({ passengerId: 1, createdAt: -1 });

module.exports = mongoose.model('Trip', tripSchema);
