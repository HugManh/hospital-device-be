const Device = require('../models/device.model');

// Tạo mới device
const createDevice = async (req, res) => {
    const { code, name } = req.body;

    try {
        const existingDevice = await Device.findOne({ code });
        if (existingDevice) {
            return res
                .status(400)
                .json({ message: 'Device code already exists!' });
        }

        const device = new Device({ code, name });
        await device.save();

        res.status(201).json({
            message: 'Device created successfully',
            device,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Lấy danh sách device
const getDevices = async (req, res) => {
    try {
        const devices = await Device.find();
        res.status(200).json(devices);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Lấy thông tin device theo ID
const getDeviceById = async (req, res) => {
    try {
        const device = await Device.findById(req.params.id);
        if (!device) {
            return res.status(404).json({ message: 'Device not found' });
        }
        res.status(200).json(device);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Cập nhật device
const updateDevice = async (req, res) => {
    try {
        const { code, name } = req.body;
        const device = await Device.findByIdAndUpdate(
            req.params.id,
            { code, name },
            { new: true }
        );

        if (!device) {
            return res.status(404).json({ message: 'Device not found' });
        }

        res.status(200).json({
            message: 'Device updated successfully',
            device,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Xóa device
const deleteDevice = async (req, res) => {
    try {
        const device = await Device.findByIdAndDelete(req.params.id);
        if (!device) {
            return res.status(404).json({ message: 'Device not found' });
        }

        res.status(200).json({ message: 'Device deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

module.exports = {
    createDevice,
    getDevices,
    getDeviceById,
    updateDevice,
    deleteDevice,
};
