const { isDevelopment } = require('../config/constants');
const Device = require('../models/device.model');
const Response = require('../utils/response');
const audit = require('../services/audit.service');
const auditAction = require('../services/auditAction');
const QueryBuilder = require('../utils/queryBuilder');

// Tạo mới device
const addDevice = async (req, res) => {
    try {
        const { location, name } = req.body;
        if (!name || !location) {
            return Response.validationError(res, [
                'Name, location are required',
            ]);
        }

        const device = new Device({ name, location });
        await device.save();

        audit.prepareAudit(
            req,
            auditAction.actionList.CREATE_DEVICE,
            device,
            'success',
            'Device created successfully'
        );

        return Response.success(
            res,
            { device },
            'Device created successfully',
            201
        );
    } catch (error) {
        return Response.error(
            res,
            'Server error',
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
            'Devices retrieved successfully'
        );
    } catch (error) {
        return Response.error(
            res,
            'Server error',
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
            return Response.notFound(res, 'Device not found');
        }
        return Response.success(res, device, 'Device retrieved successfully');
    } catch (error) {
        return Response.error(
            res,
            'Server error',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Cập nhật device
const updateDevice = async (req, res) => {
    try {
        const { name, location } = req.body;
        const device = await Device.findByIdAndUpdate(
            req.params.id,
            { name, location },
            { new: true }
        );
        if (!device) {
            return Response.notFound(res, 'Device not found');
        }

        audit.prepareAudit(
            req,
            auditAction.actionList.UPDATE_DEVICE,
            device,
            'success',
            'Device updated successfully'
        );

        return Response.success(res, { device }, 'Device updated successfully');
    } catch (error) {
        return Response.error(
            res,
            'Server error',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Xóa device
const deleteDevice = async (req, res) => {
    try {
        const device = await Device.findByIdAndDelete(req.params.id);
        if (!device) {
            return Response.notFound(res, 'Device not found');
        }

        audit.prepareAudit(
            req,
            auditAction.actionList.DELETE_DEVICE,
            device,
            'success',
            'Device deleted successfully'
        );

        return Response.success(res, null, 'Device deleted successfully');
    } catch (error) {
        return Response.error(
            res,
            'Server error',
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
