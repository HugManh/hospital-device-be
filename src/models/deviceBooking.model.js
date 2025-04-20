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
        label: 'Mã bệnh án',
        description: 'Mã bệnh án',
    },
    nameBA: {
        type: String,
        required: true,
        label: 'Tên bệnh án',
        description: 'Tên bệnh án',
    },
    usageTime: {
        type: String,
        required: true,
        label: 'Thời gian đăng ký',
        description: 'Thời gian đăng ký',
    },
    usageDay: {
        type: Date,
        required: true,
        label: 'Ngày đăng ký',
        description: 'Ngày đăng ký',
    },
    priority: {
        type: String,
        required: true,
        label: 'Độ ưu tiên',
        description: 'Độ ưu tiên',
    },
    purpose: {
        type: String,
        label: 'Mục đích',
        description: 'Mục đích',
    },
    status: {
        type: String,
        required: true,
        label: 'Trạng thái',
        description: 'Trạng thái',
    },
    note: {
        type: String,
        label: 'Ghi chú',
        description: 'Ghi chú',
    },
    editRequest: {
        status: {
            type: String,
            enum: Object.values(EDIT_REQUEST_STATUS),
            label: 'Trạng thái yêu cầu chỉnh sửa',
            description: 'Trạng thái yêu cầu chỉnh sửa',
        },
        reason: {
            type: String,
            label: 'Lý do chỉnh sửa',
            description: 'Lý do chỉnh sửa',
        },
        requestedAt: {
            type: Date,
            label: 'Thời gian yêu cầu chỉnh sửa',
            description: 'Thời gian yêu cầu chỉnh sửa',
        },
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            label: 'Người xử lý yêu cầu chỉnh sửa',
            description: 'Người xử lý yêu cầu chỉnh sửa',
        },
        processedAt: {
            type: Date,
            label: 'Thời gian xử lý yêu cầu chỉnh sửa',
            description: 'Thời gian xử lý yêu cầu chỉnh sửa',
        },
        approverNote: {
            type: String,
            label: 'Ghi chú của người duyệt',
            description: 'Ghi chú của người duyệt',
        },
    },
});

// DeviceBookingSchema.set('toJSON', {
//     virtuals: true,
//     transform: (doc, ret) => {
//         ret.id = ret._id;
//         delete ret._id;
//         delete ret.__v;

//         if (ret.deviceId) {
//             ret.device = {
//                 ...ret.deviceId,
//                 id: ret.deviceId.id,
//             };
//             delete ret.deviceId;
//         }
//         if (ret.userId) {
//             ret.user = {
//                 ...ret.userId,
//                 id: ret.userId.id,
//             };
//             delete ret.userId;
//         }
//         return ret;
//     },
// });

// Tạo model từ schema
const DeviceBooking = mongoose.model('DeviceBooking', DeviceBookingSchema);

module.exports = DeviceBooking;
