const mongoose = require('mongoose');
const BaseSchema = require('./base.model');
const bcrypt = require('bcrypt');
const { hashPassword } = require('../utils/crypto');
const { ROLES } = require('../config/constants');

const UserSchema = new BaseSchema({
    email: { type: String, required: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.USER,
    },
    group: { type: String, required: true, default: 'Thiếu thông tin' },
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String },
});

// Middleware: Hash mật khẩu trước khi lưu vào database
UserSchema.pre('save', async function (next) {
    const user = this;

    // Chỉ hash mật khẩu nếu nó được sửa đổi hoặc mới tạo
    if (!user.isModified('password')) return next();

    try {
        // Hash mật khẩu
        const hashedPassword = await hashPassword(user.password);
        user.password = hashedPassword;
        next();
    } catch (err) {
        next(err);
    }
});

// Phương thức so sánh mật khẩu
UserSchema.methods.comparePassword = async function (plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
};

UserSchema.statics.getAll = function () {
    return this.find()
        .select('-password -refreshToken')
        .sort({ createdAt: -1 });
};

// Tạo model từ schema
const User = mongoose.model('User', UserSchema);

module.exports = User;
