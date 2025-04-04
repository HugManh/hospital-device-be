const mongoose = require('mongoose');
const BaseSchema = require('./base.model');
const { EDIT_REQUEST_STATUS } = require('../config/constants');

const DeviceBookingSchema = new BaseSchema({
    deviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device',
        required: true,
    },
    userId: {
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
        description: 'Mục đích sử dụng',
    },
    status: {
        type: String,
        required: true,
        description: 'Trạng thái đăng ký',
    },
    note: {
        type: String,
        description: 'Ghi chú',
    },
    editRequest: {
        status: {
            type: String,
            enum: Object.values(EDIT_REQUEST_STATUS),
            description: 'Trạng thái yêu cầu chỉnh sửa',
        },
        reason: {
            type: String,
            description: 'Lý do chỉnh sửa',
        },
        requestedAt: {
            type: Date,
            description: 'Thời gian yêu cầu chỉnh sửa',
        },
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            description: 'Người xử lý yêu cầu chỉnh sửa',
        },
        processedAt: {
            type: Date,
            description: 'Thời gian xử lý yêu cầu chỉnh sửa',
        },
        approverNote: {
            type: String,
            description: 'Ghi chú của người duyệt',
        },
    },
});

// Tạo model từ schema
const DeviceBooking = mongoose.model('DeviceBooking', DeviceBookingSchema);

module.exports = DeviceBooking;
