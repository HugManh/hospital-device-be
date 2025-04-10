require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const connectDB = require('./config/mongo.config');
const swaggerUi = require('./docs/swagger-ui');

// Routes
const api = require('./routes/api');

const app = express();

// Kết nối MongoDB
connectDB();

app.disable('x-powered-by');
app.use(compression());
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
app.use('/api', api);
// Swagger UI
if (process.env.NODE_ENV === 'development') swaggerUi(app);

// Route mặc định
app.get('/', (req, res) => {
    res.json({ message: 'Who are you?' });
});

// Catch 404 and forward to error handler
app.use((req, res, next) => {
    const FAVICON_REGEX =
        /\/(favicon|(apple-)?touch-icon(-i(phone|pad))?(-\d{2,}x\d{2,})?(-precomposed)?)\.(jpe?g|png|ico|gif)$/i;
    if (FAVICON_REGEX.test(req.url)) {
        res.statusCode = 204;
        return res.end();
    }
    const err = new Error('Not Found: ' + req.method + ' - ' + req.originalUrl);
    err.status = 404;
    next(err);
});

// Error handler
app.use((err, req, res, next) => {
    // Render the error page
    if (err.status != 404) console.error('[ErrorHandler] err', err);
    res.status(err.status || 500).end(err.message);
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    if (process.env.NODE_ENV === 'development')
        console.log(`API docs available at http://localhost:${PORT}/api-docs`);
});
