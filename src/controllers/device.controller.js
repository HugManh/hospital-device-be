const _ = require('lodash');
const { isDevelopment } = require('../config/constants');
const Device = require('../models/device.model');
const Response = require('../utils/response');
const auditService = require('../services/audit.service');
const auditAction = require('../services/auditAction');
const QueryBuilder = require('../utils/queryBuilder');
const { diffObjects } = require('../utils/diffs');

// Tạo mới device
const addDevice = async (req, res) => {
    try {
        const { location, name } = req.body;
        if (!name || !location) {
            return Response.validationError(res, [
                'Name, location are required',
            ]);
        }

        const newDevice = { name, location };
        const device = new Device(newDevice);
        await device.save();

        const auditData = auditService.formatCreateJSON({
            resourceType: 'thiết bị',
            detail: newDevice,
            performedBy: req.user.name,
        });

        auditService.prepareAudit(
            req,
            auditAction.actionList.CREATE_DEVICE,
            auditData.message,
            auditData.details
        );

        return Response.success(
            res,
            { newDevice },
            'Thêm thiết bị mới thành công',
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

// Lấy danh sách device
const getDevices = async (req, res) => {
    try {
        const devices = await new QueryBuilder(Device, req.query)
            .filter()
            .sort()
            .paginate()
            .exec();

        return Response.success(
            res,
            devices.data,
            devices.meta,
            'Lấy danh sách thiết bị thành công'
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

// Lấy thông tin device theo ID
const getDeviceById = async (req, res) => {
    try {
        const device = await Device.findById(req.params.id);
        if (!device) {
            return Response.notFound(res, 'Không tìm thấy thiết bị');
        }
        return Response.success(
            res,
            device,
            'Lấy thông tin thiết bị thành công'
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

/**
 * Updates a device.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Response with updated device or error
 */
const updateDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, location } = req.body;

        if (!name && !location) {
            return Response.validationError(
                res,
                'Phải có ít nhất một trường để cập nhật'
            );
        }

        const device = await Device.findById(id);
        if (!device) {
            return Response.notFound(res, 'Không tìm thấy thiết bị');
        }

        const oldData = {
            name: device.name,
            location: device.location,
        };

        const updates = _.pickBy(
            { name, location },
            (value) => !_.isUndefined(value) || !_.isEmpty(value)
        );

        const updatedDevice = await Device.findOneAndUpdate(
            { _id: id },
            { $set: updates },
            { new: true, runValidators: true }
        );

        const changes = diffObjects(oldData, updatedDevice, [
            'name',
            'location',
        ]);
        // if (Object.keys(changes).length > 0) {
        const auditData = auditService.formatUpdateJSON({
            resourceType: 'thiết bị',
            detail: { changes },
            performedBy: req.user.name,
        });
        auditService.prepareAudit(
            req,
            auditAction.actionList.UPDATE_DEVICE,
            auditData.message,
            auditData.details
        );
        // }

        // TODO: Có cần thiết phải trả data trong response không?
        return Response.success(
            res,
            { device: updatedDevice },
            'Cập nhật thông tin thiết bị thành công'
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

/**
 * Deletes a device.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Response with success or error
 */
const deleteDevice = async (req, res) => {
    try {
        const device = await Device.findByIdAndDelete(req.params.id);
        if (!device) {
            return Response.notFound(res, 'Không tìm thấy thiết bị');
        }

        const auditData = auditService.formatDeleteJSON({
            resourceType: 'tài khoản',
            detail: device.toObject(),
            performedBy: req.user.name,
        });

        auditService.prepareAudit(
            req,
            auditAction.actionList.DELETE_DEVICE,
            auditData.message,
            auditData.details
        );

        return Response.success(res, 'Đã xóa thiết bị thành công');
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
    addDevice,
    getDevices,
    getDeviceById,
    updateDevice,
    deleteDevice,
};
