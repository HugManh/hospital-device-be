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

/**
 * @swagger
 * /api/device-booking/{deviceID}/users/{userID}:
 *   post:
 *     summary: Đăng ký thiết bị cho người dùng
 *     tags: [Device Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của thiết bị
 *       - in: path
 *         name: userID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usageTime
 *               - usageDay
 *               - purpose
 *             properties:
 *               usageTime:
 *                 type: string
 *                 format: date-time
 *                 description: Thời gian đăng ký sử dụng
 *               usageDay:
 *                 type: string
 *                 format: date-time
 *                 description: Ngày đăng ký sử dụng
 *               purpose:
 *                 type: string
 *                 description: Mục đích sử dụng
 *     responses:
 *       201:
 *         description: Đăng ký thiết bị thành công
 *       404:
 *         description: Không tìm thấy thiết bị hoặc người dùng
 *       500:
 *         description: Lỗi server
 */
router.use(authenticate);

// Đăng ký thiết bị cho người dùng
router.post(
    '/:deviceID/users/:userID',
    authorizeRoles([ROLES.ADMIN, ROLES.USER]),
    createDeviceBooking
);

/**
 * @swagger
 * /api/device-booking:
 *   get:
 *     summary: Lấy danh sách tất cả đăng ký thiết bị
 *     tags: [Device Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách đăng ký thiết bị
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   device:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       location:
 *                         type: string
 *                   user:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                   startTime:
 *                     type: string
 *                     format: date-time
 *                   endTime:
 *                     type: string
 *                     format: date-time
 *                   purpose:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [pending, approved, rejected]
 *                   note:
 *                     type: string
 *       500:
 *         description: Lỗi server
 */
// Danh sách tất cả các đăng ký thiết bị
router.get('/', authorizeRoles([ROLES.APPROVER, ROLES.ADMIN]), getAllBookings);

/**
 * @swagger
 * /api/device-booking/{deviceID}/users/{userID}/accept-usage:
 *   post:
 *     summary: Duyệt đăng ký sử dụng thiết bị
 *     tags: [Device Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của thiết bị
 *       - in: path
 *         name: userID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 description: Trạng thái duyệt
 *               note:
 *                 type: string
 *                 description: Ghi chú
 *     responses:
 *       200:
 *         description: Duyệt đăng ký thành công
 *       404:
 *         description: Không tìm thấy đăng ký hoặc đã được xử lý
 *       500:
 *         description: Lỗi server
 */
// Duyệt đăng ký thiết bị
router.post(
    '/:deviceID/users/:userID/accept-usage',
    authorizeRoles([ROLES.APPROVER, ROLES.ADMIN]),
    approveUsage
);

/**
 * @swagger
 * /api/device-booking/{deviceID}/users/{userID}/accept-edit:
 *   post:
 *     summary: Duyệt chỉnh sửa đăng ký thiết bị
 *     tags: [Device Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của thiết bị
 *       - in: path
 *         name: userID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startTime
 *               - endTime
 *               - purpose
 *               - status
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: Thời gian bắt đầu sử dụng
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: Thời gian kết thúc sử dụng
 *               purpose:
 *                 type: string
 *                 description: Mục đích sử dụng
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 description: Trạng thái duyệt
 *               note:
 *                 type: string
 *                 description: Ghi chú
 *     responses:
 *       200:
 *         description: Duyệt chỉnh sửa thành công
 *       404:
 *         description: Không tìm thấy đăng ký hoặc đã được xử lý
 *       500:
 *         description: Lỗi server
 */
// Duyệt đăng ký thiết bị
router.post(
    '/:deviceID/users/:userID/accept-edit',
    authorizeRoles([ROLES.APPROVER, ROLES.ADMIN]),
    approveEdit
);

/**
 * @swagger
 * /api/device-booking/devices/{deviceID}:
 *   get:
 *     summary: Lấy thông tin chi tiết của thiết bị
 *     tags: [Device Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của thiết bị
 *     responses:
 *       200:
 *         description: Thông tin chi tiết thiết bị và lịch sử đăng ký
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 device:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     location:
 *                       type: string
 *                 registrations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                       endTime:
 *                         type: string
 *                         format: date-time
 *                       purpose:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, approved, rejected]
 *                       note:
 *                         type: string
 *       404:
 *         description: Không tìm thấy thiết bị
 *       500:
 *         description: Lỗi server
 */
// Thông tin chi tiết của 1 thiết bị
router.get(
    '/devices/:deviceID',
    authorizeRoles([ROLES.USER, ROLES.ADMIN]),
    getDeviceInfo
);

/**
 * @swagger
 * /api/device-booking/users/{userID}:
 *   get:
 *     summary: Lấy lịch sử đăng ký thiết bị của người dùng
 *     tags: [Device Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng
 *     responses:
 *       200:
 *         description: Danh sách đăng ký thiết bị của người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   device:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       location:
 *                         type: string
 *                   startTime:
 *                     type: string
 *                     format: date-time
 *                   endTime:
 *                     type: string
 *                     format: date-time
 *                   purpose:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [pending, approved, rejected]
 *                   note:
 *                     type: string
 *       500:
 *         description: Lỗi server
 */
// Lịch sử đăng ký thiết bị của người dùng
router.get(
    '/users/:userID',
    authorizeRoles([ROLES.ADMIN, ROLES.USER]),
    getUserBookings
);

module.exports = router;
