const Device = require('../models/device.model');
const User = require('../models/user.model');
const DeviceBooking = require('../models/deviceBooking.model');
const { STATUS_BOOKING } = require('../config/contants');

const isDevelopment = process.env.NODE_ENV === 'development';

// Helper để xử lý lỗi với thông báo chuyên nghiệp hơn
const handleError = (res, error) => {
    return res.status(500).json({
        message: 'Unexpected error occurred. Please try again later.',
        ...(isDevelopment && error ? { error: error.message } : {}),
    });
};

// Tạo đăng ký thiết bị mới
const createDeviceBooking = async (req, res) => {
    try {
        const { deviceID, userID } = req.params;
        const { usageTime, usageDay, purpose } = req.body;

        // Kiểm tra thiết bị tồn tại
        const device = await Device.findById(deviceID);
        if (!device) {
            return res.status(404).json({ message: 'Device not found' });
        }

        // Kiểm tra user tồn tại
        const user = await User.findById(userID);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
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

        res.status(201).json({
            message: 'Device booking created successfully',
            booking,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Lấy danh sách tất cả đăng ký thiết bị
const getAllBookings = async (req, res) => {
    try {
        const bookings = await DeviceBooking.find()
            .populate('device', 'name location')
            .populate('user', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json(bookings);
    } catch (error) {
        return handleError(res, error);
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
            return res.status(404).json({
                message: 'Booking not found or already processed',
            });
        }

        booking.status = status;
        booking.note = note;
        await booking.save();

        res.status(200).json({
            message: 'Booking processed successfully',
            booking,
        });
    } catch (error) {
        return handleError(res, error);
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
            return res.status(404).json({
                message: 'Booking not found or already processed',
            });
        }

        booking.usageTime = usageTime;
        booking.usageDay = usageDay;
        booking.purpose = purpose;
        booking.status = status;
        booking.note = note;
        await booking.save();

        res.status(200).json({
            message: 'Booking edit processed successfully',
            booking,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Lấy thông tin chi tiết của thiết bị
const getDeviceInfo = async (req, res) => {
    try {
        const { deviceID } = req.params;
        const device = await Device.findById(deviceID);

        if (!device) {
            return res.status(404).json({ message: 'Device not found' });
        }

        // Lấy lịch sử đăng ký của thiết bị
        const bookings = await DeviceBooking.find({ device: deviceID })
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            device,
            bookings,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Lấy lịch sử đăng ký thiết bị của người dùng
const getUserBookings = async (req, res) => {
    try {
        const { userID } = req.params;
        const bookings = await DeviceBooking.find({ user: userID })
            .populate('device', 'name location')
            .sort({ createdAt: -1 });

        res.status(200).json(bookings);
    } catch (error) {
        return handleError(res, error);
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
