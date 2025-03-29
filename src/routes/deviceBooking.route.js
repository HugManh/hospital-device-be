const express = require('express');
const router = express.Router();
const { createUser } = require('../controllers/user.controller');
const {
    authenticate,
    authorizeRoles,
} = require('../middleware/auth.middleware');
const { ROLES } = require('../config/contants');

router.use(authenticate);

router.post(
    '/devices/:deviceID',
    authenticate,
    authorizeRoles([ROLES.ADMIN]),
    createUser
);
router.get(
    '/devices/:deviceID',
    authenticate,
    authorizeRoles([ROLES.ADMIN]),
    createUser
);
router.post(
    '/users/:userID',
    authenticate,
    authorizeRoles([ROLES.ADMIN]),
    createUser
);
router.get(
    '/users/:userID',
    authenticate,
    authorizeRoles([ROLES.ADMIN]),
    createUser
);

module.exports = router;
