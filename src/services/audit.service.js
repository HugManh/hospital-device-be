const EventEmitter = require('events');
const AuditTrail = require('../models/audit.model');
const { getLabel } = require('../utils/fieldLabelRegistry');

// Initialize EventEmitter for audit events
const auditEmitter = new EventEmitter();
const AUDIT_EVENT = 'audit';

// Utility function to format values for display
const formatValue = (value) => {
    if (value === true) return 'Hoạt động';
    if (value === false) return 'Không hoạt động';
    return value?.toString() || '';
};

/**
 * Event listener for audit events, responsible for saving audit logs to the database.
 * @param {Object} auditData - Audit data containing request, action, message, and details.
 */
auditEmitter.on(AUDIT_EVENT, async (auditData) => {
    try {
        if (!auditData?.req || !auditData.auditAction || !auditData.message) {
            throw new Error('Invalid audit data provided');
        }

        const { req, auditAction, message, detail } = auditData;

        const userData = req.user || {};

        const auditDoc = new AuditTrail({
            action: auditAction,
            actor: {
                id: userData.id || userData.sub || 'unknown',
                name: userData.name || 'Anonymous',
                role: userData.role || 'N/A',
            },
            context: {
                method: req.method || 'UNKNOWN',
                endpoint: req.originalUrl || 'UNKNOWN',
                location: req.ip || 'UNKNOWN',
                userAgent: req.headers['user-agent'] || 'UNKNOWN',
            },
            message,
            detail: detail || {},
        });

        await auditDoc.save();
    } catch (error) {
        console.error('Audit Event Emitter - Error:', error);
    }
});

const prepareAudit = (req, auditAction, message, detail = {}) => {
    if (!req || !auditAction || !message) {
        console.warn('Missing required parameters for audit');
        return;
    }

    auditEmitter.emit(AUDIT_EVENT, { req, auditAction, message, detail });
};

/**
 * Formats audit data for an UPDATE operation.
 * @param {Object} params - Parameters for formatting.
 * @param {string} params.modelName - Type of resource being updated.
 * @param {Object} params.detail - Details of the changes.
 * @param {string} params.locale - Language locale (default: 'vi').
 * @returns {Object} Formatted audit data.
 */
const formatUpdateJSON = async ({ modelName, detail, locale = 'vi' }) => {
    const details = detail?.changes
        ? await Promise.all(
              Object.entries(detail.changes).map(
                  async ([field, { from, to }]) => ({
                      field,
                      label: await getLabel(modelName, field, locale),
                      from: formatValue(from),
                      to: formatValue(to),
                  })
              )
          )
        : [];

    return details;
};

/**
 * Formats audit data for a CREATE or DELETE operation.
 * @param {Object} params - Parameters for formatting.
 * @param {string} params.modelName - Type of resource.
 * @param {Object} params.detail - Details of the resource.
 * @param {string} params.locale - Language locale (default: 'vi').
 * @returns {Object} Formatted audit data.
 */
const formatInfoJSON = async ({ modelName, detail, locale = 'vi' }) => {
    const details = detail
        ? await Promise.all(
              Object.entries(detail).map(async ([field, value]) => ({
                  field,
                  label: await getLabel(modelName, field, locale),
                  value: formatValue(value),
              }))
          )
        : [];

    return details;
};

module.exports = {
    prepareAudit,
    formatUpdateJSON,
    formatInfoJSON,
};
