const mongoose = require('mongoose');
const BaseSchema = require('./base.model');

const DeviceSchema = new BaseSchema({
    name: {
        type: String,
        required: true,
        description: 'Tên thiết bị',
    },
    location: {
        type: String,
        required: true,
        description: 'Vị trí',
    },
    description: {
        type: String,
        description: 'Mô tả',
    },
    // specifications: {
    //     type: Map,
    //     of: String,
    //     description: 'Thông số kỹ thuật của thiết bị',
    // },
    // maintenanceSchedule: {
    //     type: Date,
    //     description: 'Lịch bảo trì định kỳ',
    // },
    // lastMaintenance: {
    //     type: Date,
    //     description: 'Lần bảo trì gần nhất',
    // },
    // isActive: {
    //     type: Boolean,
    //     default: true,
    //     description: 'Trạng thái hoạt động của thiết bị',
    // },
});

// Tạo model từ schema
const Device = mongoose.model('Device', DeviceSchema);

module.exports = Device;
