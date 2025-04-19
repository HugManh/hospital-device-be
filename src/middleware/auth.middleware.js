const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;

// Middleware kiểm tra authentication
const authenticate = (req, res, next) => {
    // Lấy token từ header Authorization
    const authHeader = req.headers['authorization'];
    const token =
        authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.split(' ')[1]
            : null;

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
            code: 'TokenExpiredError',
            message: 'Token không hợp lệ hoặc đã hết hạn',
            error: error.message,
        });
    }
};

// Middleware để kiểm tra quyền
const authorizeRoles = (allowedRoles) => (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: `Bạn không có quyền hạn (yêu cầu một trong các quyền: ${allowedRoles.join(', ')})`,
        });
    }
    next();
};

module.exports = { authenticate, authorizeRoles };
