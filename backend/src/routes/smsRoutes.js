const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const Trip = require('../models/Trip');

/**
 * Helper: Calculates distance in KM between two coordinates
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2 || lat1 === 0 || lat2 === 0) return 0;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Webhook handler for Lite Mode (SMS)
 */
router.post('/webhook', async (req, res) => {
    console.log("📥 Incoming SMS Webhook...");

    // 1. Get incoming data (Handles various gateway formats)
    const incomingMessage = req.body.message || req.query.message || '';
    const senderNumber = (req.body.sender || req.body.from || req.query.sender || '').toString().replace(/\s+/g, '');

    try {
        // Only process if it looks like a ride request
        if (!incomingMessage.toLowerCase().includes('new ride request')) {
            console.log("ℹ️ SMS ignored: Not a ride request.");
            return res.status(200).json({ success: true, message: 'Not a booking' });
        }

        // 2. Improved Parser logic
        const parseField = (text, field) => {
            const labels = ['Passenger', 'Pickup', 'Dest', 'Contact', 'Type', 'PGPS', 'DGPS'];
            const lookahead = labels.join('|');
            // This regex captures everything after "Field:" until the next "Label:" or end of string
            const regex = new RegExp(`${field}:\\s*(.*?)(?=\\s*(?:${lookahead}):|$)`, 'is');
            const match = text.match(regex);
            return match ? match[1].trim() : '';
        };

        // Extracting strings from the SMS body
        const passengerName = parseField(incomingMessage, 'Passenger');
        const pickupAddr = parseField(incomingMessage, 'Pickup');
        const destAddr = parseField(incomingMessage, 'Dest');
        const phoneFromMessage = parseField(incomingMessage, 'Contact');
        const pgpsRaw = parseField(incomingMessage, 'PGPS');
        const dgpsRaw = parseField(incomingMessage, 'DGPS');
        const type = parseField(incomingMessage, 'Type');

        // Helper to turn "lat,lng" string into object
        const extractCoords = (raw) => {
            if (!raw || raw.toLowerCase().includes('unknown')) return { lat: 0, lng: 0 };
            const parts = raw.split(',');
            return {
                lat: parseFloat(parts[0]) || 0,
                lng: parseFloat(parts[1]) || 0
            };
        };

        const pCoords = extractCoords(pgpsRaw);
        const dCoords = extractCoords(dgpsRaw);

        // 3. Distance and Fare calculation
        const distance = calculateDistanceKm(pCoords.lat, pCoords.lng, dCoords.lat, dCoords.lng);
        const fare = distance > 0 ? Math.round(50 + (distance * 15)) : 50;

        // 4. Construct the Trip Object
        // IMPORTANT: Prioritize the phone number written in the message
        const finalPhone = phoneFromMessage || senderNumber || 'Unknown';

        const newTripData = {
            passengerId: new mongoose.Types.ObjectId(), // Generate temporary ID for SMS users
            pickupLocation: {
                address: pickupAddr || 'Unknown Pickup',
                latitude: pCoords.lat,
                longitude: pCoords.lng
            },
            dropoffLocation: {
                address: destAddr || 'Anywhere',
                latitude: dCoords.lat,
                longitude: dCoords.lng
            },
            distance: parseFloat(distance.toFixed(2)),
            estimatedFare: fare,
            rideType: type.toLowerCase().includes('ladies') ? 'Ladies-Only' : 'Standard',
            paymentMethod: 'cash',
            tripStatus: 'Looking for Driver',
            bookingMethod: 'SMS_LITE_MODE',
            passengerName: passengerName || 'SMS User',
            passengerPhone: finalPhone, // Correctly mapped phone number
            createdAt: new Date()
        };

        // 5. Save to MongoDB
        const savedTrip = await Trip.create(newTripData);
        console.log(`✅ Trip ${savedTrip._id} saved to MongoDB`);

        // 6. Sync to Firebase Realtime Database for Driver App instant updates
        try {
            const db = admin.database();
            // Convert Mongoose doc to plain JSON
            const firebaseData = JSON.parse(JSON.stringify(savedTrip));

            // Ensure fields required by driver app are flat at top level
            firebaseData.passengerPhone = finalPhone;
            firebaseData.passengerName = passengerName || 'SMS User';
            firebaseData.bookingMethod = 'SMS_LITE_MODE';

            await db.ref('trips').child(savedTrip._id.toString()).set(firebaseData);
            console.log("🔥 Firebase Sync Success");
        } catch (fErr) {
            console.error("❌ Firebase Sync Failed:", fErr.message);
        }

        res.status(200).json({
            success: true,
            tripId: savedTrip._id,
            phoneNumberUsed: finalPhone
        });

    } catch (error) {
        console.error('CRITICAL Webhook Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;