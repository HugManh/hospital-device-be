const express = require('express');
const router = express.Router();

const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const deviceRoute = require('./device.route');
const deviceBookingRoute = require('./deviceBooking.route');

router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/devices', deviceRoute);
router.use('/device-booking', deviceBookingRoute);

module.exports = router;
