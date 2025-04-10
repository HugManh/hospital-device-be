const mongoose = require('mongoose');
const LoggerService = require('../services/logger.service');

const clientOptions = {
    serverApi: { version: '1', strict: true, deprecationErrors: true },
};

const connectDB = async () => {
    const logger = new LoggerService('mongo.config');
    logger.debug('Connecting to MongoDB', process.env.MONGO_URI);
    try {
        await mongoose.connect(process.env.MONGO_URI, clientOptions);
        await mongoose.connection.db.admin().command({ ping: 1 });
        logger.info(
            'Pinged your deployment. You successfully connected to MongoDB!'
        );
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

module.exports = connectDB;
