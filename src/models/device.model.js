const mongoose = require('mongoose');
const BaseSchema = require('./base.model');

const DeviceSchema = new BaseSchema({
    name: { type: String, required: true },
    location: { type: String, required: true },
});

// Tạo model từ schema
const Device = mongoose.model('Device', DeviceSchema);

module.exports = Device;
