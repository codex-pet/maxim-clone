const express = require('express');
const router = express.Router();

// Import individual route files here
// const authRoutes = require('./authRoutes');
// const rideRoutes = require('./rideRoutes');
// const driverRoutes = require('./driverRoutes');

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Mount routes
// router.use('/auth', authRoutes);
// router.use('/rides', rideRoutes);
// router.use('/drivers', driverRoutes);

module.exports = router;
