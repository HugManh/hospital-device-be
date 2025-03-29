const mongoose = require('mongoose');
const { Schema } = mongoose;

class BaseSchema extends Schema {
    constructor(definition, options) {
        super(definition, { timestamps: true, ...options });

        // Middleware cập nhật `updatedAt` trước khi lưu
        this.pre('save', function (next) {
            this.updatedAt = new Date();
            next();
        });
    }
}

module.exports = BaseSchema;
