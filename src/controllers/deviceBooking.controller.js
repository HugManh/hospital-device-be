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
            return Response.notFound(res, 'User not found');
        }

        // Kiểm tra thiết bị tồn tại
        const device = await Device.findById(deviceId);
        if (!device) {
            return Response.notFound(res, 'Device not found');
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
                'This time slot is already booked for this device',
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

        return Response.success(
            res,
            { booking },
            'Device booking created successfully',
            201
        );
    } catch (error) {
        return Response.error(
            res,
            'Unexpected error occurred',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Lấy danh sách đơn đăng ký thiết bị
const getAllBookings = async (req, res) => {
    try {
        const bookings = await DeviceBooking.find()
            .populate('deviceId', 'name location')
            .populate('userId', 'name email group')
            .sort({ createdAt: -1 });
        return Response.success(
            res,
            bookings,
            'Bookings retrieved successfully'
        );
    } catch (error) {
        return Response.error(
            res,
            'Unexpected error occurred',
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
            return Response.notFound(res, 'Booking not found');
        }
        return Response.success(res, booking, 'Booking retrieved successfully');
    } catch (error) {
        return Response.error(
            res,
            'Unexpected error occurred',
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
        if (!user) return Response.notFound(res, 'User not found');

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
        if (!booking) return Response.notFound(res, 'Booking not found');
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

        return Response.success(
            res,
            { booking },
            'Booking processed successfully'
        );
    } catch (error) {
        return Response.error(
            res,
            'Unexpected error occurred',
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
            return Response.notFound(res, 'Device not found');
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
            'Device information retrieved successfully'
        );
    } catch (error) {
        return Response.error(
            res,
            'Unexpected error occurred',
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
            'User bookings retrieved successfully'
        );
    } catch (error) {
        return Response.error(
            res,
            'Unexpected error occurred',
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
            return Response.notFound(res, 'Booking not found');
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

        return Response.success(
            res,
            { editRequest: booking.editRequest },
            'Edit request submitted successfully'
        );
    } catch (error) {
        return Response.error(
            res,
            'Unexpected error occurred',
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

        console.log('processEditRequest', bookingId, action, approverNote);

        const booking = await DeviceBooking.findById(bookingId);
        if (!booking) {
            return Response.notFound(res, 'Booking not found');
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

        return Response.success(
            res,
            { editRequest: booking.editRequest },
            'Edit request processed successfully'
        );
    } catch (error) {
        return Response.error(
            res,
            'Unexpected error occurred',
            500,
            isDevelopment ? error.message : null
        );
    }
};

module.exports = {
    createDeviceBooking,
    getAllBookings,
    getDeviceBookingById,
    updateBooking,
    getDeviceInfo,
    getUserBookings,
    requestBookingEdit,
    processEditRequest,
};
