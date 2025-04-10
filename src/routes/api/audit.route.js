const express = require('express');
const router = express.Router();
const {
    authorizeRoles,
    authenticate,
} = require('../../middleware/auth.middleware');
const { ROLES } = require('../../config/constants');
const { getAudit } = require('../../controllers/audit.controller');

router.use(authenticate);
router.use('/', authorizeRoles([ROLES.ADMIN]), getAudit);

module.exports = router;
