const _ = require('lodash');
const { isDevelopment } = require('../config/constants');
const User = require('../models/user.model');
const { generatePassword } = require('../utils/crypto');
const Response = require('../utils/response');
const auditService = require('../services/audit.service');
const auditAction = require('../services/auditAction');
const QueryBuilder = require('../utils/queryBuilder');
const { diffObjects } = require('../utils/diffs');

// Tạo mới user
const createUser = async (req, res) => {
    try {
        const { email, name, group, status } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return Response.error(res, 'Email đã tồn tại!', 400);
        }

        const password = generatePassword();
        const newUser = {
            name,
            email,
            group,
            status: status || true,
        };

        const user = new User({ ...newUser, password });
        await user.save();

        const auditData = auditService.formatCreateJSON({
            resourceType: 'tài khoản',
            detail: newUser,
            performedBy: req.user.name,
        });

        auditService.prepareAudit(
            req,
            auditAction.actionList.CREATE_USER,
            auditData.message,
            auditData.details
        );

        return Response.success(
            res,
            'Tạo tài khoản thành công',
            { ...newUser, password },
            null,
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

        const { data, meta } = users;
        return Response.success(
            res,
            'Lấy danh sách tài khoản thành công',
            data,
            meta
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
            return Response.notFound(res, 'Không tìm thấy tài khoản');
        }
        return Response.success(
            res,
            'Lấy thông tin tài khoản thành công',
            user
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
            return Response.notFound(res, 'Không tìm thấy tài khoản');
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
        // if (Object.keys(changes).length > 0) {
        const auditData = auditService.formatUpdateJSON({
            resourceType: 'tài khoản',
            detail: { changes },
            performedBy: req.user.name,
        });
        auditService.prepareAudit(
            req,
            auditAction.actionList.UPDATE_USER,
            auditData.message,
            auditData.details
        );
        // }
        // TODO: Có cần thiết phải trả data trong response không?
        return Response.success(
            res,
            'Cập nhật thông tin tài khoản thành công',
            {
                name: updatedUser.name,
                email: updatedUser.email,
                group: updatedUser.group,
                role: updatedUser.role,
                isActive: updatedUser.isActive,
            }
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
            return Response.notFound(res, 'Không tìm thấy tài khoản');
        }

        const deletedUser = _.omit(user.toObject(), [
            'password',
            'refreshToken',
        ]);

        const auditData = auditService.formatDeleteJSON({
            resourceType: 'tài khoản',
            detail: deletedUser,
            performedBy: req.user.name,
        });

        auditService.prepareAudit(
            req,
            auditAction.actionList.DELETE_USER,
            auditData.message,
            auditData.details
        );

        return Response.success(res, 'Đã xoá tài khoản thành công');
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
            return Response.notFound(res, 'Không tìm thấy tài khoản');
        }

        const password = generatePassword();
        user.password = password;
        await user.save();

        const updateUser = _.pick(user, [
            'id',
            'email',
            'name',
            'role',
            'group',
            'isActive',
        ]);

        const auditData = auditService.formatCreateJSON({
            resourceType: 'mật khẩu mới',
            detail: updateUser,
            performedBy: req.user.name,
        });

        auditService.prepareAudit(
            req,
            auditAction.actionList.RESET_PASSWORD,
            auditData.message,
            auditData.details
        );

        return Response.success(res, 'Đã tạo mới mật khẩu thành công', {
            password,
        });
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
