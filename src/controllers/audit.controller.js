const AuditTrail = require('../models/audit.model');
const Response = require('../utils/response');
const { isDevelopment } = require('../config/constants');

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
        return Response.success(res, audit, 'Lấy lịch sử truy vết thành công');
    } catch (error) {
        return Response.error(
            res,
            'Đã xảy ra lỗi không xác định',
            500,
            isDevelopment ? error.message : null
        );
    }
};

module.exports = {
    getAudit,
};
