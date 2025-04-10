const events = require('events');
const AuditTrail = require('../models/audit.model'); // Model Mongoose
const emitter = new events.EventEmitter();

const auditEvent = 'audit';

// Lắng nghe và ghi log
emitter.on(auditEvent, async function (auditData) {
    console.log('Audit Event Emitter - Audit:', auditData);
    try {
        const auditDoc = new AuditTrail({
            action: auditData.auditAction,
            actor: {
                id: auditData.auditBy.id,
                metadata: auditData.auditBy.metadata,
            },
            context: auditData.context || {},
            status: auditData.status,
            occurredAt: auditData.auditOn || new Date(),
        });
        await auditDoc.save();
    } catch (error) {
        console.error('Audit Event Emitter - Error:', error);
    }
});

exports.prepareAudit = function (
    auditAction,
    context = {},
    error = null,
    auditBy = {},
    auditOn = null
) {
    let status = error ? 500 : 200;

    const auditObj = {
        auditAction,
        context,
        error,
        status,
        auditBy,
        auditOn: auditOn || new Date(),
    };

    emitter.emit(auditEvent, auditObj);
};
