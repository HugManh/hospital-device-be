const { Schema } = require('mongoose');

const BaseSchema = new Schema({
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Middleware cập nhật `updated_at` mỗi khi lưu (save)
BaseSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});

module.exports = BaseSchema;
