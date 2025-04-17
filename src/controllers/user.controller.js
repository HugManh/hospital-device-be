const _ = require('lodash');
const { isDevelopment } = require('../config/constants');
const User = require('../models/user.model');
const { generatePassword } = require('../utils/crypto');
const Response = require('../utils/response');
const audit = require('../services/audit.service');
const auditAction = require('../services/auditAction');
const QueryBuilder = require('../utils/queryBuilder');
const { diffObjects } = require('../utils/diffs');

// Tạo mới user
const createUser = async (req, res) => {
    try {
        const { email, name, group } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return Response.error(res, 'Email đã tồn tại!', 400);
        }

        const password = generatePassword();
        const user = new User({ email, name, group, password });
        await user.save();

        audit.prepareAudit(
            req,
            auditAction.actionList.CREATE_USER,
            'Tạo người dùng thành công',
            {
                id: user.id,
                name,
                role: user.role,
                email,
                group,
            }
        );

        return Response.success(
            res,
            { name, group, password },
            'Tạo người dùng thành công',
            201
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

// Lấy danh sách user
const getUsers = async (req, res) => {
    try {
        const users = await new QueryBuilder(User, req.query)
            .filter()
            .sort()
            .select('-password -refreshToken')
            .paginate()
            .exec();
        return Response.success(
            res,
            users.data,
            users.meta,
            'Lấy danh sách người dùng thành công'
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

// Lấy thông tin user theo ID
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return Response.notFound(res, 'Không tìm thấy người dùng');
        }
        return Response.success(
            res,
            user,
            'Lấy thông tin người dùng thành công'
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

// Cập nhật user
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, group, role, isActive } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return Response.notFound(res, 'Không tìm thấy người dùng');
        }

        const oldData = {
            name: user.name,
            email: user.email,
            group: user.group,
            role: user.role,
            isActive: user.isActive,
        };

        const updates = _.pickBy(
            { name, email, group, role, isActive },
            (value) => !_.isUndefined(value) || !_.isEmpty(value)
        );

        const updatedUser = await User.findOneAndUpdate(
            { _id: id },
            { $set: updates },
            { new: true, runValidators: true }
        );

        // Ghi audit log
        const changes = diffObjects(oldData, updates, [
            'name',
            'email',
            'group',
            'role',
            'isActive',
        ]);
        if (Object.keys(changes).length > 0) {
            audit.prepareAudit(
                req,
                auditAction.actionList.UPDATE_USER,
                'Cập nhật thông tin người dùng thành công',
                {
                    userId: id,
                    changes,
                }
            );
        }

        return Response.success(
            res,
            {
                name: updatedUser.name,
                email: updatedUser.email,
                group: updatedUser.group,
                role: updatedUser.role,
                isActive: updatedUser.isActive,
            },
            'Cập nhật thông tin người dùng thành công'
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

// Xóa user
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return Response.notFound(res, 'Không tìm thấy người dùng');
        }

        audit.prepareAudit(
            req,
            auditAction.actionList.DELETE_USER,
            'Đã xoá người dùng thành công',
            {
                id: user.id,
                name: user.name,
                role: user.role,
                email: user.email,
                group: user.group,
            }
        );

        return Response.success(res, null, 'Đã xoá người dùng thành công');
    } catch (error) {
        return Response.error(
            res,
            'Đã xảy ra lỗi không xác định',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Đặt lại mật khẩu
const resetPassword = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return Response.notFound(res, 'Không tìm thấy người dùng');
        }

        const password = generatePassword();
        user.password = password;
        await user.save();

        audit.prepareAudit(
            req,
            auditAction.actionList.RESET_PASSWORD,
            'Đã tạo mới mật khẩu thành công',
            {
                id: user.id,
                name: user.name,
                role: user.role,
                email: user.email,
                group: user.group,
            }
        );

        return Response.success(
            res,
            { password },
            'Đã tạo mới mật khẩu thành công'
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

module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    resetPassword,
};
