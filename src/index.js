require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const connectDB = require('./config/mongo.config');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger.config');

// Routes
const authRoute = require('./routes/auth.route');
const userRoute = require('./routes/user.route');
const deviceRoute = require('./routes/device.route');

const app = express();

// Kết nối MongoDB
connectDB();

// Cấu hình CORS
app.use(
    cors({
        origin: '*', // Các domain được phép truy cập
        methods: ['GET', 'POST', 'PUT', 'DELETE'], // Các method được phép sử dụng
        allowedHeaders: ['Content-Type', 'Authorization'], // Các header được phép sử dụng
        // credentials: true, // Cho phép gửi cookie nếu cần
    })
);

// Middleware
app.use(express.json()); // For parsing JSON data
app.use(express.urlencoded({ extended: true })); // For parsing URL-encoded form data
app.use(cookieParser());
if (process.env.NODE_ENV === 'development')
    app.use(morgan(':method :url :status :response-time ms'));

// Routes
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/devices', deviceRoute);

// Swagger UI
if (process.env.NODE_ENV === 'development')
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Route mặc định
app.get('/', (req, res) => {
    res.json({ message: 'Who are you?' });
});

// Xử lý lỗi 404
app.use((req, res, next) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Xử lý lỗi toàn cục
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    if (process.env.NODE_ENV === 'development')
        console.log(`API docs available at http://localhost:${PORT}/api-docs`);
});
