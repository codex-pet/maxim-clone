require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { initDb } = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Main Routes
const routes = require('./routes');
app.use('/api', routes);

// Base Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Maxim-Clone Backend is running.' });
});

// Socket.io integration
io.on('connection', (socket) => {
  console.log(`User connected via socket: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  await initDb();
  console.log(`Server listening on port ${PORT}`);
});
