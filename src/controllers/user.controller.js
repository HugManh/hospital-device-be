const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

// Tạo mới user
const createUser = async (req, res) => {
    const { email, name, password } = req.body;
    console.log(email, name, password);

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, name, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Lấy danh sách user
const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Lấy thông tin user theo ID
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Cập nhật user
const updateUser = async (req, res) => {
    try {
        const { name, password } = req.body;
        const hashedPassword = password
            ? await bcrypt.hash(password, 10)
            : undefined;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, ...(hashedPassword && { password: hashedPassword }) },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Xóa user
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

module.exports = { createUser, getUsers, getUserById, updateUser, deleteUser };
