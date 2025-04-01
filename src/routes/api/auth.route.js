const express = require('express');
const router = express.Router();
const {
    register,
    login,
    logout,
    refreshToken,
    getProfile,
    updateProfile,
} = require('../../controllers/auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/refresh-token', refreshToken);
router.get('/profile', authenticate, getProfile);
router.put('/update-profile', authenticate, updateProfile);

module.exports = router;
