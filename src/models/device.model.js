const mongoose = require('mongoose');
const BaseSchema = require('./base.model');
const { Schema } = mongoose;

// Tạo schema cho Device và kế thừa từ BaseSchema
const DeviceSchema = new Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
});

// Áp dụng BaseSchema vào DeviceSchema
DeviceSchema.add(BaseSchema);

// Tạo model từ schema
const Device = mongoose.model('Device', DeviceSchema);

module.exports = Device;
