const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const Trip = require('../models/Trip');

// Haversine helper to calculate distance based on coordinates
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2 || lat1 === 0) return 0;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// FIX: Changed from router.post to router.all to catch Macrodroid regardless of method
router.all('/webhook', async (req, res) => {
    // FIX: Force Macrodroid & Ngrok to close the socket immediately to prevent freezing
    res.set('Connection', 'close');
    res.set('ngrok-skip-browser-warning', 'true');

    console.log("-----------------------------------------");
    console.log("📥 MACRODROID WEBHOOK DETECTED");

    let rawMessage = '';
    let senderNumber = 'Unknown';

    // Handle Text vs JSON/Form-Data safely
    if (typeof req.body === 'string' && req.body.length > 0) {
        rawMessage = req.body;
        senderNumber = req.query.sender || req.query.number || req.query.from || 'Unknown';
    } else {
        const data = { ...req.query, ...req.body };
        rawMessage = data.message || data.text || data.Body || data.body || data.content || data.sms || '';
        senderNumber = (data.sender || data.from || data.From || data.phone || data.number || 'Unknown').toString().replace(/\s/g, '');
    }

    console.log("🔍 SENDER:", senderNumber);
    console.log("🔍 MSG:", rawMessage);

    // Reject invalid messages
    if (!rawMessage || !rawMessage.toLowerCase().includes('ride request')) {
        console.log("❌ REJECTED: Message content does not look like a booking.");
        return res.status(200).json({ success: false, message: 'Not a booking or empty payload' });
    }

    try {
        const cleanMsg = rawMessage.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ");

        const parseField = (text, field) => {
            const regex = new RegExp(`${field}:\\s*(.*?)(?=\\s*(?:Passenger|Pickup|Dest|Contact|Type|PGPS|DGPS):|$)`, 'i');
            const match = text.match(regex);
            return match ? match[1].trim() : '';
        };

        const passengerName = parseField(cleanMsg, 'Passenger') || 'SMS User';
        const pickupAddr = parseField(cleanMsg, 'Pickup') || 'Unknown Pickup';
        const destAddr = parseField(cleanMsg, 'Dest') || 'Anywhere';
        const contact = parseField(cleanMsg, 'Contact') || senderNumber;
        const rawType = parseField(cleanMsg, 'Type').toLowerCase();

        // Safe Coordinates
        const pgps = (parseField(cleanMsg, 'PGPS') || "0,0").split(',');
        const dgps = (parseField(cleanMsg, 'DGPS') || "0,0").split(',');

        const pLat = parseFloat(pgps[0]) || 0;
        const pLng = parseFloat(pgps[1]) || 0;
        const dLat = parseFloat(dgps[0]) || 0;
        const dLng = parseFloat(dgps[1]) || 0;

        const dist = calculateDistanceKm(pLat, pLng, dLat, dLng);
        const isLadiesOnly = rawType.includes('ladies');
        const rideType = isLadiesOnly ? 'Ladies-Only' : 'Standard';

        console.log(`✅ PARSED: ${passengerName} | ${rideType} | ${dist.toFixed(2)}km`);

        // Database logic
        const newTrip = new Trip({
            passengerId: new mongoose.Types.ObjectId(),
            passengerName: passengerName,
            passengerPhone: contact,
            pickupLocation: { address: pickupAddr, latitude: pLat, longitude: pLng },
            dropoffLocation: { address: destAddr, latitude: dLat, longitude: dLng },
            distance: parseFloat(dist.toFixed(2)),
            estimatedFare: Math.round(50 + (dist * 15)),
            rideType: rideType,
            tripStatus: 'Looking for Driver',
            bookingMethod: 'SMS_LITE_MODE',
            createdAt: new Date()
        });

        const savedTrip = await newTrip.save();
        console.log("💾 MONGO SAVED:", savedTrip._id);

        try {
            await admin.database().ref(`trips/${savedTrip._id}`).set({
                ...savedTrip.toObject(),
                tripId: savedTrip._id.toString(),
                _id: savedTrip._id.toString(),
                passengerId: savedTrip.passengerId.toString(),
                isLadiesOnly: isLadiesOnly
            });
            console.log("🔥 FIREBASE SYNCED");
        } catch (fbErr) {
            console.error("⚠️ Firebase Sync Error:", fbErr.message);
        }

        // Return Success
        return res.status(200).json({ success: true, tripId: savedTrip._id });

    } catch (error) {
        console.error('❌ WEBHOOK CRITICAL ERROR:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;