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
        console.log('req', req.user);

        audit.prepareAudit(
            req,
            auditAction.actionList.CREATE_DEVICE,
            'success',
            'Thêm thiết bị thành công'
        );

        return Response.success(
            res,
            { device },
            'Thêm thiết bị thành công',
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
            return Response.notFound(res, 'Không tìm thấy thiết bị');
        }

        audit.prepareAudit(
            req,
            auditAction.actionList.UPDATE_DEVICE,
            'success',
            'Cập nhật thông tin thiết bị thành công'
        );

        return Response.success(
            res,
            { device },
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

// Xóa device
const deleteDevice = async (req, res) => {
    try {
        const device = await Device.findByIdAndDelete(req.params.id);
        if (!device) {
            return Response.notFound(res, 'Không tìm thấy thiết bị');
        }

        audit.prepareAudit(
            req,
            auditAction.actionList.DELETE_DEVICE,
            'success',
            'Xóa thiết bị thành công'
        );

        return Response.success(res, null, 'Xóa thiết bị thành công');
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
