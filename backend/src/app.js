require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const admin = require('firebase-admin');
const { initDb } = require('./config/db');

// --- INITIALIZE FIREBASE ADMIN ---
const serviceAccount = require('./config/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit to handle base64 images

// Routes
const routes = require('./routes');
const tripRoutes = require('./routes/tripRoutes');
const smsRoutes = require('./routes/smsRoutes');
app.use('/api', routes);
app.use('/api/trips', tripRoutes);
app.use('/api/sms', smsRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'Maxim-Clone Backend API is active.' });
});

// ==========================================
// 🚨 FIX: FORCE JSON FOR 404 AND 500 ERRORS 🚨
// ==========================================

// Catch-All 404 Handler (If a route doesn't exist)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.url}`
  });
});

// Global Error Handler (If the server crashes)
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message
  });
});

// ==========================================

// Socket logic
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on('disconnect', () => console.log('User disconnected'));
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', async () => {
  await initDb();
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});