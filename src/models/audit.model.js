const mongoose = require('mongoose');
const BaseSchema = require('./base.model');

const AuditTrailSchema = new BaseSchema({
    action: { type: String, required: true },
    actor: {
        id: { type: String, required: true },
        role: { type: String, required: true },
    },
    context: {
        method: { type: String, required: true },
        endpoint: { type: String, required: true },
        location: { type: String },
        userAgent: { type: String },
    },
    status: { type: String, required: true },
    details: { type: String },
    occurredAt: { type: Date, default: Date.now },
});

AuditTrailSchema.index({ 'actor.id': 1 });
AuditTrailSchema.index({ action: 1, occurredAt: -1 });
AuditTrailSchema.index({ 'context.endpoint': 1 });

const AuditTrail = mongoose.model('AuditTrail', AuditTrailSchema);

module.exports = AuditTrail;
