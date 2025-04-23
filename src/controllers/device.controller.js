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
            return Response.validationError(res);
        }

        const newDevice = { name, location };
        const device = new Device(newDevice);
        await device.save();

        const auditData = await auditService.formatInfoJSON({
            modelName: 'Device',
            detail: newDevice,
        });

        auditService.prepareAudit(
            req,
            auditAction.actionList.CREATE_DEVICE,
            `"${req.user.name}" đã thêm thiết bị mới.`,
            auditData
        );

        return Response.success(
            res,
            'Đã thêm thiết bị mới.',
            device.toObject(),
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

// Lấy danh sách device
const getDevices = async (req, res) => {
    try {
        const devices = await new QueryBuilder(Device, req.query)
            .filter()
            .sort()
            .paginate()
            .exec();

        const { data, meta } = devices;

        return Response.success(
            res,
            'Đã lấy danh sách thiết bị.',
            data,
            meta
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

// Lấy thông tin device theo ID
const getDeviceById = async (req, res) => {
    try {
        const device = await Device.findById(req.params.id);
        if (!device) {
            return Response.notFound(res, 'Thiết bị không tồn tại.');
        }
        return Response.success(
            res,
            'Đã lấy thông tin thiết bị.',
            device
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
            return Response.validationError(res);
        }

        const device = await Device.findById(id);
        if (!device) {
            return Response.notFound(res, 'Thiết bị không tồn tại.');
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
        const auditData = await auditService.formatUpdateJSON({
            modelName: 'Device',
            detail: { changes },
        });
        auditService.prepareAudit(
            req,
            auditAction.actionList.UPDATE_DEVICE,
            `"${req.user.name}" đã cập nhật thông tin thiết bị.`,
            auditData
        );
        // }

        // TODO: Có cần thiết phải trả data trong response không?
        return Response.success(res, 'Đã cập nhật thông tin thiết bị.', {
            device: updatedDevice,
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
            return Response.notFound(res, 'Thiết bị không tồn tại.');
        }

        const auditData = await auditService.formatInfoJSON({
            modelName: 'Device',
            detail: device.toObject(),
        });

        auditService.prepareAudit(
            req,
            auditAction.actionList.DELETE_DEVICE,
            `"${req.user.name}" đã xoá thiết bị.`,
            auditData
        );

        return Response.success(res, 'Đã xóa thiết bị.');
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
    addDevice,
    getDevices,
    getDeviceById,
    updateDevice,
    deleteDevice,
};
