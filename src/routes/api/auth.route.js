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

router.use(authenticate);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);

module.exports = router;
