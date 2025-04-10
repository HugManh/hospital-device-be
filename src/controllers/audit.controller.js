const AuditTrail = require('../models/audit.model');
const Response = require('../utils/response');

const getAudit = async (req, res) => {
    try {
        const { page = 1, limit = 20, userId, endpoint } = req.query;
        const query = {};
        if (userId) query.userId = userId;
        if (endpoint) query.endpoint = endpoint;
        const audit = await AuditTrail.find(query)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        return Response.success(res, audit, 'Audit retrieved successfully');
    } catch (error) {
        return Response.error(res, error.message, 500);
    }
};

module.exports = {
    getAudit,
};
