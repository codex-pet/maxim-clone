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
const serviceAccount = require('./config/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://maxim-clone-default-rtdb.asia-southeast1.firebasedatabase.app"
});

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

// 🚨 CRITICAL PARSER ORDER FOR MACRODROID:
// This ensures whatever format Macrodroid uses, Express handles it correctly.
app.use(express.json({ limit: '10mb' })); // Parses application/json
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parses application/x-www-form-urlencoded
app.use(express.text()); // Parses raw text

// ==========================================
// --- ROUTES ---
// ==========================================
const routes = require('./routes');
const tripRoutes = require('./routes/tripRoutes');
const smsRoutes = require('./routes/smsRoutes');

app.use('/api', routes);
app.use('/api/trips', tripRoutes);
app.use('/api/sms', smsRoutes); // Webhook lives here: /api/sms/webhook

app.get('/', (req, res) => {
  res.json({ message: 'Maxim-Clone Backend API is active and Firebase is synced.' });
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
server.listen(PORT, '0.0.0.0', async () => {
  try {
    await initDb();
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`🔥 Firebase Realtime DB connected: https://maxim-clone-default-rtdb.asia-southeast1.firebasedatabase.app`);
  } catch (dbError) {
    console.error("❌ Database Initialization Failed:", dbError);
  }
});