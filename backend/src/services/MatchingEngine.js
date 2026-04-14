const User = require('../models/User');
const Ride = require('../models/Ride');

class MatchingEngine {
  /**
   * Request a new ride and find nearby eligible drivers
   * FR 2.1 - Auto-detect GPS vs Manual entry (Handled at frontend, coordinates passed here)
   * FR 2.4 - Ladies-Only Mode logic integration
   */
  static async requestRide(passengerId, pickupLng, pickupLat, dropoffLng, dropoffLat, isLadiesOnly) {
    // 1. Validate the passenger and verify if Ladies-Only is valid for them
    const passenger = await User.findById(passengerId);

    if (!passenger) throw new Error('Passenger not found');

    if (isLadiesOnly && passenger.gender !== 'female') {
      throw new Error('Ladies-Only mode is exclusively for female passengers');
    }

    // 2. Create the Ride Record using Mongoose GeoJSON
    const ride = await Ride.create({
      passengerId: passenger._id,
      pickupLocation: {
        type: 'Point',
        coordinates: [pickupLng, pickupLat]
      },
      dropoffLocation: {
        type: 'Point',
        coordinates: [dropoffLng, dropoffLat]
      },
      isLadiesOnly,
      status: 'REQUESTED'
    });

    // 3. Find nearby active drivers (within 5 km radius) using $near
    // This query finds drivers with verified status, matching gender (if Ladies-Only),
    // and within a specified distance from the pickup point.
    
    const query = {
      role: 'DRIVER',
      isVerified: true,
      liveLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [pickupLng, pickupLat]
          },
          $maxDistance: 5000 // meters
        }
      }
    };

    // FR 2.4 - Enforce Female Drivers for Female Passengers in Ladies-Only Mode
    if (isLadiesOnly) {
      query.gender = 'female';
    }

    const eligibleDrivers = await User.find(query);

    return {
      rideId: ride._id,
      status: 'SEARCHING_DRIVERS',
      eligibleDriversCount: eligibleDrivers.length,
      // We would emit a Socket.io event here to all eligibleDrivers notifying them of the gig
    };
  }
}

module.exports = MatchingEngine;
