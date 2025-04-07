const express = require('express');
const router = express.Router();
const {
    register,
    login,
    logout,
    refreshToken,
    getProfile,
    updateProfile,
    updatePassword,
} = require('../../controllers/auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, updatePassword);

module.exports = router;
