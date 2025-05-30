const express = require('express');
const router = express.Router();
const {
    authorizeRoles,
    authenticate,
} = require('../../middleware/auth.middleware');
const { ROLES } = require('../../config/constants');
const {
    getAudits,
    getAuditById,
} = require('../../controllers/audit.controller');

router.use(authenticate);
router.get('/', authorizeRoles([ROLES.ADMIN]), getAudits);
router.get('/:id', authorizeRoles([ROLES.ADMIN]), getAuditById);

module.exports = router;
