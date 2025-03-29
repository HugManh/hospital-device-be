const mongoose = require('mongoose');
const BaseSchema = require('./base.model');

const DeviceSchema = new BaseSchema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
});

// Tạo model từ schema
const Device = mongoose.model('Device', DeviceSchema);

module.exports = Device;
