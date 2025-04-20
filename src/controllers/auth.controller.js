const _ = require('lodash');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Response = require('../utils/response');
const { isDevelopment } = require('../config/constants');
const secretKey = process.env.JWT_SECRET;
const auditService = require('../services/audit.service');
const auditAction = require('../services/auditAction');

// Đăng ký
const register = async (req, res) => {
    const { email, name, password, role } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return Response.error(res, 'Email đã tồn tại!', 400);
        }

        const user = new User({ email, name, password, role });
        await user.save();

        return Response.success(res, null, 'Đăng ký tài khoản thành công', 201);
    } catch (error) {
        return Response.error(
            res,
            'Đã xảy ra lỗi không xác định',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Đăng nhập
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return Response.error(res, 'Thông tin đăng nhập không hợp lệ', 400);
        }

        if (!user.isActive) {
            return Response.error(res, 'Tài khoản đã bị vô hiệu hóa', 400);
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return Response.error(res, 'Thông tin đăng nhập không hợp lệ', 400);
        }

        // Tạo access token
        const accessToken = jwt.sign(
            {
                sub: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            secretKey,
            { expiresIn: '2h' }
        );

        // Tạo refresh token
        const refreshToken = jwt.sign(
            {
                sub: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            secretKey,
            { expiresIn: '2d' }
        );

        // Lưu refresh token vào database
        user.refreshToken = refreshToken;
        await user.save();

        req.user = user;
        const updateUser = _.omit(user.toObject(), [
            'password',
            'refreshToken',
        ]);

        const auditData = auditService.formatInfoJSON({
            resourceType: 'đăng nhập',
            detail: updateUser,
            performedBy: req.user.name,
        });

        auditService.prepareAudit(
            req,
            auditAction.actionList.LOGIN,
            auditData.message,
            auditData.details
        );

        return Response.success(
            res,
            {
                accessToken,
                refreshToken,
                user: {
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
            'Đăng nhập thành công'
        );
    } catch (error) {
        return Response.error(
            res,
            'Đã xảy ra lỗi không xác định',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Đăng xuất
const logout = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return Response.error(res, 'Token không hợp lệ', 400);
    }

    try {
        const user = await User.updateOne(
            { refreshToken },
            { $unset: { refreshToken: 1 } }
        );

        if (user.nModified === 0) {
            return Response.error(
                res,
                'Token không hợp lệ hoặc đã hết hạn',
                401
            );
        }

        res.clearCookie('accessToken', { httpOnly: true, secure: true });
        res.clearCookie('refreshToken', { httpOnly: true, secure: true });

        req.user = user;
        const updateUser = _.omit(user.toObject(), [
            'password',
            'refreshToken',
        ]);

        const auditData = auditService.formatInfoJSON({
            resourceType: 'đăng xuất',
            detail: updateUser,
            performedBy: req.user.name,
        });

        auditService.prepareAudit(
            req,
            auditAction.actionList.LOGIN,
            auditData.message,
            auditData.details
        );

        return Response.success(res, 'Đăng xuất thành công');
    } catch (error) {
        return Response.error(
            res,
            'Đã xảy ra lỗi không xác định',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Làm mới token
const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return Response.unauthorized(res, 'Từ chối truy cập.');
    }

    try {
        const decoded = jwt.verify(refreshToken, secretKey);
        const userId = decoded.sub;
        const user = await User.findById(userId);

        if (!user) return Response.unauthorized(res, 'Từ chối truy cập.');
        if (user.refreshToken !== refreshToken) {
            return Response.unauthorized(res, 'Từ chối truy cập.');
        }

        const accessToken = jwt.sign(
            {
                sub: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            secretKey,
            { expiresIn: '2h' }
        );

        return Response.success(res, { accessToken }, 'Lấy token thành công');
    } catch (error) {
        return Response.error(
            res,
            'Đã xảy ra lỗi không xác định',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Lấy thông tin profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user.sub;
        const user = await User.findById(userId).select(
            '-password -refreshToken'
        );

        if (!user) {
            return Response.notFound(res, 'Không tìm thấy tài khoản');
        }

        return Response.success(
            res,
            {
                profile: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
            'Lấy thông tin hồ sơ thành công'
        );
    } catch (error) {
        return Response.error(
            res,
            'Đã xảy ra lỗi không xác định',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Cập nhật profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { name, group } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return Response.notFound(res, 'Không tìm thấy tài khoản');
        }

        Object.assign(user, { name, group });

        await user.save();

        return Response.success(
            res,
            { name, group },
            'Cập nhật tài khoản thành công'
        );
    } catch (error) {
        return Response.error(
            res,
            'Đã xảy ra lỗi không xác định',
            500,
            isDevelopment ? error.message : null
        );
    }
};

const updatePassword = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { confirmPassword, currentPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return Response.notFound(res, 'Không tìm thấy tài khoản');
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return Response.error(res, 'Mật khẩu hiện tại không đúng', 400);
        }

        if (confirmPassword !== newPassword) {
            return Response.error(
                res,
                'Mật khẩu mới và xác nhận mật khẩu không khớp',
                400
            );
        }

        // Validate new password
        if (newPassword.length < 6) {
            return Response.error(
                res,
                'Mật khẩu mới phải có ít nhất 8 ký tự',
                400
            );
        }

        user.password = newPassword;
        await user.save();

        return Response.success(res, null, 'Cập nhật mật khẩu thành công');
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
    register,
    login,
    logout,
    refreshToken,
    getProfile,
    updateProfile,
    updatePassword,
};
