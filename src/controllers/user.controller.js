const User = require('../models/user.model');
const { generatePassword } = require('../utils/crypto');
const Response = require('../utils/response');

const isDevelopment = process.env.NODE_ENV === 'development';

// Tạo mới user
const createUser = async (req, res) => {
    try {
        const { email, name, group } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return Response.error(res, 'Email already exists!', 400);
        }

        const password = generatePassword(8);
        const user = new User({ email, name, group, password });
        await user.save();

        return Response.success(
            res,
            { name, group, password },
            'User created successfully',
            201
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

// Lấy danh sách user
const getUsers = async (req, res) => {
    try {
        const users = await User.getAll();
        return Response.success(res, users, 'Users retrieved successfully');
    } catch (error) {
        return Response.error(
            res,
            'Unexpected error occurred',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Lấy thông tin user theo ID
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return Response.notFound(res, 'User not found');
        }
        return Response.success(res, user, 'User retrieved successfully');
    } catch (error) {
        return Response.error(
            res,
            'Unexpected error occurred',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Cập nhật user
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, group, role, isActive } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return Response.notFound(res, 'User not found');
        }

        user.name = name;
        user.email = email;
        user.group = group;
        user.role = role;
        user.isActive = isActive;

        await user.save();

        return Response.success(
            res,
            { name, email, group, role, isActive },
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

// Xóa user
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return Response.notFound(res, 'User not found');
        }

        return Response.success(res, null, 'User deleted successfully');
    } catch (error) {
        return Response.error(
            res,
            'Unexpected error occurred',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Đặt lại mật khẩu
const resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password) {
            return Response.error(res, 'Password is required', 400);
        }

        const user = await User.findById(id);
        if (!user) {
            return Response.notFound(res, 'User not found');
        }

        user.password = password;
        await user.save();

        return Response.success(
            res,
            { password },
            'Password reset successfully'
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

module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    resetPassword,
};
