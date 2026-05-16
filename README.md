================================================================================
MAXIM-CLONE SYSTEM ARCHITECTURE & TECHNICAL BLUEPRINTS
================================================================================

1. HIGH-LEVEL ARCHITECTURE
--------------------------------------------------------------------------------
The system follows a Monolithic Repository architecture containing both Frontend
and Backend services. It is designed for high availability and hybrid connectivity.

- Frontend: React Native (Expo) - Single codebase for Passenger & Driver apps.
- Backend: Node.js + Express - Centralized API, Business Logic, and Orchestration.
- Database: MongoDB with Mongoose - NoSQL Document storage with GeoJSON support.
- Real-Time: Socket.io - Bi-directional communication for tracking and audio.
- SMS Layer: SMS Gateway Integration (e.g. Twilio) - Legacy channel for Lite Mode.
- AI Services: Google Cloud Speech-to-Text & Translation - Cross-lingual comms.

2. DATA FLOW
--------------------------------------------------------------------------------
A. Online Booking:
   Passenger App -> REST API (Request) -> Matching Engine (MongoDB Geospatial) -> 
   Socket.io (Broadcast to Drivers) -> Driver App (Accept) -> 
   Socket.io (Notify Passenger).

B. Offline SMS Booking (Lite Mode):
   Network Monitor (Latency > 2000ms) -> Switch to Lite Mode -> 
   Passenger SMS -> SMS Gateway -> Backend Webhook -> SMS Parser -> 
   Match Engine -> Driver SMS Notify -> Booking Confirmation via SMS.

C. Real-time Communication (Voice-to-Text):
   Mic Press -> Local Voice Buffer -> Backend -> STT API -> Translation API -> 
   Socket.io (Text Payload) -> Receiver Display (Original + Translated).

3. DATABASE ARCHITECTURE (DOCUMENT MODELS)
--------------------------------------------------------------------------------
[USERS Collection]
- _id (ObjectId)
- phoneNumber (String, Unique)
- name (String)
- role (Enum: PASSENGER, DRIVER, ADMIN)
- gender (Enum: male, female, other)
- isVerified (Boolean)
- liveLocation (Point GeoJSON - [long, lat])
- createdAt (Date)

[RIDES Collection]
- _id (ObjectId)
- passengerId (ObjectId -> USERS)
- driverId (ObjectId -> USERS, Nullable)
- status (Enum: REQUESTED, ACCEPTED, STARTED, COMPLETED, CANCELLED)
- pickupLocation (Point GeoJSON)
- dropoffLocation (Point GeoJSON)
- fare (Number)
- isLadiesOnly (Boolean)
- createdAt (Date)

[SMS_LOGS Collection]
- _id (ObjectId)
- phoneNumber (String)
- rawMessage (String)
- processedRideId (ObjectId -> RIDES)

Indexing:
- USERS: 2dsphere index on 'liveLocation' for nearby driver search.
- RIDES: 2dsphere index on 'pickupLocation' and 'dropoffLocation'.

4. API STRUCTURE (v1)
--------------------------------------------------------------------------------
Base URL: /api/v1

Auth & Identity:
- POST /auth/otp/request    - Generate and send OTP via SMS
- POST /auth/otp/verify     - Verify OTP and return JWT

Ride Management:
- POST /rides/request       - Initiate online booking
- GET  /rides/active        - Track current ride status
- PATCH /rides/:id/status   - Update ride lifecycle (Accept/Start/End)

Offline & SMS:
- POST /webhooks/sms        - Ingest incoming SMS requests from Gateway

Safety & Comms:
- PATCH /rides/:id/sos      - Trigger Emergency Alert
- POST /comms/translate     - Processing endpoint for Walkie-Talkie transcription

5. REAL-TIME SYSTEM DESIGN
--------------------------------------------------------------------------------
- Socket.io Namespaces: /rides, /drivers
- Spatial Logic: Drivers emit "updateLocation" every 3-5s.
- Broadcasting: Server uses MongoDB $nearSphere or $geoWithin to identify 
  drivers in 5km radius and emits "rideAvailable" to specific socket IDs.
- Audio Signalling: Small buffers sent via Binary Sockets or uploaded to S3 
  with metadata for immediate STT/Translation pipe triggering.

6. OFFLINE (LITE MODE) + SMS ARCHITECTURE
--------------------------------------------------------------------------------
- Frontend: Continuous heart-beat monitoring. If latency exceeds threshold, 
  heavy assets (Maps/Images) are disabled.
- SMS Formatting: Template defined as "MAXIM BOOK: [Pickup] TO [Dropoff]".
- Backend Parser: Regex-based extraction service translates text strings 
  into geocoded points using Places API before entering the Matching Engine.

7. DEPLOYMENT ARCHITECTURE
--------------------------------------------------------------------------------
- Hosting: AWS (EC2/Elastic Beanstalk) / Vercel
- CI/CD: GitHub Actions (Auto-deploy on push to main)
- Production DB: MongoDB Atlas (Managed Cluster)
- Cache/Queue: Redis (Managed ElastiCache) for real-time state and STT jobs.

8. PROJECT FOLDER STRUCTURE (MONOLITHIC REPO)
--------------------------------------------------------------------------------
maxim-clone/
├── backend/                # Express API
│   ├── src/
│   │   ├── config/         # DB & Environment setup
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business Logic (Matching, Identity, SMS)
│   │   ├── models/         # Mongoose Schemas (User, Ride)
│   │   └── app.js          # Entry point
│   └── package.json
├── frontend/               # Expo App
│   ├── src/
│   │   ├── components/     # UI Elements (WalkieTalkie, Toggles)
│   │   ├── screens/        # Logic-heavy views (Home, LiteMode)
│   │   ├── navigation/     # App routing
│   │   └── utils/          # Network monitoring, SMS formatting
│   └── package.json
└── README.md
================================================================================
