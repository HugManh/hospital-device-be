const express = require('express');
const router = express.Router();

const { authenticate } = require('../../middleware/auth.middleware');

const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const deviceRoute = require('./device.route');
const deviceBookingRoute = require('./deviceBooking.route');
const auditRoute = require('./audit.route');

router.use('/auth', authRoute);

router.use(authenticate);
router.use('/users', userRoute);
router.use('/devices', deviceRoute);
router.use('/device-bookings', deviceBookingRoute);
router.use('/audits', auditRoute);
module.exports = router;
