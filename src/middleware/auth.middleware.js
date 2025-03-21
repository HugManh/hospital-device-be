const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;

const authenticate = (req, res, next) => {
    const accessToken = req.cookies['accessToken'];

    if (!accessToken) {
        return res.status(401).send('Unauthorized');
    }

    // Validate access token
    try {
        const decoded = jwt.verify(accessToken, secretKey);
        req.user = decoded.user;
        next();
    } catch (error) {
        console.log('Access token invalid, need to get a new one');
        res.clearCookie('accessToken');
        return res.status(401).send('Unauthorized');
    }
};

module.exports = { authenticate };
