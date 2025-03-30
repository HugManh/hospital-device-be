const express = require('express');
const router = express.Router();
const {
    register,
    login,
    logout,
    refreshToken,
    getProfile,
} = require('../../controllers/auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/refresh-token', refreshToken);
router.get('/profile', authenticate, getProfile);
router.get('/logout', logout);

module.exports = router;
