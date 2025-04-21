const _ = require('lodash');
const { Types } = require('mongoose');
const Device = require('../models/device.model');
const User = require('../models/user.model');
const DeviceBooking = require('../models/deviceBooking.model');
const Response = require('../utils/response');
const {
    REGISTER_STATUS,
    PRIORITY_STATUS,
    isDevelopment,
    EDIT_REQUEST_STATUS,
    ROLES,
} = require('../config/constants');
const auditService = require('../services/audit.service');
const auditAction = require('../services/auditAction');
const QueryBuilder = require('../utils/queryBuilder');
const { diffObjects } = require('../utils/diffs');

// Tạo yêu cầu đăng ký thiết bị
const createDeviceBooking = async (req, res) => {
    try {
        const {
            deviceId,
            codeBA,
            nameBA,
            usageTime,
            usageDay,
            status,
            priority,
            purpose,
        } = req.body;

        const userId = req.user.sub;

        // Kiểm tra user tồn tại
        const user = await User.findById(userId);
        if (!user) {
            return Response.notFound(res, 'Không tìm thấy người dùng');
        }

        // Kiểm tra thiết bị tồn tại
        const device = await Device.findById(deviceId);
        if (!device) {
            return Response.notFound(res, 'Không tìm thấy thiết bị');
        }

        // Kiểm tra xem có đăng ký nào trùng thời gian không
        const existingBooking = await DeviceBooking.findOne({
            deviceId,
            usageDay,
            usageTime,
            status: { $ne: REGISTER_STATUS.REJECT },
        });

        // Nếu có đăng ký trùng thời gian và không phải là ưu tiên
        if (existingBooking && priority !== PRIORITY_STATUS.PRIORITY) {
            return Response.error(
                res,
                'Khung giờ này đã được đăng ký cho thiết bị này',
                400
            );
        }

        // Tạo đăng ký mới
        const booking = new DeviceBooking({
            deviceId,
            deviceName: device.name,
            userId,
            accountName: user.name,
            group: user.group,
            codeBA,
            nameBA,
            usageTime,
            usageDay,
            priority,
            purpose,
            status,
        });

        await booking.save();

        const auditData = auditService.formatCreateJSON({
            resourceType: 'đơn đăng ký thiêt bị',
            detail: booking.toObject(),
            performedBy: req.user.name,
        });
        auditService.prepareAudit(
            req,
            auditAction.actionList.CREATE_DEVICE_BOOKING,
            auditData.message,
            auditData.details
        );

        return Response.success(
            res,
            'Tạo đơn đăng ký thiết bị thành công',
            { booking },
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

// Lấy danh sách đơn đăng ký thiết bị
const getDeviceBookings = async (req, res) => {
    try {
        const bookings = await new QueryBuilder(DeviceBooking, req.query)
            .filter()
            .sort()
            .populate([
                { path: 'deviceId', select: 'name location' },
                { path: 'userId', select: 'name email group' },
            ])
            .paginate()
            .exec();

        const { data, meta } = bookings;

        return Response.success(
            res,
            'Lấy danh sách đơn đăng ký thành công',
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

const getDeviceBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await DeviceBooking.findById(id);
        if (!booking) {
            return Response.notFound(res, 'Không tìm thấy đơn đăng ký');
        }
        return Response.success(
            res,
            'Lấy thông tin đơn đăng ký thành công',
            booking
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

// Thay đổi đơn thông tin đăng ký thiết bị
const updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.sub;
        const {
            deviceId,
            codeBA,
            nameBA,
            usageTime,
            usageDay,
            priority,
            status,
        } = req.body;

        const user = await User.findById(userId);
        if (!user) return Response.notFound(res, 'Không tìm thấy người dùng');

        const booking = await DeviceBooking.findById(id);
        if (!booking) {
            return Response.notFound(res, 'Không tìm thấy đơn đăng ký');
        }

        const oldData = {
            deviceId: booking.deviceId,
            codeBA: booking.codeBA,
            nameBA: booking.nameBA,
            usageTime: booking.usageTime,
            usageDay: booking.usageDay,
            priority: booking.priority,
            status: booking.status,
            editRequest: booking.editRequest,
        };

        const updates = _.pickBy(
            {
                deviceId:
                    deviceId && Types.ObjectId.isValid(deviceId)
                        ? new Types.ObjectId(deviceId)
                        : undefined,
                codeBA,
                nameBA,
                usageTime,
                usageDay: usageDay ? new Date(usageDay) : undefined,
                priority,
                status: status || REGISTER_STATUS.PENDING,
                editRequest:
                    user.role === ROLES.USER ? {} : booking.editRequest,
            },
            (value) => !_.isUndefined(value) && !_.isNull(value)
        );
        Object.assign(booking, updates);
        await booking.save();

        const changes = diffObjects(oldData, updates, [
            'deviceId',
            'codeBA',
            'nameBA',
            'usageTime',
            'usageDay',
            'priority',
            'status',
            'editRequest',
        ]);

        const auditData = auditService.formatUpdateJSON({
            resourceType: 'đơn đăng ký thiết bị',
            detail: { changes },
            performedBy: req.user.name,
        });

        auditService.prepareAudit(
            req,
            auditAction.actionList.UPDATE_DEVICE_BOOKING,
            auditData.message,
            auditData.details
        );

        return Response.success(res, 'Đã xử lý đơn đăng ký', { booking });
    } catch (error) {
        return Response.error(
            res,
            'Đã xảy ra lỗi không xác định',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Danh sách các đơn đăng ký của thiết bị
const listDeviceBookings = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const queryParams = {
            ...req.query,
            deviceId,
        };

        const bookings = await new QueryBuilder(DeviceBooking, queryParams)
            .filter()
            .populate([
                { path: 'deviceId', select: 'name location' },
                { path: 'userId', select: 'name email group' },
            ])
            .sort()
            .paginate()
            .exec();

        const { data, meta } = bookings;

        return Response.success(
            res,
            'Lấy danh sách đơn của thiết bị thành công',
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

// Lịch sử đăng ký thiết bị của người dùng
const listUserBookings = async (req, res) => {
    try {
        const { userId } = req.params;
        const queryParams = {
            ...req.query,
            userId,
        };

        const bookings = await new QueryBuilder(DeviceBooking, queryParams)
            .filter()
            .populate([
                { path: 'deviceId', select: 'name location' },
                { path: 'userId', select: 'name email group' },
            ])
            .sort()
            .paginate()
            .exec();

        const { data, meta } = bookings;

        return Response.success(
            res,
            'Lấy lịch sử đăng ký của người dùng thành công',
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

// Admin xử lý đơn đăng ký
const approverBooking = async (req, res) => {
    try {
        const { bookingId, status, note } = req.body;
        const userId = req.user?.sub;

        const user = await User.findById(userId);
        if (!user) return Response.notFound(res, 'Không tìm thấy người dùng');

        const booking = await DeviceBooking.findById(bookingId);
        if (!booking) {
            return Response.notFound(res, 'Không tìm thấy đơn đăng ký');
        }

        booking.status = status;
        if (note) booking.note = note;
        await booking.save();

        const auditData = auditService.formatCreateJSON({
            resourceType: `${status}`,
            detail: status,
            performedBy: req.user.name,
        });

        auditService.prepareAudit(
            req,
            auditAction.actionList.PROCESS_DEVICE_BOOKING,
            auditData.message,
            auditData.details
        );

        return Response.success(res, `Đã ${status} đơn đăng ký`, { note });
    } catch (error) {
        return Response.error(
            res,
            'Đã xảy ra lỗi không xác định',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Yêu cầu chỉnh sửa đơn đăng ký của user
const requestBookingEdit = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { reason } = req.body;
        const userId = req.user.sub;

        const booking = await DeviceBooking.findById(bookingId);
        if (!booking) {
            return Response.notFound(res, 'Không tìm thấy đơn đăng ký');
        }

        // Kiểm tra xem người dùng có phải là người tạo đơn không
        if (booking.userId.toString() !== userId) {
            return Response.error(
                res,
                'Unauthorized to edit this booking',
                403
            );
        }
        // Kiểm tra xem đơn có đang chờ duyệt không
        if (booking.status !== REGISTER_STATUS.PENDING) {
            return Response.error(
                res,
                'Cannot edit booking that is not pending approval',
                400
            );
        }

        // Cập nhật thông tin chỉnh sửa
        booking.editRequest = {
            requestedBy: userId,
            status: EDIT_REQUEST_STATUS.PENDING,
            requestedAt: new Date(),
            reason: reason,
        };
        await booking.save();

        const auditData = auditService.formatCreateJSON({
            resourceType: 'yêu cầu chỉnh sửa đơn đăng ký thiết bị',
            detail: booking.editRequest,
            performedBy: req.user.name,
        });
        auditService.prepareAudit(
            req,
            auditAction.actionList.REQUEST_BOOKING_EDIT,
            auditData.message,
            auditData.details
        );

        return Response.success(res, 'Edit request submitted successfully', {
            editRequest: booking.editRequest,
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

// Xử lý yêu cầu chỉnh sửa của user, người cho phép: approver | admin
const processEditRequest = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { action, approverNote } = req.body;
        const approverId = req.user.sub;

        const booking = await DeviceBooking.findById(bookingId);
        if (!booking) {
            return Response.notFound(res, 'Không tìm thấy đơn đăng ký');
        }

        if (!booking.editRequest) {
            return Response.error(
                res,
                'No edit request found for this booking'
            );
        }

        if (action === 'accept') {
            booking.editRequest.status = EDIT_REQUEST_STATUS.ACCEPTED;
            booking.editRequest.processedBy = approverId;
            booking.editRequest.processedAt = new Date();
            booking.editRequest.approverNote = approverNote;
        } else if (action === 'reject') {
            booking.editRequest.status = EDIT_REQUEST_STATUS.REJECTED;
            booking.editRequest.processedBy = approverId;
            booking.editRequest.processedAt = new Date();
            booking.editRequest.approverNote = approverNote;
        }

        await booking.save();

        const auditData = auditService.formatCreateJSON({
            resourceType: 'duyệt yêu cầu chỉnh sửa đơn đăng ký thiết bị',
            detail: booking.editRequest,
            performedBy: req.user.name,
        });

        auditService.prepareAudit(
            req,
            auditAction.actionList.PROCESS_EDIT_REQUEST,
            auditData.message,
            auditData.details
        );

        return Response.success(res, 'Edit request processed successfully', {
            editRequest: booking.editRequest,
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
    createDeviceBooking,
    getDeviceBookings,
    getDeviceBookingById,
    updateBooking,
    listDeviceBookings,
    listUserBookings,
    approverBooking,
    requestBookingEdit,
    processEditRequest,
};
