require('dotenv').config();
const express = require('express');
const connectDB = require('./src/config/mongo.config');
const authRoutes = require('./src/routes/auth.route');

const app = express();

// Kết nối MongoDB
connectDB();

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
