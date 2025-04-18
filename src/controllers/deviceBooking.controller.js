const Device = require('../models/device.model');
const User = require('../models/user.model');
const DeviceBooking = require('../models/deviceBooking.model');
const Response = require('../utils/response');
const {
    REGISTER_STATUS,
    PRIORITY_STATUS,
    isDevelopment,
    EDIT_REQUEST_STATUS,
    ROLES,
} = require('../config/constants');
const audit = require('../services/audit.service');
const auditAction = require('../services/auditAction');
const QueryBuilder = require('../utils/queryBuilder');

// Tạo yêu cầu đăng ký thiết bị
const createDeviceBooking = async (req, res) => {
    try {
        const {
            deviceId,
            codeBA,
            nameBA,
            usageTime,
            usageDay,
            status,
            priority,
            purpose,
        } = req.body;

        const userId = req.user.sub;

        // Kiểm tra user tồn tại
        const user = await User.findById(userId);
        if (!user) {
            return Response.notFound(res, 'Không tìm thấy người dùng');
        }

        // Kiểm tra thiết bị tồn tại
        const device = await Device.findById(deviceId);
        if (!device) {
            return Response.notFound(res, 'Không tìm thấy thiết bị');
        }

        // Kiểm tra xem có đăng ký nào trùng thời gian không
        const existingBooking = await DeviceBooking.findOne({
            deviceId,
            usageDay,
            usageTime,
            status: { $ne: REGISTER_STATUS.REJECT },
        });

        // Nếu có đăng ký trùng thời gian và không phải là ưu tiên
        if (existingBooking && priority !== PRIORITY_STATUS.PRIORITY) {
            return Response.error(
                res,
                'Khung giờ này đã được đăng ký cho thiết bị này',
                400
            );
        }

        // Tạo đăng ký mới
        const booking = new DeviceBooking({
            deviceId,
            userId,
            group: user.group,
            codeBA,
            nameBA,
            usageTime,
            usageDay,
            priority,
            purpose,
            status,
        });

        await booking.save();

        audit.prepareAudit(
            req,
            auditAction.actionList.CREATE_DEVICE_BOOKING,
            'success',
            'Tạo đơn đăng ký thiết bị thành công'
        );

        return Response.success(
            res,
            { booking },
            'Tạo đơn đăng ký thiết bị thành công',
            201
        );
    } catch (error) {
        return Response.error(
            res,
            'Đã xảy ra lỗi không xác định',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Lấy danh sách đơn đăng ký thiết bị
const getDeviceBookings = async (req, res) => {
    try {
        const bookings = await new QueryBuilder(DeviceBooking, req.query)
            .filter()
            .sort()
            .populate([
                { path: 'deviceId', select: 'name location' },
                { path: 'userId', select: 'name email group' },
            ])
            .paginate()
            .exec();

        return Response.success(
            res,
            bookings.data,
            bookings.meta,
            'Lấy danh sách đơn đăng ký thành công'
        );
    } catch (error) {
        return Response.error(
            res,
            'Đã xảy ra lỗi không xác định',
            500,
            isDevelopment ? error.message : null
        );
    }
};

const getDeviceBookingById = async (req, res) => {
    try {
        const { bookingID } = req.params;
        const booking = await DeviceBooking.findById(bookingID);
        if (!booking) {
            return Response.notFound(res, 'Không tìm thấy đơn đăng ký');
        }
        return Response.success(
            res,
            booking,
            'Lấy thông tin đơn đăng ký thành công'
        );
    } catch (error) {
        return Response.error(
            res,
            'Đã xảy ra lỗi không xác định',
            500,
            isDevelopment ? error.message : null
        );
    }
};
// Duyệt yêu cầu đăng ký thiết bị
const updateBooking = async (req, res) => {
    try {
        const { bookingID } = req.params;
        const userId = req.user.sub;

        const user = await User.findById(userId).select(
            '-password -refreshToken'
        );
        if (!user) return Response.notFound(res, 'Không tìm thấy người dùng');

        const {
            deviceId,
            codeBA,
            nameBA,
            usageTime,
            usageDay,
            priority,
            status,
        } = req.body;

        const booking = await DeviceBooking.findById(bookingID);
        if (!booking)
            return Response.notFound(res, 'Không tìm thấy đơn đăng ký');
        if (user.role === ROLES.USER) {
            booking.editRequest = null;
        }

        Object.assign(booking, {
            deviceId,
            codeBA,
            nameBA,
            usageTime,
            usageDay,
            priority,
            status: status || REGISTER_STATUS.PENDING,
        });

        // Lưu các thay đổi vào database
        await booking.save();

        audit.prepareAudit(
            req,
            auditAction.actionList.UPDATE_DEVICE_BOOKING,
            'success',
            'Đã xử lý đơn đăng ký'
        );

        return Response.success(res, { booking }, 'Đã xử lý đơn đăng ký');
    } catch (error) {
        return Response.error(
            res,
            'Đã xảy ra lỗi không xác định',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Danh sách các đơn đăng ký của thiết bị
const getDeviceInfo = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { usageDay } = req.query;

        const device = await Device.findById(deviceId);
        if (!device) {
            return Response.notFound(res, 'Không tìm thấy thiết bị');
        }

        const filter = { deviceId };

        if (usageDay) {
            const date = new Date(usageDay);
            filter.usageDay = {
                $gte: new Date(date.setHours(0, 0, 0, 0)), // Bắt đầu ngày
                $lt: new Date(date.setHours(23, 59, 59, 999)), // Kết thúc ngày
            };
        }

        // Lấy lịch sử đăng ký của thiết bị
        const bookings = await DeviceBooking.find(filter)
            .populate('deviceId', 'name location')
            .populate('userId', 'name email group')
            .sort({ createdAt: -1 });

        return Response.success(
            res,
            { device, bookings },
            'Lấy danh sách đơn của thiết bị thành công'
        );
    } catch (error) {
        return Response.error(
            res,
            'Đã xảy ra lỗi không xác định',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Lịch sử đăng ký thiết bị của người dùng
const getUserBookings = async (req, res) => {
    try {
        const { userId } = req.params;
        const bookings = await DeviceBooking.find({ userId })
            .populate('deviceId', 'name location')
            .populate('userId', 'name email group')
            .sort({ createdAt: -1 });

        return Response.success(
            res,
            bookings,
            'Lấy lịch sử đăng ký của người dùng thành công'
        );
    } catch (error) {
        return Response.error(
            res,
            'Đã xảy ra lỗi không xác định',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Xử lý yêu cầu chỉnh sửa đơn đăng ký
const requestBookingEdit = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { reason } = req.body;
        const userId = req.user.sub;

        const booking = await DeviceBooking.findById(bookingId);
        if (!booking) {
            return Response.notFound(res, 'Không tìm thấy đơn đăng ký');
        }

        // Kiểm tra xem người dùng có phải là người tạo đơn không
        if (booking.userId.toString() !== userId) {
            return Response.error(
                res,
                'Unauthorized to edit this booking',
                403
            );
        }
        // Kiểm tra xem đơn có đang chờ duyệt không
        if (booking.status !== REGISTER_STATUS.PENDING) {
            return Response.error(
                res,
                'Cannot edit booking that is not pending approval',
                400
            );
        }

        // Cập nhật thông tin chỉnh sửa
        booking.editRequest = {
            requestedBy: userId,
            status: EDIT_REQUEST_STATUS.PENDING,
            requestedAt: new Date(),
            reason: reason,
        };
        await booking.save();

        audit.prepareAudit(
            req,
            auditAction.actionList.REQUEST_BOOKING_EDIT,
            'success',
            'Edit request submitted successfully'
        );

        return Response.success(
            res,
            { editRequest: booking.editRequest },
            'Edit request submitted successfully'
        );
    } catch (error) {
        return Response.error(
            res,
            'Đã xảy ra lỗi không xác định',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Xử lý duyệt yêu cầu chỉnh sửa từ approver hoặc admin
const processEditRequest = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { action, approverNote } = req.body;
        const approverId = req.user.sub;

        const booking = await DeviceBooking.findById(bookingId);
        if (!booking) {
            return Response.notFound(res, 'Không tìm thấy đơn đăng ký');
        }

        if (!booking.editRequest) {
            return Response.error(
                res,
                'No edit request found for this booking'
            );
        }

        if (action === 'accept') {
            booking.editRequest.status = EDIT_REQUEST_STATUS.ACCEPTED;
            booking.editRequest.processedBy = approverId;
            booking.editRequest.processedAt = new Date();
            booking.editRequest.approverNote = approverNote;
        } else if (action === 'reject') {
            booking.editRequest.status = EDIT_REQUEST_STATUS.REJECTED;
            booking.editRequest.processedBy = approverId;
            booking.editRequest.processedAt = new Date();
            booking.editRequest.approverNote = approverNote;
        }

        await booking.save();

        audit.prepareAudit(
            req,
            auditAction.actionList.PROCESS_EDIT_REQUEST,
            'success',
            'Edit request processed successfully'
        );

        return Response.success(
            res,
            { editRequest: booking.editRequest },
            'Edit request processed successfully'
        );
    } catch (error) {
        return Response.error(
            res,
            'Đã xảy ra lỗi không xác định',
            500,
            isDevelopment ? error.message : null
        );
    }
};

module.exports = {
    createDeviceBooking,
    getDeviceBookings,
    getDeviceBookingById,
    updateBooking,
    getDeviceInfo,
    getUserBookings,
    requestBookingEdit,
    processEditRequest,
};
