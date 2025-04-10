const events = require('events');
const AuditTrail = require('../models/audit.model'); // Model Mongoose
const emitter = new events.EventEmitter();

const auditEvent = 'audit';

// Lắng nghe và ghi log
emitter.on(auditEvent, async function (auditData) {
    try {
        const auditDoc = new AuditTrail({
            action: auditData.auditAction,
            actor: {
                id: auditData.user.id || auditData.user.sub,
                role: auditData.user.role,
            },
            context: {
                method: auditData.req.method,
                endpoint: auditData.req.originalUrl,
                location: auditData.req.ip,
                userAgent: auditData.req.headers['user-agent'],
            },
            status: auditData.status,
            details: auditData.details,
            occurredAt: new Date(),
        });
        await auditDoc.save();
    } catch (error) {
        console.error('Audit Event Emitter - Error:', error);
    }
});

exports.prepareAudit = function (req, auditAction, user, status, details) {
    const auditObj = {
        req,
        auditAction,
        user,
        status,
        details,
    };

    emitter.emit(auditEvent, auditObj);
};
