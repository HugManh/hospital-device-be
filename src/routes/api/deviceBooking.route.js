const express = require('express');
const router = express.Router();
const {
    createDeviceBooking,
    getAllBookings,
    approveUsage,
    approveEdit,
    getDeviceInfo,
    getUserBookings,
} = require('../../controllers/deviceBooking.controller');
const {
    authenticate,
    authorizeRoles,
} = require('../../middleware/auth.middleware');
const { ROLES } = require('../../config/contants');

router.use(authenticate);
router.post(
    '/',
    authorizeRoles([ROLES.ADMIN, ROLES.USER]),
    createDeviceBooking
);
router.get('/', authorizeRoles([ROLES.APPROVER, ROLES.ADMIN]), getAllBookings);
router.put(
    '/:bookingID/change-status',
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
