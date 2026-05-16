const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const User = require('../models/User');

/**
 * PROTOTYPE LOGIC: Get latest pending trip for simulation
 * FIX: Now filters out Ladies-Only rides if the requesting driver is male.
 */
router.get('/latest-pending', async (req, res) => {
  try {
    const { driverGender } = req.query; // Expecting the frontend to pass ?driverGender=male/female

    // Base query: Looking for a driver
    let query = { tripStatus: 'Looking for Driver', driverId: null };

    // FIX: If the driver is NOT female, hide 'Ladies-Only' rides from them
    if (!driverGender || driverGender.toLowerCase() !== 'female') {
      // $ne means "Not Equal" -> Only show rides that are NOT Ladies-Only
      query.rideType = { $ne: 'Ladies-Only' };
    }

    const trip = await Trip.findOne(query)
      .populate('passengerId', 'name gender')
      .sort({ createdAt: -1 });

    res.json({ success: true, trip });
  } catch (error) {
    console.error('Error fetching pending trip:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trip' });
  }
});

/**
 * GET DRIVER SUMMARY: Stats and recent trips
 */
router.get('/driver-summary/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get completed trips for today
    const tripsToday = await Trip.find({
      driverId,
      tripStatus: 'Completed',
      createdAt: { $gte: today }
    });

    const earningsToday = tripsToday.reduce((sum, trip) => sum + (trip.estimatedFare || 0), 0);

    // Get last 5 completed or cancelled trips
    const recentTrips = await Trip.find({
      driverId,
      tripStatus: { $in: ['Completed', 'Cancelled'] }
    })
      .populate('passengerId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        tripsCount: tripsToday.length,
        earningsToday: earningsToday,
        rating: 4.8 // Prototype hardcoded rating
      },
      recentTrips: recentTrips.map(t => ({
        id: t._id,
        passenger: t.passengerName || t.passengerId?.name || 'SMS User',
        rideType: t.rideType,
        status: t.tripStatus,
        bookingMethod: t.bookingMethod || 'ONLINE',
        from: t.pickupLocation?.address || 'Unknown',
        fromCoords: {
          latitude: t.pickupLocation?.latitude,
          longitude: t.pickupLocation?.longitude
        },
        to: t.dropoffLocation?.address || 'Unknown',
        fare: `₱ ${t.estimatedFare}`,
        date: new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + (new Date(t.createdAt).toDateString() === new Date().toDateString() ? ', Today' : `, ${new Date(t.createdAt).toLocaleDateString()}`)
      }))
    });
  } catch (error) {
    console.error('Driver summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch driver summary' });
  }
});

/**
 * GET PASSENGER HISTORY: Recent trips for a passenger
 */
router.get('/passenger-history/:passengerId', async (req, res) => {
  try {
    const { passengerId } = req.params;

    // Get all trips for this passenger, sorted by date
    const trips = await Trip.find({ passengerId })
      .populate('driverId', 'name vehicleInfo')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      history: trips.map(t => ({
        id: t._id,
        driverName: t.driverId?.name || 'Searching...',
        vehicleInfo: t.driverId?.vehicleInfo || null,
        rideType: t.rideType,
        status: t.tripStatus,
        from: t.pickupLocation?.address || 'Unknown',
        to: t.dropoffLocation?.address || 'Unknown',
        fare: `₱ ${t.estimatedFare}`,
        distance: t.distance,
        paymentMethod: t.paymentMethod,
        date: new Date(t.createdAt).toLocaleDateString() + ' ' + new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }))
    });
  } catch (error) {
    console.error('Passenger history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trip history' });
  }
});

/**
 * PROTOTYPE LOGIC: Create a new trip
 */
router.post('/', async (req, res) => {
  try {
    const {
      passengerId,
      pickupLocation,
      dropoffLocation,
      distance,
      estimatedFare,
      rideType
    } = req.body;

    const newTrip = new Trip({
      passengerId,
      pickupLocation,
      dropoffLocation,
      distance,
      estimatedFare,
      rideType,
      tripStatus: 'Pending' // Or 'Looking for Driver' depending on your flow
    });

    const savedTrip = await newTrip.save();
    res.status(201).json({ success: true, trip: savedTrip });
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ success: false, message: 'Failed to create trip request' });
  }
});

/**
 * PROTOTYPE LOGIC: Ladies-Only Driver Matching
 */
router.get('/available-drivers', async (req, res) => {
  try {
    const { rideType, passengerGender } = req.query;

    let query = { role: 'DRIVER' };

    if (rideType === 'Ladies-Only') {
      if (passengerGender !== 'female') {
        return res.status(403).json({
          success: false,
          message: 'Ladies-Only mode is only available for female passengers.'
        });
      }
      query.gender = 'female';
    }

    const drivers = await User.find(query).select('name gender liveLocation');
    res.json({ success: true, drivers });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch available drivers' });
  }
});

// ==========================================
// 🚨 GET SINGLE TRIP (For Polling)
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    // Populate driver and passenger info
    const trip = await Trip.findById(req.params.id)
      .populate('driverId', 'name gender vehicleInfo')
      .populate('passengerId', 'name gender');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    res.json({ success: true, trip });
  } catch (error) {
    console.error('Error fetching single trip:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trip' });
  }
});

/**
 * Update trip details (Prototype)
 */
router.put('/:id', async (req, res) => {
  try {
    const { paymentMethod, status } = req.body;
    const updateData = {};
    if (paymentMethod) updateData.paymentMethod = paymentMethod;

    // Updates tripStatus based on the frontend request
    if (status) updateData.tripStatus = status;

    const updatedTrip = await Trip.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedTrip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    res.json({ success: true, trip: updatedTrip });
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ success: false, message: 'Failed to update trip' });
  }
});

/**
 * Driver accepts a trip (Prototype)
 * FIX: Backend security validation to block males from accepting ladies-only
 */
router.patch('/:id/accept', async (req, res) => {
  try {
    const { driverId } = req.body;

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (trip.tripStatus !== 'Looking for Driver') {
      return res.status(400).json({ success: false, message: 'Trip already taken by another driver.' });
    }

    // FIX: Verify driver gender if this is a Ladies-Only ride
    if (trip.rideType === 'Ladies-Only') {
      const driver = await User.findById(driverId);
      if (!driver || driver.gender?.toLowerCase() !== 'female') {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Only female drivers can accept Ladies-Only rides.'
        });
      }
    }

    const updatedTrip = await Trip.findByIdAndUpdate(
      req.params.id,
      {
        driverId,
        tripStatus: 'Accepted'
      },
      { new: true }
    ).populate('passengerId', 'name gender')
      .populate('driverId', 'name gender vehicleInfo');

    if (!updatedTrip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    res.json({ success: true, trip: updatedTrip });
  } catch (error) {
    console.error('Error accepting trip:', error);
    res.status(500).json({ success: false, message: 'Failed to accept trip' });
  }
});

/**
 * Update Trip Status (Prototype)
 * Transitions: Accepted -> Arriving -> In Progress -> Completed
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const trip = await Trip.findByIdAndUpdate(
      req.params.id,
      { tripStatus: status },
      { new: true }
    ).populate('passengerId', 'name gender')
      .populate('driverId', 'name gender vehicleInfo');

    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    res.json({ success: true, trip });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update trip status' });
  }
});

/**
 * Update Driver Status (Prototype)
 */
router.patch('/driver-status/:id', async (req, res) => {
  try {
    const { status } = req.body; // Offline, Online, Busy
    await User.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

module.exports = router;