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
            priority,
            purpose,
        } = req.body;

        const userId = req.user.sub;

        // Kiểm tra user tồn tại
        const user = await User.findById(userId);
        if (!user) {
            return Response.notFound(res, 'Người dùng không tồn tại.');
        }

        // Kiểm tra thiết bị tồn tại
        const device = await Device.findById(deviceId);
        if (!device) {
            return Response.notFound(res, 'Thiết bị không tồn tại');
        }

        // Kiểm tra xem có đăng ký nào trùng thời gian không
        const existingBooking = await DeviceBooking.findOne({
            deviceId,
            usageDay,
            usageTime,
            status: { $ne: REGISTER_STATUS.REJECTED },
        });

        // Nếu có đăng ký trùng thời gian và không phải là ưu tiên
        // if (existingBooking && priority !== PRIORITY_STATUS.PRIORITY) {
        //     return Response.error(
        //         res,
        //         'Khung giờ cho thiết bị này đã được đăng ký, yêu cầu độ ưu tiên cao hơn.',
        //         400
        //     );
        // }

        // Tạo đơn đăng ký mới
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
            status: REGISTER_STATUS.PENDING,
        });

        await booking.save();

        const auditData = await auditService.formatInfoJSON({
            modelName: 'DeviceBooking',
            detail: _.omit(booking.toObject(), ['deviceId', 'userId']),
        });
        auditService.prepareAudit(
            req,
            auditAction.actionList.CREATE_DEVICE_BOOKING,
            `[${req.user.name}] đã tạo đơn đăng ký thiết bị.`,
            auditData
        );

        return Response.success(
            res,
            'Đã tạo đơn đăng ký.',
            { booking },
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
            'Đã lấy danh sách đơn đăng ký.',
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

const getDeviceBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await DeviceBooking.findById(id);
        if (!booking) {
            return Response.notFound(res, 'Đơn đăng ký không tồn tại.');
        }
        return Response.success(
            res,
            'Đã lấy thông tin chi tiết đơn đăng ký.',
            booking
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

// Thay đổi đơn thông tin đăng ký thiết bị
const updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.sub;
        const { deviceId, codeBA, nameBA, usageTime, usageDay, priority } =
            req.body;

        const user = await User.findById(userId);
        if (!user) return Response.notFound(res, 'Người dùng không tồn tại');

        const booking = await DeviceBooking.findById(id).populate([
            { path: 'deviceId', select: 'name location' },
        ]);
        if (!booking) {
            return Response.notFound(res, 'Đơn đăng ký không tồn tại.');
        }

        const device = await Device.findById(deviceId);
        if (!device) {
            return Response.notFound(res, 'Thiết bị không tồn tại.');
        }

        const oldData = {
            deviceId: booking.deviceId?.id,
            deviceName: booking.deviceId?.name,
            codeBA: booking.codeBA,
            nameBA: booking.nameBA,
            usageTime: booking.usageTime,
            usageDay: booking.usageDay,
            priority: booking.priority,
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
        ]);

        const auditData = await auditService.formatUpdateJSON({
            modelName: 'DeviceBooking',
            detail: { changes },
        });

        auditService.prepareAudit(
            req,
            auditAction.actionList.UPDATE_DEVICE_BOOKING,
            `[${req.user.name}] đã cập nhật đơn đăng ký thiết bị.`,
            auditData
        );

        return Response.success(res, 'Đã cập nhật đơn đăng ký.', { booking });
    } catch (error) {
        return Response.error(
            res,
            'Lỗi hệ thống',
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
            'Lấy danh sách đơn của thiết bị thành công.',
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
            'Lấy lịch sử đăng ký của người dùng thành công.',
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

// Xử lý đơn đăng ký đang chờ duyệt
const approverBooking = async (req, res) => {
    try {
        const { id: bookingId } = req.params;
        const { status, note } = req.body;
        const userId = req.user?.sub;

        const user = await User.findById(userId);
        if (!user) return Response.notFound(res, 'Người dùng không tồn tại.');

        const booking = await DeviceBooking.findById(bookingId);
        if (!booking) {
            return Response.notFound(res, 'Đơn đăng ký không tồn tại.');
        }

        booking.status = status;
        if (note) booking.note = note;
        await booking.save();

        if (status === REGISTER_STATUS.APPROVED) {
            // Từ chối tất cả các đơn khác trùng thời gian và thiết bị
            await DeviceBooking.updateMany(
                {
                    deviceId: booking.deviceId,
                    usageTime: booking.usageTime,
                    usageDay: booking.usageDay,
                    _id: { $ne: booking.id }, // loại trừ đơn hiện tại
                },
                {
                    $set: {
                        status: REGISTER_STATUS.REJECTED,
                        note: `Đơn đăng ký thiết bị [${booking.deviceName}] đã bị từ chối do trùng lịch với một đơn đã được duyệt.`,
                    },
                }
            );
        }

        const auditData = await auditService.formatInfoJSON({
            modelName: 'DeviceBooking',
            detail: _.omit(booking.toObject(), ['editRequest']),
        });

        auditService.prepareAudit(
            req,
            auditAction.actionList.PROCESS_DEVICE_BOOKING,
            `[${req.user.name}] đã xử lý đơn đăng ký thiết bị.`,
            auditData
        );

        return Response.success(res, `Đã ${status} đơn đăng ký.`, { note });
    } catch (error) {
        return Response.error(
            res,
            'Lỗi hệ thống',
            500,
            isDevelopment ? error.message : null
        );
    }
};

// Yêu cầu chỉnh sửa đơn đăng ký của user
const requestBookingEdit = async (req, res) => {
    try {
        const { id: bookingId } = req.params;
        const { reason } = req.body;
        const { sub: id, name } = req.user;

        const booking = await DeviceBooking.findById(bookingId);
        if (!booking) {
            return Response.notFound(res, 'Đơn đăng ký không tồn tại.');
        }

        // Kiểm tra xem người dùng có phải là người tạo đơn không
        if (booking.userId.toString() !== id) {
            return Response.error(res, 'Bạn không có quyền hạn.', 403);
        }
        // Kiểm tra xem đơn có đang chờ duyệt không
        if (booking.status !== REGISTER_STATUS.PENDING) {
            return Response.error(res, 'Đơn đăng ký đã được duyệt.', 400);
        }

        // Cập nhật thông tin chỉnh sửa
        const editRequest = {
            requesterId: id,
            requesterName: name || '',
            status: EDIT_REQUEST_STATUS.PENDING,
            requestedAt: new Date(),
            reason: reason,
        };

        booking.editRequest = editRequest;

        await booking.save();

        const auditData = await auditService.formatInfoJSON({
            modelName: 'editRequest',
            detail: _.omit(editRequest, ['requesterId']),
        });
        auditService.prepareAudit(
            req,
            auditAction.actionList.REQUEST_BOOKING_EDIT,
            `[${req.user.name}] đã yêu cầu chỉnh sửa đơn đăng ký thiết bị.`,
            auditData
        );

        return Response.success(res, 'Đã gửi yêu cầu chỉnh sửa đơn.', {
            editRequest: booking.editRequest,
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

// Xử lý yêu cầu chỉnh sửa của user, người cho phép: approver | admin
const processEditRequest = async (req, res) => {
    try {
        const { id: bookingId } = req.params;
        const { action, approverNote } = req.body;
        const { sub: id, name } = req.user;

        const booking = await DeviceBooking.findById(bookingId);
        if (!booking) {
            return Response.notFound(res, 'Đơn đăng ký không tồn tại.');
        }

        if (!booking.editRequest) {
            return Response.error(res, 'Không có yêu cầu chỉnh sửa đơn.');
        }

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

        await booking.save();

        const auditData = await auditService.formatInfoJSON({
            modelName: 'editRequest',
            detail: _.omit(booking.editRequest.toObject(), [
                'approverId',
                'requesterId',
            ]),
        });

        auditService.prepareAudit(
            req,
            auditAction.actionList.PROCESS_EDIT_REQUEST,
            `[${req.user.name}] đã xử lý yêu cầu chỉnh sửa.`,
            auditData
        );

        return Response.success(res, 'Đã xử lý yêu cầu chỉnh sửa đơn.', {
            editRequest: booking.editRequest,
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
