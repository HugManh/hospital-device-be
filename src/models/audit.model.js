const mongoose = require('mongoose');
const BaseSchema = require('./base.model');

const AuditTrailSchema = new BaseSchema({
    action: { type: String, required: true },
    actor: {
        id: { type: String, required: true },
        role: { type: String, required: true },
        name: { type: String, required: true },
    },
    context: {
        method: { type: String, required: true },
        endpoint: { type: String, required: true },
        location: { type: String },
        userAgent: { type: String },
    },
    message: { type: String },
    detail: { type: Object },
    occurredAt: {
        type: Date,
        required: true,
        default: () => {
            const now = new Date();
            now.setUTCHours(0, 0, 0, 0); // Chỉ lấy ngày, không có giờ
            return now;
        },
    },
});

AuditTrailSchema.index({ 'actor.id': 1 });
AuditTrailSchema.index({ action: 1, createdAt: -1 });
AuditTrailSchema.index({ 'context.endpoint': 1 });

const AuditTrail = mongoose.model('AuditTrail', AuditTrailSchema);

module.exports = AuditTrail;
