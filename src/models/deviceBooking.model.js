const mongoose = require('mongoose');
const BaseSchema = require('./base.model');

const DeviceSchema = new BaseSchema({
    usageTime: { type: Date, required: true, unique: true },
    usageDay: { type: Date, required: true },
    status: { type: String, required: true },
    priority: { type: Number, required: true },
    department: { type: String, required: true },
});

// Tạo model từ schema
const Device = mongoose.model('Device', DeviceSchema);

module.exports = Device;
