const mongoose = require('mongoose');
const BaseSchema = require('./base.model');

// Actor metadata có thể rõ ràng hơn nếu định nghĩa riêng
const ActorMetadataSchema = new mongoose.Schema(
    {
        role: String,
    },
    { _id: false }
);

const AuditTrailSchema = new BaseSchema({
    action: { type: String, required: true },
    actor: {
        id: { type: String, required: true },
        metadata: { type: ActorMetadataSchema, required: true },
    },
    context: {
        method: { type: String, required: true },
        endpoint: { type: String, required: true },
        location: { type: String },
        userAgent: { type: String },
    },
    status: { type: Number, min: 100, max: 599 },
    occurredAt: { type: Date, default: Date.now },
});

AuditTrailSchema.index({ 'actor.id': 1 });
AuditTrailSchema.index({ action: 1, occurredAt: -1 });
AuditTrailSchema.index({ 'context.endpoint': 1 });

const AuditTrail = mongoose.model('AuditTrail', AuditTrailSchema);

module.exports = AuditTrail;
