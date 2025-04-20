const mongoose = require('mongoose');
const BaseSchema = require('./base.model');
const bcrypt = require('bcrypt');
const { hashPassword } = require('../utils/crypto');
const { ROLES } = require('../config/constants');

const UserSchema = new BaseSchema({
    email: { type: String, required: true, label: 'Tài khoản' },
    name: { type: String, required: true, label: 'Tên người dùng' },
    password: { type: String, required: true, label: 'Mật khẩu' },
    role: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.USER,
        label: 'Vai trò',
    },
    group: {
        type: String,
        required: true,
        default: 'Thiếu thông tin',
        label: 'Đơn vị',
    },
    isActive: { type: Boolean, default: true, label: 'Trạng thái' },
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

// Tạo model từ schema
const User = mongoose.model('User', UserSchema);

module.exports = User;
