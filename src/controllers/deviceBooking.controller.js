const Device = require('../models/device.model');
const User = require('../models/user.model');
const DeviceBooking = require('../models/deviceBooking.model');
const { STATUS_BOOKING } = require('../config/contants');
const Response = require('../utils/response');

const isDevelopment = process.env.NODE_ENV === 'development';

// Tạo đăng ký thiết bị mới
const createDeviceBooking = async (req, res) => {
    try {
        const { deviceID, userID } = req.params;
        const { usageTime, usageDay, purpose } = req.body;

        // Kiểm tra thiết bị tồn tại
        const device = await Device.findById(deviceID);
        if (!device) {
            return Response.notFound(res, 'Device not found');
        }

        // Kiểm tra user tồn tại
        const user = await User.findById(userID);
        if (!user) {
            return Response.notFound(res, 'User not found');
        }

        // Tạo đăng ký mới
        const booking = new DeviceBooking({
            device: deviceID,
            user: userID,
            usageTime,
            usageDay,
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

// Lấy danh sách tất cả đăng ký thiết bị
const getAllBookings = async (req, res) => {
    try {
        const bookings = await DeviceBooking.find()
            .populate('device', 'name location')
            .populate('user', 'name email')
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

// Duyệt đăng ký sử dụng thiết bị
const approveUsage = async (req, res) => {
    try {
        const { deviceID, userID } = req.params;
        const { status, note } = req.body;

        const booking = await DeviceBooking.findOne({
            device: deviceID,
            user: userID,
            status: STATUS_BOOKING.PENDING,
        });

        if (!booking) {
            return Response.notFound(
                res,
                'Booking not found or already processed'
            );
        }

        booking.status = status;
        booking.note = note;
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

// Duyệt chỉnh sửa đăng ký thiết bị
const approveEdit = async (req, res) => {
    try {
        const { deviceID, userID } = req.params;
        const { usageTime, usageDay, purpose, status, note } = req.body;

        const booking = await DeviceBooking.findOne({
            device: deviceID,
            user: userID,
            status: 'pending',
        });

        if (!booking) {
            return Response.notFound(
                res,
                'Booking not found or already processed'
            );
        }

        booking.usageTime = usageTime;
        booking.usageDay = usageDay;
        booking.purpose = purpose;
        booking.status = status;
        booking.note = note;
        await booking.save();

        return Response.success(
            res,
            { booking },
            'Booking edit processed successfully'
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

// Lấy thông tin chi tiết của thiết bị
const getDeviceInfo = async (req, res) => {
    try {
        const { deviceID } = req.params;
        const device = await Device.findById(deviceID);

        if (!device) {
            return Response.notFound(res, 'Device not found');
        }

        // Lấy lịch sử đăng ký của thiết bị
        const bookings = await DeviceBooking.find({ device: deviceID })
            .populate('user', 'name email')
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

// Lấy lịch sử đăng ký thiết bị của người dùng
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
