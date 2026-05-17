require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const admin = require('firebase-admin');
const { initDb } = require('./config/db');

// ==========================================
// --- INITIALIZE FIREBASE ADMIN ---
// ==========================================
let serviceAccount;

// Logic to handle Render (Environment Variable) vs Local (File)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    // On Render, we paste the JSON content into this environment variable
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error("❌ Error parsing FIREBASE_SERVICE_ACCOUNT env var:", err.message);
  }
} else {
  try {
    // Locally, we use the file
    serviceAccount = require('./config/serviceAccountKey.json');
  } catch (err) {
    console.log("⚠️ serviceAccountKey.json not found. Ensure FIREBASE_SERVICE_ACCOUNT env var is set.");
  }
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || "https://maxim-clone-default-rtdb.asia-southeast1.firebasedatabase.app"
  });
  console.log("✅ Firebase Admin Initialized");
} else {
  console.error("❌ Firebase Admin failed to initialize: No credentials found.");
}

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ==========================================
// --- MIDDLEWARE ---
// ==========================================
app.use(cors());

// CRITICAL PARSER ORDER:
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.text());

// ==========================================
// --- ROUTES ---
// ==========================================
const routes = require('./routes');
const tripRoutes = require('./routes/tripRoutes');
const smsRoutes = require('./routes/smsRoutes');

app.use('/api', routes);
app.use('/api/trips', tripRoutes);
app.use('/api/sms', smsRoutes);

app.get('/', (req, res) => {
  res.json({
    status: "online",
    message: 'Maxim-Clone Backend API is active.',
    database: process.env.NODE_ENV
  });
});

// ==========================================
// --- ERROR HANDLING ---
// ==========================================

// Catch-All 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.url}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message
  });
});

// ==========================================
// --- SOCKET LOGIC ---
// ==========================================
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on('disconnect', () => console.log('User disconnected'));
});

// ==========================================
// --- START SERVER ---
// ==========================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Initialize MongoDB Connection
    await initDb();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 URL: http://0.0.0.0:${PORT}`);
    });
  } catch (dbError) {
    console.error("❌ Database Initialization Failed:", dbError);
    process.exit(1);
  }
};

startServer();