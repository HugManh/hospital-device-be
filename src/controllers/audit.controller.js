const AuditTrail = require('../models/audit.model');
const Response = require('../utils/response');
const { isDevelopment } = require('../config/constants');
const QueryBuilder = require('../utils/queryBuilder');

const getAudits = async (req, res) => {
    try {
        const audit = await new QueryBuilder(AuditTrail, req.query)
            .filter()
            .sort()
            .paginate()
            .exec();
        const { data, meta } = audit;
        return Response.success(
            res,
            'Lấy danh sách nhật ký thành công',
            data,
            meta
        );
    } catch (error) {
        return Response.error(
            res,
            'Lỗi hệ thống',
            500,
            isDevelopment ? error.message : null
        );
    }
};

const getAuditById = async (req, res) => {
    try {
        const audit = await AuditTrail.findById(req.params.id);
        if (!audit) {
            return Response.notFound(res, 'Không tìm thấy nhật ký');
        }
        return Response.success(
            res,
            'Lấy thông tin chi tiết của nhật ký thành công',
            audit
        );
    } catch (error) {
        return Response.error(
            res,
            'Lỗi hệ thống',
            500,
            isDevelopment ? error.message : null
        );
    }
};

module.exports = {
    getAudits,
    getAuditById,
};
