const crypto = require('crypto');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const hashPassword = (password) => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

const generatePassword = (length = 16) => {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
};

module.exports = { hashPassword, generatePassword };
