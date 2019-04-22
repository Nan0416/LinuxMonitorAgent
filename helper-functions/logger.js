const winston = require('winston');
const { combine, timestamp, label, printf } = winston.format;
const myFormat = printf(({ level, message, label , timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});
const logger = winston.createLogger({
    level: 'info', // default level
    format: combine(
        label(),
        timestamp(),
        myFormat
      ),
    defaultMeta: { service: 'user-service' },
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'info.log' })
    ]
});
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.simple()
    }));
}
module.exports = logger;