const express = require('express');
const router = express.Router();
const {
    addDevice,
    getDevices,
    getDeviceById,
    updateDevice,
    deleteDevice,
} = require('../../controllers/device.controller');
const { authorizeRoles } = require('../../middleware/auth.middleware');
const { ROLES } = require('../../config/constants');

router.post('/', authorizeRoles([ROLES.ADMIN]), addDevice);
router.get(
    '/',
    authorizeRoles([ROLES.USER, ROLES.APPROVER, ROLES.ADMIN]),
    getDevices
);
router.get(
    '/:id',
    authorizeRoles([ROLES.USER, ROLES.APPROVER, ROLES.ADMIN]),
    getDeviceById
);
router.put('/:id', authorizeRoles([ROLES.ADMIN]), updateDevice);
router.delete('/:id', authorizeRoles([ROLES.ADMIN]), deleteDevice);

module.exports = router;
