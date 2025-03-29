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
        
        this.set('toJSON', {
            virtuals: true,
            transform: (doc, ret) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        });

        this.set('toObject', {
            virtuals: true,
            transform: (doc, ret) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        });
    }
}

module.exports = BaseSchema;
