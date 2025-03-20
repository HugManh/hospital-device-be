const mongoose = require('mongoose');

const clientOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

const connectDB = async () => {
    console.log('Connecting to MongoDB', process.env.MONGO_URI);
    try {
        await mongoose.connect(process.env.MONGO_URI, clientOptions);
        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log('Pinged your deployment. You successfully connected to MongoDB!');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
