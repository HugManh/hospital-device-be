const express = require('express');
const router = express.Router();
const {
    createDeviceBooking,
    getDeviceBookings,
    getDeviceBookingById,
    updateBooking,
    listDeviceBookings,
    listUserBookings,
    requestBookingEdit,
    processEditRequest,
} = require('../../controllers/deviceBooking.controller');
const { authorizeRoles } = require('../../middleware/auth.middleware');
const { ROLES } = require('../../config/constants');

router.post(
    '/',
    authorizeRoles([ROLES.ADMIN, ROLES.USER]),
    createDeviceBooking
);
router.get(
    '/',
    authorizeRoles([ROLES.USER, ROLES.APPROVER, ROLES.ADMIN]),
    getDeviceBookings
);
router.get(
    '/:bookingID',
    authorizeRoles([ROLES.USER, ROLES.APPROVER, ROLES.ADMIN]),
    getDeviceBookingById
);
router.put(
    '/:bookingID',
    authorizeRoles([ROLES.USER, ROLES.APPROVER, ROLES.ADMIN]),
    updateBooking
);
router.get(
    '/devices/:deviceId',
    authorizeRoles([ROLES.USER, ROLES.APPROVER, ROLES.ADMIN]),
    listDeviceBookings
);
router.get(
    '/users/:userId',
    authorizeRoles([ROLES.USER, ROLES.APPROVER, ROLES.ADMIN]),
    listUserBookings
);
router.post(
    '/:bookingId/edit-request',
    authorizeRoles([ROLES.USER]),
    requestBookingEdit
);
router.put(
    '/:bookingId/edit-request',
    authorizeRoles([ROLES.APPROVER, ROLES.ADMIN]),
    processEditRequest
);

module.exports = router;
