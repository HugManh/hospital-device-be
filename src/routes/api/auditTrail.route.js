const express = require('express');
const router = express.Router();
const AuditTrail = require('../../models/audit.model');

router.get('/', async (req, res) => {
    const {
        page = 1,
        limit = 20,
        userId,
        endpoint,
        method,
        status,
        from,
        to,
    } = req.query;

    const query = {};

    if (userId) query.userId = userId;
    if (endpoint) query.endpoint = endpoint;
    if (method) query.method = method;
    if (status) query.status = Number(status);

    if (from || to) {
        query.timestamp = {};
        if (from) query.timestamp.$gte = new Date(from);
        if (to) query.timestamp.$lte = new Date(to);
    }

    const logs = await AuditTrail.find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

    const total = await AuditTrail.countDocuments(query);

    res.json({
        total,
        page: Number(page),
        limit: Number(limit),
        logs,
    });
});

module.exports = router;
