export const ROLES = {
    ADMIN: 'admin',
    APPROVER: 'approver',
    USER: 'user',
};

export const REGISTER_STATUS = {
    PENDING: 'pending_approval',
    APPROVED: 'approved',
    COMPLETED: 'completed',
    REJECTED: 'rejected',
};

export const PRIORITY_STATUS = {
    NORMAL: 'Bình thường',
    PRIORITY: 'Ưu tiên',
};

export const EDIT_REQUEST_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
};

export const isDevelopment = process.env.NODE_ENV === 'development';
