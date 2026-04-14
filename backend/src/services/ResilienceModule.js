const User = require('../models/User');
const MatchingEngine = require('./MatchingEngine');

class ResilienceModule {
  /**
   * Processes incoming SMS Webhook (from Twilio, Globe Labs, etc.)
   * Example Expected Payload Body (FR 3.2, FR 3.3):
   * "MAXIM BOOK: [Pickup Address] TO [Dropoff Address] MODE: [Standard/Ladies]"
   */
  static async handleSMSWebhook(reqBody) {
    const senderNumber = reqBody.From; // Phone number of passenger sending the SMS
    const messageContent = reqBody.Body; // The raw SMS text

    // 1. Authenticate user from phone number using Mongoose
    const passenger = await User.findOne({ phoneNumber: senderNumber });

    if (!passenger) {
      return this._generateSMSResponse('User not found. Please register via the Maxim-Clone app first.');
    }

    // 2. Parse the SMS Content
    const parsedData = this._parseSMSBooking(messageContent);
    if (!parsedData.isValid) {
      return this._generateSMSResponse('Invalid format. Please use: MAXIM BOOK: [Pickup] TO [Dropoff]');
    }

    // 3. Geocode Addresses to Coordinates (FR 3.4)
    // Here we would call Google Maps Geocoding API to translate text addresses to Lng/Lat
    // For boilerplate, we'll mock the geocoded coordinates:
    const mockPickupLng = 121.0503;
    const mockPickupLat = 14.5826;
    const mockDropoffLng = 121.0223;
    const mockDropoffLat = 14.5547;
    
    // Determine mode
    const isLadiesOnly = parsedData.mode && parsedData.mode.toLowerCase() === 'ladies';

    try {
      // 4. Delegate to standard online engine
      const rideData = await MatchingEngine.requestRide(
        passenger._id, 
        mockPickupLng, mockPickupLat, 
        mockDropoffLng, mockDropoffLat, 
        isLadiesOnly
      );

      // 5. Acknowledge Receipt via SMS Return
      return this._generateSMSResponse(
        `Booking Received! Searching for drivers near ${parsedData.pickup}. We will text you once a driver accepts.`
      );
    } catch (error) {
      return this._generateSMSResponse(`Booking failed: ${error.message}`);
    }
  }

  /**
   * Simple Regex parsing for SMS formats
   */
  static _parseSMSBooking(text) {
    // Basic Regex: MAXIM BOOK: (.*?) TO (.*?) MODE: (.*)
    const regex = /MAXIM BOOK:\s*(.*?)\s*TO\s*(.*?)(?:\s*MODE:\s*(.*))?$/i;
    const match = text.match(regex);

    if (match) {
      return {
        isValid: true,
        pickup: match[1].trim(),
        dropoff: match[2].trim(),
        mode: match[3] ? match[3].trim() : 'Standard'
      };
    }

    return { isValid: false };
  }

  /**
   * Helper to format output strictly as TwiML (Twilio SMS Response XML)
   */
  static _generateSMSResponse(message) {
    return `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
          <Message>${message}</Message>
      </Response>`;
  }
}

module.exports = ResilienceModule;
