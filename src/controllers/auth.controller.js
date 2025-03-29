const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const secretKey = process.env.JWT_SECRET;

// Đăng ký
const register = async (req, res) => {
    const { email, name, password, role } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists!' });
        }

        const user = new User({ email, name, password, role });
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
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = User.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Tạo access token
        const accessToken = jwt.sign(
            {
                sub: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Tạo refresh token
        const refreshToken = jwt.sign(
            {
                sub: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: '2d' }
        );

        // Lưu refresh token vào database
        user.refreshToken = refreshToken;
        await user.save();

        // Trả accessToken và refreshToken trong response body
        res.json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Đăng xuất
const logout = async (req, res) => {
    // Lấy refreshToken từ body (do không dùng cookie nữa)
    const { refreshToken } = req.body;

    if (refreshToken) {
        // Xóa refresh token khỏi database
        await User.updateOne({ refreshToken }, { $unset: { refreshToken: 1 } });
    }

    // Không cần clearCookie nữa, chỉ thông báo đăng xuất thành công
    res.json({ message: 'Logout successful' });
};

// Làm mới token
const refreshToken = (req, res) => {
    // Lấy refreshToken từ body (do không dùng cookie)
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res
            .status(401)
            .json({ message: 'Access Denied. No refresh token provided.' });
    }

    try {
        // Xác minh refresh token
        const decoded = jwt.verify(refreshToken, secretKey);

        // Tạo access token mới
        const accessToken = jwt.sign(
            { email: decoded.email, id: decoded.id },
            secretKey,
            { expiresIn: '1h' }
        );

        // Trả accessToken trong response body
        res.json({
            message: 'Token refreshed successfully',
            accessToken,
        });
    } catch (error) {
        console.log('Invalid refresh token');
        return res.status(400).json({ message: 'Invalid refresh token.' });
    }
};

// Lấy thông tin profile
const getProfile = async (req, res) => {
    try {
        // Lấy ID người dùng từ token (sub)
        const userId = req.user.sub;
        const user = await User.findById(userId).select(
            '-password -refreshToken'
        ); // Loại bỏ mật khẩu và refreshToken

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Profile retrieved successfully',
            profile: {
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

module.exports = { register, login, logout, refreshToken, getProfile };
