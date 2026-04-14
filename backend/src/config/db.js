const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Initializes the MongoDB connection via Mongoose
 */
const initDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Modern Mongoose defaults are usually sufficient, 
      // but specific options can be added here if needed.
    });
    
    console.log(`Successfully connected to MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    console.log('Server running without DB connection. Reconnect manually later.');
    // Removed process.exit(1) to avoid server crash
  }
};

module.exports = {
  initDb,
  mongoose
};
