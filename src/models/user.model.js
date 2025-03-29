const mongoose = require('mongoose');
const BaseSchema = require('./base.model');

const UserSchema = new BaseSchema({
    email: { type: String, required: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['user', 'approver', 'admin'],
        default: 'user',
    },
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String },
});

UserSchema.statics.getAll = function () {
    return this.find().select('-password -refreshToken -__v');
};

// Tạo model từ schema
const User = mongoose.model('User', UserSchema);

module.exports = User;
