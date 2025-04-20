const winston = require('winston');
const { combine, timestamp, printf, colorize } = winston.format;
const { isDevelopment } = require('../config/constants');
const dotenv = require('dotenv');
dotenv.config();

// date + logger level + message

class LoggerService {
    constructor(label = 'app') {
        this.label = label;
        const logFormat = printf((info) => {
            let message = `${info.timestamp} [${info.level}] [${label}]: ${info.message}`;
            if (info.obj) {
                message += ` | data: ${JSON.stringify(info.obj)}`;
            }
            return message;
        });

        const logger = winston.createLogger({
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
            format: combine(
                timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss',
                })
            ),
            transports: [
                new winston.transports.Console({
                    format: combine(colorize(), logFormat),
                }),
                ...(isDevelopment
                    ? [
                          new winston.transports.File({
                              format: combine(logFormat),
                              filename: 'logs/hospital.log',
                          }),
                      ]
                    : []),
            ],
        });
        this.logger = logger;
    }

    info(message, obj = null) {
        this.logger.log('info', message, { obj });
    }

    error(message, obj = null) {
        this.logger.log('error', message, { obj });
    }

    debug(message, obj = null) {
        this.logger.log('debug', message, { obj });
    }

    event(message, obj = null) {
        this.logger.log('http', message, { obj });
    }
}

module.exports = LoggerService;
