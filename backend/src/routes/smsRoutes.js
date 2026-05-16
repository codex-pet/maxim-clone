const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const mongoose = require('mongoose'); // NEEDED to generate a dummy ObjectId
const Trip = require('../models/Trip');

router.post('/webhook', async (req, res) => {
    console.log("=========================================");
    console.log("📥 MACRODROID WEBHOOK TRIGGERED!");

    const incomingMessage = req.body.message || req.query.message || '';
    const senderNumber = req.body.sender || req.query.sender || '';

    console.log("Message received:", incomingMessage);
    console.log("Sender received:", senderNumber);

    try {
        if (!incomingMessage.toLowerCase().includes('new ride request')) {
            console.log("⚠️ Ignored: Not a booking SMS. Here is what we received instead:", incomingMessage);
            return res.status(200).json({ success: true, message: 'Ignored: Not a booking' });
        }

        const parseField = (text, field) => {
            const regex = new RegExp(`${field}:\\s*(.+)`, 'i');
            const match = text.match(regex);
            return match ? match[1].trim() : '';
        };

        const passengerName = parseField(incomingMessage, 'Passenger');
        const pickup = parseField(incomingMessage, 'Pickup');
        const destination = parseField(incomingMessage, 'Destination');
        const gpsRaw = parseField(incomingMessage, 'GPS');
        const type = parseField(incomingMessage, 'Type');

        // 1. Parse GPS to exact Numbers
        let lat = 0, lng = 0;
        if (gpsRaw) {
            const parts = gpsRaw.split(',');
            if (parts.length === 2) {
                lat = parseFloat(parts[0].replace(/[^0-9.-]/g, ''));
                lng = parseFloat(parts[1].replace(/[^0-9.-]/g, ''));
            }
        }

        // 2. Strict Enum matching for rideType
        let strictRideType = 'Standard';
        if (type.toLowerCase().includes('ladies')) {
            strictRideType = 'Ladies-Only';
        }

        // 3. Satisfy MongoDB Strict Schema
        const newTripData = {
            // Create a valid dummy ObjectId since the offline user isn't logged in via HTTP
            passengerId: new mongoose.Types.ObjectId(),
            pickupLocation: {
                address: pickup || 'Unknown Pickup',
                latitude: lat,
                longitude: lng
            },
            dropoffLocation: {
                address: destination || 'Any',
                latitude: 0, // Fallback for SMS (required by schema)
                longitude: 0 // Fallback for SMS (required by schema)
            },
            distance: 0,       // Fallback (required by schema)
            estimatedFare: 50, // Fallback base fare (required by schema)
            rideType: strictRideType, // Matches 'Ladies-Only' or 'Standard'
            paymentMethod: 'cash',
            tripStatus: 'Looking for Driver', // MUST match what the driver app is querying for!

            // We will attach these extra fields so the frontend can still show the SMS data
            // Mongoose will ignore fields not in the schema unless you use { strict: false }, 
            // but Firebase will still get them!
            bookingMethod: 'SMS_LITE_MODE',
            passengerName: passengerName || 'SMS User',
            passengerPhone: senderNumber,
        };

        console.log("✅ Parsed Trip Data Ready for DB:", newTripData);

        // 4. Save to MongoDB
        const savedTrip = await Trip.create(newTripData);
        console.log("💾 Saved to MongoDB successfully! Trip ID:", savedTrip._id);

        // 5. Push to Firebase (Optional / Wrap in try-catch)
        try {
            const db = admin.database();
            const firebaseData = JSON.parse(JSON.stringify(savedTrip));

            // Add the extra fields to Firebase so the Driver App knows it's an SMS user
            firebaseData.bookingMethod = 'SMS_LITE_MODE';
            firebaseData.passengerName = passengerName || 'SMS User';
            firebaseData.passengerPhone = senderNumber;

            await db.ref('trips').child(savedTrip._id.toString()).set(firebaseData);
            console.log("📡 Pushed to Firebase successfully!");
        } catch (firebaseError) {
            console.log("⚠️ Firebase push skipped (Realtime DB might not be fully configured). Driver app will still pick it up via MongoDB polling.");
        }

        console.log("=========================================");

        res.status(200).json({ success: true, message: 'SMS Booking processed', tripId: savedTrip._id });

    } catch (error) {
        console.error('❌ Backend Error processing SMS:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
});

module.exports = router;