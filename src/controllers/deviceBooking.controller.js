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

        const auditData = await auditService.formatInfoJSON({
            modelName: 'DeviceBooking',
            detail: _.omit(booking.toObject(), ['deviceId', 'userId']),
        });
        auditService.prepareAudit(
            req,
            auditAction.actionList.CREATE_DEVICE_BOOKING,
            `"${req.user.name}" đã tạo đơn đăng ký thiết bị`,
            auditData
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

        const booking = await DeviceBooking.findById(id).populate([
            { path: 'deviceId', select: 'name location' },
        ]);
        if (!booking) {
            return Response.notFound(res, 'Không tìm thấy đơn đăng ký');
        }

        const device = await Device.findById(deviceId);
        if (!device) {
            return Response.notFound(res, 'Không tìm thấy thiết bị');
        }

        console.log('fdff', booking);

        const oldData = {
            deviceId: booking.deviceId?.id,
            deviceName: booking.deviceId?.name,
            codeBA: booking.codeBA,
            nameBA: booking.nameBA,
            usageTime: booking.usageTime,
            usageDay: booking.usageDay,
            priority: booking.priority,
            status: booking.status,
        };

        const updates = _.pickBy(
            {
                deviceId:
                    deviceId && Types.ObjectId.isValid(deviceId)
                        ? new Types.ObjectId(deviceId)
                        : undefined,
                deviceName: device.name,
                codeBA,
                nameBA,
                usageTime,
                usageDay: usageDay ? new Date(usageDay) : undefined,
                priority,
                status: status || REGISTER_STATUS.PENDING,
                ...(user.role === ROLES.USER && { editRequest: {} }),
            },
            (value) => !_.isUndefined(value) && !_.isNull(value)
        );
        Object.assign(booking, updates);
        await booking.save();

        const changes = diffObjects(oldData, updates, [
            'deviceName',
            'codeBA',
            'nameBA',
            'usageTime',
            'usageDay',
            'priority',
            'status',
        ]);

        const auditData = await auditService.formatUpdateJSON({
            modelName: 'DeviceBooking',
            detail: { changes },
        });

        auditService.prepareAudit(
            req,
            auditAction.actionList.UPDATE_DEVICE_BOOKING,
            `"${req.user.name}" đã cập nhật đơn đăng ký thiết bị`,
            auditData
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

        const auditData = await auditService.formatInfoJSON({
            modelName: 'DeviceBooking',
            detail: _.omit(booking.toObject(), ['editRequest']),
        });

        console.log('PROCESS_DEVICE_BOOKING', auditData);

        auditService.prepareAudit(
            req,
            auditAction.actionList.PROCESS_DEVICE_BOOKING,
            `"${req.user.name}" đã xử lý đơn đăng ký thiết bị`,
            auditData
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
        const { sub: id, name } = req.user;
        console.log(id, name);
        console.log(bookingId);

        const booking = await DeviceBooking.findById(bookingId);
        if (!booking) {
            return Response.notFound(res, 'Không tìm thấy đơn đăng ký');
        }

        console.log(id, name);
        // Kiểm tra xem người dùng có phải là người tạo đơn không
        if (booking.userId.toString() !== id) {
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
        const editRequest = {
            requesterId: id,
            requesterName: name || '',
            status: EDIT_REQUEST_STATUS.PENDING,
            requestedAt: new Date(),
            reason: reason,
        };

        console.log(editRequest);

        booking.editRequest = editRequest;

        await booking.save();

        const auditData = await auditService.formatInfoJSON({
            modelName: 'editRequest',
            detail: _.omit(editRequest, ['requesterId']),
        });
        console.log('-- auditData ', auditData);
        auditService.prepareAudit(
            req,
            auditAction.actionList.REQUEST_BOOKING_EDIT,
            `"${req.user.name}" đã yêu cầu chỉnh sửa đơn đăng ký thiết bị`,
            auditData
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
        const { sub: id, name } = req.user;

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

        console.log('booking.editRequest', booking.editRequest);

        booking.editRequest = {
            ...booking.editRequest, // giữ lại dữ liệu cũ
            approverId: id,
            approverName: name || '',
            processedAt: new Date(),
            approverNote,
            status:
                action === 'accept'
                    ? EDIT_REQUEST_STATUS.ACCEPTED
                    : EDIT_REQUEST_STATUS.REJECTED,
        };

        console.log(booking.editRequest);

        await booking.save();

        const auditData = await auditService.formatInfoJSON({
            modelName: 'editRequest',
            detail: _.omit(booking.editRequest.toObject(), [
                'approverId',
                'requesterId',
            ]),
        });
        console.log('-- auditData ', auditData);

        auditService.prepareAudit(
            req,
            auditAction.actionList.PROCESS_EDIT_REQUEST,
            `"${req.user.name}" đã xử lý yêu cầu chỉnh sửa`,
            auditData
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
