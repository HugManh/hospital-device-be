const mongoose = require('mongoose');
const BaseSchema = require('./base.model');
const { Schema } = mongoose;

// Tạo schema cho User và kế thừa từ BaseSchema
const UserSchema = new Schema({
    email: { type: String, required: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['user', 'approver', 'admin'],
        default: 'user',
    },
    refreshToken: { type: String },
});

// Áp dụng BaseSchema vào UserSchema
UserSchema.add(BaseSchema);

// Tạo model từ schema
const User = mongoose.model('User', UserSchema);

module.exports = User;
