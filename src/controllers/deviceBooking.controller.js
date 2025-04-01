const Device = require('../models/device.model');
const User = require('../models/user.model');
const DeviceBooking = require('../models/deviceBooking.model');
const Response = require('../utils/response');
const {
    REGISTER_STATUS,
    PRIORITY_STATUS,
    isDevelopment,
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
const approveUsage = async (req, res) => {
    try {
        const { bookingID } = req.params;
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

        Object.assign(booking, {
            deviceId,
            codeBA,
            nameBA,
            usageTime,
            usageDay,
            priority,
            status,
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

// Duyệt đề xuất chỉnh sửa đơn đăng ký
const approveEdit = async (req, res) => {
    try {
        const { bookingID } = req.params;

        const booking = await DeviceBooking.findById(bookingID);
        if (!booking) {
            return Response.notFound(res, 'Booking not found ');
        }

        return Response.success(res, 'Booking edit processed successfully');
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

module.exports = {
    createDeviceBooking,
    getAllBookings,
    getDeviceBookingById,
    approveUsage,
    approveEdit,
    getDeviceInfo,
    getUserBookings,
};
