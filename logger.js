const winston = require('winston');
 
// Define the log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.simple()
);
 
// Create a Winston logger with multiple transports for different log levels
const logger = winston.createLogger({
  level: 'info', // Minimum log level to capture
  format: logFormat,
  transports: [
    // Log 'info' and above messages to a file
    new winston.transports.File({
      filename: "var/log/csye6225.log",// /var/log/webapp.log
      level: 'info',
    }),
 
    // Log 'error' and 'warning' messages to a separate file
    new winston.transports.File({
      filename: "var/log/csye6225.log",
      level: 'error',
    }),
 
    // Log 'warning' and above messages to the console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      level: 'warn',
    }),
  ],
});
 
module.exports = logger;