const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;

// Middleware kiểm tra authentication
const authenticate = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Vui lòng đăng nhập để tiếp tục',
        });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ hoặc đã hết hạn',
            error: error.message,
        });
    }
};

// Middleware kiểm tra quyền admin
const authorizeAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập (yêu cầu quyền admin)',
        });
    }
    next();
};

module.exports = { authenticate, authorizeAdmin };
