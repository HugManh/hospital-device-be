const EventEmitter = require('events');
const AuditTrail = require('../models/audit.model');

// Initialize EventEmitter for audit events
const auditEmitter = new EventEmitter();
const AUDIT_EVENT = 'audit';

// Map for field translations
const fieldTranslationMap = new Map([
    ['name', 'Tên'],
    ['status', 'Trạng thái'],
    ['role', 'Vai trò'],
    // Add more field translations here as needed
]);

// Utility function to translate field names using Map
const translateField = (field) => {
    return fieldTranslationMap.get(field) || field;
};

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
        console.log(detail);

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
 * @param {string} params.resourceType - Type of resource being updated.
 * @param {Object} params.detail - Details of the changes.
 * @param {string} params.performedBy - Name of the user performing the action.
 * @returns {Object} Formatted audit data.
 */
const formatUpdateJSON = ({ resourceType, detail, performedBy }) => {
    if (!resourceType || !performedBy) {
        throw new Error(
            'Missing required parameters: resourceType or performedBy'
        );
    }

    const details = detail?.changes
        ? Object.entries(detail.changes).map(([field, { from, to }]) => ({
              field,
              label: translateField(field),
              from: formatValue(from),
              to: formatValue(to),
          }))
        : [];

    return {
        message: `"${performedBy}" đã cập nhật ${resourceType}`,
        details,
    };
};

/**
 * Formats audit data for a CREATE operation.
 * @param {Object} params - Parameters for formatting.
 * @param {string} params.resourceType - Type of resource being created.
 * @param {Object} params.detail - Details of the created resource.
 * @param {string} params.performedBy - Name of the user performing the action.
 * @returns {Object} Formatted audit data.
 */
const formatCreateJSON = ({ resourceType, detail, performedBy }) => {
    if (!resourceType || !performedBy) {
        throw new Error(
            'Missing required parameters: resourceType or performedBy'
        );
    }

    const details = detail
        ? Object.entries(detail).map(([field, value]) => ({
              field,
              label: translateField(field),
              value: formatValue(value),
          }))
        : [];

    return {
        message: `"${performedBy}" đã tạo ${resourceType}`,
        details,
    };
};

/**
 * Formats audit data for a DELETE operation.
 * @param {Object} params - Parameters for formatting.
 * @param {string} params.resourceType - Type of resource being deleted.
 * @param {Object} params.detail - Details of the deleted resource.
 * @param {string} params.performedBy - Name of the user performing the action.
 * @returns {Object} Formatted audit data.
 */
const formatDeleteJSON = ({ resourceType, detail, performedBy }) => {
    if (!resourceType || !performedBy) {
        throw new Error(
            'Missing required parameters: resourceType or performedBy'
        );
    }

    const details = detail
        ? Object.entries(detail).map(([field, value]) => ({
              field,
              label: translateField(field),
              value: formatValue(value),
          }))
        : [];

    return {
        message: `"${performedBy}" đã xóa ${resourceType}`,
        details,
    };
};

// Export the audit service functions
module.exports = {
    prepareAudit,
    formatUpdateJSON,
    formatCreateJSON,
    formatDeleteJSON,
};
