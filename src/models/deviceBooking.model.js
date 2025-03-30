const mongoose = require('mongoose');
const BaseSchema = require('./base.model');
const { STATUS_BOOKING } = require('../config/contants');

const DeviceBookingSchema = new BaseSchema({
    device: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    codeBA: {
        type: String,
        required: true,
        description: 'Mã bệnh án',
    },
    nameBA: {
        type: String,
        required: true,
        description: 'Tên bệnh án',
    },
    usageTime: {
        type: String,
        required: true,
        description: 'Thời gian đăng ký sử dụng',
    },
    usageDay: {
        type: Date,
        required: true,
        description: 'Ngày đăng ký sử dụng',
    },
    priority: {
        type: String,
        required: true,
        description: 'Mức độ ưu tiên',
    },
    purpose: {
        type: String,
        required: true,
        description: 'Mục đích sử dụng',
    },
    status: {
        type: String,
        enum: Object.values(STATUS_BOOKING),
        default: STATUS_BOOKING.PENDING,
        description: 'Trạng thái đăng ký',
    },
    note: {
        type: String,
        description: 'Ghi chú',
    },
});

// Tạo model từ schema
const DeviceBooking = mongoose.model('DeviceBooking', DeviceBookingSchema);

module.exports = DeviceBooking;
