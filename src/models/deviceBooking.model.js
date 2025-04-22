const mongoose = require('mongoose');
const BaseSchema = require('./base.model');
const { EDIT_REQUEST_STATUS } = require('../config/constants');

const DeviceBookingSchema = new BaseSchema({
    deviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device',
        required: true,
    },
    deviceName: {
        type: String,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    accountName: {
        type: String,
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
        description: 'Thời gian đăng ký',
    },
    usageDay: {
        type: Date,
        required: true,
        description: 'Ngày đăng ký',
    },
    priority: {
        type: String,
        required: true,
        description: 'Độ ưu tiên',
    },
    purpose: {
        type: String,
        description: 'Mục đích',
    },
    status: {
        type: String,
        required: true,
        description: 'Trạng thái',
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
        // processedBy: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: 'User',
        //     description: 'Người xử lý yêu cầu chỉnh sửa',
        // },
        requesterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        requesterName: {
            type: String,
            description: 'Người yêu cầu chỉnh sửa',
        },
        approverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        approverName: {
            type: String,
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
