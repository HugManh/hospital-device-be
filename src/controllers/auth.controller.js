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
            return Response.error(res, 'Email đã tồn tại.', 400);
        }

        const user = new User({ email, name, password, role });
        await user.save();

        return Response.success(
            res,
            'Đăng ký tài khoản thành công.',
            null,
            null,
            201
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

// Đăng nhập
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return Response.error(
                res,
                'Thông tin đăng nhập không hợp lệ.',
                400
            );
        }

        if (!user.isActive) {
            return Response.error(res, 'Tài khoản đã bị vô hiệu hóa.', 400);
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return Response.error(
                res,
                'Thông tin đăng nhập không hợp lệ.',
                400
            );
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

        const auditData = await auditService.formatInfoJSON({
            modelName: 'User',
            detail: updateUser,
        });

        auditService.prepareAudit(
            req,
            auditAction.actionList.LOGIN,
            `[${req.user.name}] đã đăng nhập.`,
            auditData
        );

        return Response.success(res, 'Đăng nhập thành công.', {
            accessToken,
            refreshToken,
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        return Response.error(
            res,
            'Lỗi hệ thống',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Đăng xuất
const logout = async (req, res) => {
    const { sub: id } = req.user;
    const { refreshToken } = req.body;
    if (!id || !refreshToken) {
        return Response.validationError(res);
    }

    try {
        const user = await User.findOne({ _id: id, refreshToken });
        if (!user) {
            return Response.error(
                res,
                'ID hoặc token không hợp lệ hoặc đã hết hạn.',
                401
            );
        }

        await User.updateOne(
            { _id: id, refreshToken },
            { $unset: { refreshToken: 1 } }
        );

        if (req.cookies.accessToken) {
            res.clearCookie('accessToken', { httpOnly: true, secure: true });
        }
        if (req.cookies.refreshToken) {
            res.clearCookie('refreshToken', { httpOnly: true, secure: true });
        }

        const updateUser = _.omit(user.toObject(), [
            'password',
            'refreshToken',
        ]);
        const auditData = await auditService.formatInfoJSON({
            modelName: 'User',
            detail: updateUser,
        });

        auditService.prepareAudit(
            req,
            auditAction.actionList.LOGOUT,
            `[${user.name}] đã đăng xuất.`,
            auditData
        );

        return Response.success(res, 'Đăng xuất thành công.');
    } catch (error) {
        return Response.error(
            res,
            'Lỗi hệ thống',
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

        return Response.success(res, 'Lấy mã thành công.', { accessToken });
    } catch (error) {
        return Response.error(
            res,
            'Lỗi hệ thống',
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
            return Response.notFound(res, 'Người dùng không tồn tại.');
        }

        return Response.success(res, 'Lấy thông tin hồ sơ thành công.', {
            profile: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        return Response.error(
            res,
            'Lỗi hệ thống',
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
            return Response.notFound(res, 'Người dùng không tồn tại.');
        }

        Object.assign(user, { name, group });

        await user.save();

        return Response.success(res, 'Cập nhật tài khoản thành công.', {
            name,
            group,
        });
    } catch (error) {
        return Response.error(
            res,
            'Lỗi hệ thống',
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
            return Response.notFound(res, 'Người dùng không tồn tại.');
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return Response.error(res, 'Mật khẩu hiện tại không đúng.', 400);
        }

        if (confirmPassword !== newPassword) {
            return Response.error(
                res,
                'Mật khẩu mới và xác nhận mật khẩu không khớp.',
                400
            );
        }

        // Validate new password
        if (newPassword.length < 6) {
            return Response.error(
                res,
                'Mật khẩu mới phải có ít nhất 8 ký tự.',
                400
            );
        }

        user.password = newPassword;
        await user.save();

        return Response.success(res, 'Cập nhật mật khẩu thành công.');
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
    register,
    login,
    logout,
    refreshToken,
    getProfile,
    updateProfile,
    updatePassword,
};
