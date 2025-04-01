const express = require('express');
const router = express.Router();
const {
    createDeviceBooking,
    getAllBookings,
    getDeviceBookingById,
    approveUsage,
    approveEdit,
    getDeviceInfo,
    getUserBookings,
} = require('../../controllers/deviceBooking.controller');
const {
    authenticate,
    authorizeRoles,
} = require('../../middleware/auth.middleware');
const { ROLES } = require('../../config/constants');

router.use(authenticate);
router.post(
    '/',
    authorizeRoles([ROLES.ADMIN, ROLES.USER]),
    createDeviceBooking
);
router.get(
    '/',
    authorizeRoles([ROLES.USER, ROLES.APPROVER, ROLES.ADMIN]),
    getAllBookings
);
router.get(
    '/:bookingID',
    authorizeRoles([ROLES.USER, ROLES.APPROVER, ROLES.ADMIN]),
    getDeviceBookingById
);
router.put(
    '/:bookingID',
    authorizeRoles([ROLES.APPROVER, ROLES.ADMIN]),
    approveUsage
);

router.post(
    '/:bookingID/accept-edit',
    authorizeRoles([ROLES.APPROVER, ROLES.ADMIN]),
    approveEdit
);
router.get(
    '/devices/:deviceId',
    authorizeRoles([ROLES.USER, ROLES.APPROVER, ROLES.ADMIN]),
    getDeviceInfo
);
router.get(
    '/users/:userId',
    authorizeRoles([ROLES.USER, ROLES.APPROVER, ROLES.ADMIN]),
    getUserBookings
);

module.exports = router;
