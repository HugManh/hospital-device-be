const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const secretKey = process.env.JWT_SECRET;

// Đăng ký
const register = async (req, res) => {
    const { email, name, password } = req.body;

    try {
        // Kiểm tra user đã tồn tại chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists!' });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, name, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Đăng nhập
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Tìm user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create access token
        const accessToken = jwt.sign(
            { email: user.email, id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Create refresh token
        const refreshToken = jwt.sign(
            { email: user.email, id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '2d' }
        );

        // Lưu refresh token vào database (nếu cần quản lý)
        user.refreshToken = refreshToken;
        await user.save();

        // Create access token cookie
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        // Create refresh token cookie that is only sent in requests to /refresh
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Login successful
        res.json({ message: 'Login successful', accessToken });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Đăng xuất
const logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
        await User.updateOne({ refreshToken }, { $unset: { refreshToken: 1 } });
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logout successful' });
};

/**
 * Handle the refresh token. Needs to be before the authentication
 * middleware so we can get a new access token when the refresh token
 * has expired
 */
const refreshToken = (req, res) => {
    console.log('Obtaining new access token with the refresh token');
    // Get the refresh token, will only be present on /refresh call
    const refreshToken = req.cookies.refreshToken; // Lấy token mới từ cookie
    if (!refreshToken) {
        return res
            .status(401)
            .send('Access Denied. No refresh token provided.');
    }

    // Create a new access token and set it on the cookie
    try {
        const decoded = jwt.verify(refreshToken, secretKey);
        const accessToken = jwt.sign({ user: decoded.user }, secretKey, {
            expiresIn: '1h',
        });
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        res.send(decoded.user);
    } catch (error) {
        console.log('Invalid refresh token');
        res.clearCookie('refreshToken');
        return res.status(400).send('Invalid refresh token.');
    }
};

module.exports = { register, login, logout, refreshToken };
