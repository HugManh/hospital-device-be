const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Response = require('../utils/response');
const { isDevelopment } = require('../config/constants');
const secretKey = process.env.JWT_SECRET;

// Đăng ký
const register = async (req, res) => {
    const { email, name, password, role } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return Response.error(res, 'Email already exists!', 400);
        }

        const user = new User({ email, name, password, role });
        await user.save();

        return Response.success(res, null, 'User registered successfully', 201);
    } catch (error) {
        return Response.error(
            res,
            'Unexpected error occurred',
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
            return Response.error(res, 'Invalid credentials', 400);
        }

        if (!user.isActive) {
            return Response.error(res, 'Account is inactive', 400);
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return Response.error(res, 'Invalid credentials', 400);
        }

        // Tạo access token
        const accessToken = jwt.sign(
            {
                sub: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Tạo refresh token
        const refreshToken = jwt.sign(
            {
                sub: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: '2d' }
        );

        // Lưu refresh token vào database
        user.refreshToken = refreshToken;
        await user.save();

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
            'Login successful'
        );
    } catch (error) {
        return Response.error(
            res,
            'Unexpected error occurred',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Đăng xuất
const logout = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return Response.error(res, 'Refresh token is required', 400);
    }

    try {
        const updatedUser = await User.updateOne(
            { refreshToken },
            { $unset: { refreshToken: 1 } }
        );

        if (updatedUser.nModified === 0) {
            return Response.error(res, 'Invalid or expired refresh token', 401);
        }

        res.clearCookie('accessToken', { httpOnly: true, secure: true });
        res.clearCookie('refreshToken', { httpOnly: true, secure: true });

        return Response.success(res, null, 'Logout successful');
    } catch (error) {
        return Response.error(
            res,
            'Unexpected error occurred',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Làm mới token
const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    const userId = req.user.sub;

    if (!refreshToken) {
        return Response.unauthorized(
            res,
            'Access Denied. No refresh token provided.'
        );
    }

    try {
        const user = await User.findById(userId).select('refreshToken');
        if (!user) return Response.notFound(res, 'User not found');
        if (user.refreshToken !== refreshToken) {
            return Response.unauthorized(
                res,
                'Access Denied. Invalid refresh token.'
            );
        }

        const decoded = jwt.verify(refreshToken, secretKey);
        const accessToken = jwt.sign(
            { email: decoded.email, id: decoded.id },
            secretKey,
            { expiresIn: '1h' }
        );

        return Response.success(
            res,
            { accessToken },
            'Token refreshed successfully'
        );
    } catch (error) {
        return Response.error(res, 'Invalid refresh token', 400);
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
            return Response.notFound(res, 'User not found');
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
            'Profile retrieved successfully'
        );
    } catch (error) {
        return Response.error(
            res,
            'Unexpected error occurred',
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
            return Response.notFound(res, 'User not found');
        }

        Object.assign(user, { name, group });

        await user.save();

        return Response.success(
            res,
            { name, group },
            'User updated successfully'
        );
    } catch (error) {
        return Response.error(
            res,
            'Unexpected error occurred',
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
            return Response.notFound(res, 'User not found');
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return Response.error(res, 'Current password is incorrect', 400);
        }

        if (confirmPassword !== newPassword) {
            return Response.error(
                res,
                'New password and confirm password do not match',
                400
            );
        }

        // Validate new password
        if (newPassword.length < 6) {
            return Response.error(
                res,
                'New password must be at least 8 characters long',
                400
            );
        }

        user.password = newPassword;
        await user.save();

        return Response.success(res, null, 'Password updated successfully');
    } catch (error) {
        return Response.error(
            res,
            'Unexpected error occurred',
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
