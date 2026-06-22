const winston = require('winston');
const path = require('path');
const fs = require('fs');

const isVercel = !!process.env.VERCEL;

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message}`
  )
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      format
    ),
  }),
];

if (!isVercel) {
  const logDir = path.join(__dirname, '../../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(winston.format.uncolorize(), format),
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'access.log'),
      format: winston.format.combine(winston.format.uncolorize(), format),
    })
  );
}

const logger = winston.createLogger({
  level: (process.env.NODE_ENV === 'production' || isVercel) ? 'info' : 'debug',
  levels,
  format,
  transports,
});

module.exports = logger;
