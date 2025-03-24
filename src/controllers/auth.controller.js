// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const User = require('../models/user.model');
// const secretKey = process.env.JWT_SECRET;

// // Đăng ký
// const register = async (req, res) => {
//     const { email, name, password } = req.body;

//     try {
//         // Kiểm tra user đã tồn tại chưa
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({ message: 'Email already exists!' });
//         }

//         // Mã hóa mật khẩu
//         const hashedPassword = await bcrypt.hash(password, 10);
//         const user = new User({ email, name, password: hashedPassword });
//         await user.save();

//         res.status(201).json({ message: 'User registered successfully' });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// };

// // Đăng nhập
// const login = async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         // Tìm user
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(400).json({ message: 'Invalid credentials' });
//         }

//         // Kiểm tra mật khẩu
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(400).json({ message: 'Invalid credentials' });
//         }

//         // Create access token
//         const accessToken = jwt.sign(
//             { sub: user._id, email: user.email, role: user.role },
//             process.env.JWT_SECRET,
//             { expiresIn: '1h' }
//         );

//         // Create refresh token
//         const refreshToken = jwt.sign(
//             { sub: user._id, email: user.email, role: user.role },
//             process.env.JWT_SECRET,
//             { expiresIn: '2d' }
//         );

//         // Lưu refresh token vào database (nếu cần quản lý)
//         user.refreshToken = refreshToken;
//         await user.save();

//         // Create access token cookie
//         res.cookie('accessToken', accessToken, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'production',
//             sameSite: 'strict',
//             maxAge: 60 * 60 * 1000, // 1 hour
//         });

//         // Create refresh token cookie that is only sent in requests to /refresh
//         res.cookie('refreshToken', refreshToken, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'production',
//             sameSite: 'strict',
//             maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//         });

//         // Login successful
//         res.json({ message: 'Login successful', accessToken });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// };

// // Đăng xuất
// const logout = async (req, res) => {
//     const refreshToken = req.cookies.refreshToken;

//     if (refreshToken) {
//         await User.updateOne({ refreshToken }, { $unset: { refreshToken: 1 } });
//     }

//     res.clearCookie('accessToken');
//     res.clearCookie('refreshToken');
//     res.json({ message: 'Logout successful' });
// };

// /**
//  * Handle the refresh token. Needs to be before the authentication
//  * middleware so we can get a new access token when the refresh token
//  * has expired
//  */
// const refreshToken = (req, res) => {
//     console.log('Obtaining new access token with the refresh token');
//     // Get the refresh token, will only be present on /refresh call
//     const refreshToken = req.cookies.refreshToken; // Lấy token mới từ cookie
//     if (!refreshToken) {
//         return res
//             .status(401)
//             .send('Access Denied. No refresh token provided.');
//     }

//     // Create a new access token and set it on the cookie
//     try {
//         const decoded = jwt.verify(refreshToken, secretKey);
//         const accessToken = jwt.sign({ user: decoded.user }, secretKey, {
//             expiresIn: '1h',
//         });
//         res.cookie('accessToken', accessToken, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'production',
//             sameSite: 'strict',
//             maxAge: 60 * 60 * 1000, // 1 hour
//         });

//         res.send(decoded.user);
//     } catch (error) {
//         console.log('Invalid refresh token');
//         res.clearCookie('refreshToken');
//         return res.status(400).send('Invalid refresh token.');
//     }
// };

// module.exports = { register, login, logout, refreshToken };

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const secretKey = process.env.JWT_SECRET;

// Đăng ký
const register = async (req, res) => {
    const { email, name, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists!' });
        }

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
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
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
