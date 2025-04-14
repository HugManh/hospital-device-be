const events = require('events');
const AuditTrail = require('../models/audit.model'); // Model Mongoose
const emitter = new events.EventEmitter();

const auditEvent = 'audit';

// Lắng nghe và ghi log
emitter.on(auditEvent, async function (auditData) {
    try {
        const userData = auditData.req.user;
        const auditDoc = new AuditTrail({
            action: auditData.auditAction,
            actor: {
                id: userData.id || userData.sub,
                name: userData.name,
                role: userData.role,
            },
            context: {
                method: auditData.req.method,
                endpoint: auditData.req.originalUrl,
                location: auditData.req.ip,
                userAgent: auditData.req.headers['user-agent'],
            },
            status: auditData.status,
            details: auditData.details,
        });
        await auditDoc.save();
    } catch (error) {
        console.error('Audit Event Emitter - Error:', error);
    }
});

exports.prepareAudit = function (req, auditAction, status, details) {
    const auditObj = {
        req,
        auditAction,
        status,
        details,
    };

    emitter.emit(auditEvent, auditObj);
};
