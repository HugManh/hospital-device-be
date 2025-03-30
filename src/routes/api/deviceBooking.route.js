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
// Đăng ký thiết bị cho người dùng
router.post(
    '/:deviceID/users/:userID',
    authorizeRoles([ROLES.ADMIN, ROLES.USER]),
    createDeviceBooking
);
// Danh sách tất cả các đăng ký thiết bị
router.get('/', authorizeRoles([ROLES.APPROVER, ROLES.ADMIN]), getAllBookings);
// Duyệt đăng ký thiết bị
router.post(
    '/:deviceID/users/:userID/accept-usage',
    authorizeRoles([ROLES.APPROVER, ROLES.ADMIN]),
    approveUsage
);
// Duyệt đăng ký thiết bị
router.post(
    '/:deviceID/users/:userID/accept-edit',
    authorizeRoles([ROLES.APPROVER, ROLES.ADMIN]),
    approveEdit
);
// Thông tin chi tiết của 1 thiết bị
router.get(
    '/devices/:deviceID',
    authorizeRoles([ROLES.USER, ROLES.ADMIN]),
    getDeviceInfo
);
// Lịch sử đăng ký thiết bị của người dùng
router.get(
    '/users/:userID',
    authorizeRoles([ROLES.ADMIN, ROLES.USER]),
    getUserBookings
);

module.exports = router;
