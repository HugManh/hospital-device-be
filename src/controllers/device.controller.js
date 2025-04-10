const { isDevelopment } = require('../config/constants');
const Device = require('../models/device.model');
const Response = require('../utils/response');

// Tạo mới device
const addDevice = async (req, res) => {
    try {
        const { location, name } = req.body;
        // const existingDevice = await Device.findOne({ code });
        // if (existingDevice) {
        //     return Response.error(res, 'Device code already exists!', 400);
        // }

        const device = new Device({ name, location });
        await device.save();
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
        const devices = await Device.find().sort({ createdAt: -1 });
        return Response.success(res, devices, 'Devices retrieved successfully');
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
