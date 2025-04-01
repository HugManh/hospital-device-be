export const ROLES = {
    ADMIN: 'admin',
    APPROVER: 'approver',
    USER: 'user',
};

export const REGISTER_STATUS = {
    APPROVER: 'Duyệt',
    PENDING: 'Chờ duyệt',
    COMPLETED: 'Hoàn thành',
};

export const PRIORITY_STATUS = {
    NORMAL: 'Bình thường',
    PRIORITY: 'Ưu tiên',
};

export const isDevelopment = process.env.NODE_ENV === 'development';
