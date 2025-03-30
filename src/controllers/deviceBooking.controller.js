const Device = require('../models/device.model');
const User = require('../models/user.model');
const DeviceBooking = require('../models/deviceBooking.model');
const Response = require('../utils/response');

const isDevelopment = process.env.NODE_ENV === 'development';

// Tạo yêu cầu đăng ký thiết bị
const createDeviceBooking = async (req, res) => {
    try {
        const {
            deviceID,
            codeBA,
            nameBA,
            usageTime,
            usageDay,
            priority,
            purpose,
        } = req.body;

        const userID = req.user.id;

        // Kiểm tra user tồn tại
        const user = await User.findById(userID);
        if (!user) {
            return Response.notFound(res, 'User not found');
        }

        // Kiểm tra thiết bị tồn tại
        const device = await Device.findById(deviceID);
        if (!device) {
            return Response.notFound(res, 'Device not found');
        }

        // Tạo đăng ký mới
        const booking = new DeviceBooking({
            device: deviceID,
            user: userID,
            group: user.group,
            codeBA,
            nameBA,
            usageTime,
            usageDay,
            priority,
            purpose,
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
            .populate('device', 'name location')
            .populate('user', 'name email group')
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

// Duyệt yêu cầu đăng ký thiết bị
const approveUsage = async (req, res) => {
    try {
        const { bookingID } = req.params;
        const { status } = req.body;

        const booking = await DeviceBooking.findById(bookingID);
        if (!booking) {
            return Response.notFound(res, 'Booking not found ');
        }

        booking.status = status;
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
        const { deviceID } = req.params;

        const device = await Device.findById(deviceID);
        if (!device) {
            return Response.notFound(res, 'Device not found');
        }

        // Lấy lịch sử đăng ký của thiết bị
        const bookings = await DeviceBooking.find({ device: deviceID })
            .populate('user', 'name email group')
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
        const { userID } = req.params;
        const bookings = await DeviceBooking.find({ user: userID })
            .populate('device', 'name location')
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
    approveUsage,
    approveEdit,
    getDeviceInfo,
    getUserBookings,
};
