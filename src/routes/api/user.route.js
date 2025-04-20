const express = require('express');
const router = express.Router();
const {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    resetPassword,
} = require('../../controllers/user.controller');
const { authorizeRoles } = require('../../middleware/auth.middleware');
const { ROLES } = require('../../config/constants');

router.post('/', authorizeRoles([ROLES.ADMIN]), createUser);
router.get('/', authorizeRoles([ROLES.ADMIN]), getUsers);
router.get('/:id', authorizeRoles([ROLES.ADMIN]), getUserById);
router.put('/:id', authorizeRoles([ROLES.ADMIN]), updateUser);
router.delete('/:id', authorizeRoles([ROLES.ADMIN]), deleteUser);
router.post(
    '/:id/reset-password',
    authorizeRoles([ROLES.ADMIN]),
    resetPassword
);

module.exports = router;
