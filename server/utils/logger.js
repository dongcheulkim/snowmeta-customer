const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// 로그 디렉토리 생성
const logDir = path.join(__dirname, '../logs');

// 로그 포맷 설정
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // 스택 트레이스가 있으면 추가
    if (stack) {
      log += `\n${stack}`;
    }

    // 추가 메타데이터가 있으면 추가
    if (Object.keys(meta).length > 0) {
      log += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// Daily Rotate File 설정
const dailyRotateFileTransport = new DailyRotateFile({
  filename: path.join(logDir, 'snowmeta-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat
});

const errorRotateFileTransport = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat
});

// Winston Logger 설정
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    dailyRotateFileTransport,
    errorRotateFileTransport
  ],
  // 처리되지 않은 예외 처리
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: logFormat
    })
  ],
  // 처리되지 않은 Promise rejection 처리
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: logFormat
    })
  ]
});

// 개발 환경에서는 콘솔에도 로그 출력
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, stack }) => {
        let log = `${timestamp} ${level}: ${message}`;
        if (stack) {
          log += `\n${stack}`;
        }
        return log;
      })
    )
  }));
}

// 로그 디렉토리 생성
const fs = require('fs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// HTTP 요청 로깅을 위한 미들웨어
const httpLogger = (req, res, next) => {
  const start = Date.now();
  const userAgent = req.get('User-Agent') || '';
  const ip = req.ip || req.connection.remoteAddress;

  // 응답 완료 시 로그 기록
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: ip,
      userAgent: userAgent.slice(0, 100), // User-Agent 길이 제한
      contentLength: res.get('Content-Length') || 0
    };

    // 상태 코드에 따라 로그 레벨 결정
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

// 보안 이벤트 로깅
const logSecurityEvent = (event, details = {}, req = null) => {
  const logData = {
    event: event,
    timestamp: new Date().toISOString(),
    ...details
  };

  if (req) {
    logData.ip = req.ip || req.connection.remoteAddress;
    logData.userAgent = req.get('User-Agent');
    logData.url = req.originalUrl;
  }

  logger.warn('Security Event', logData);
};

// 성능 모니터링 로깅
const logPerformance = (operation, duration, details = {}) => {
  logger.info('Performance', {
    operation: operation,
    duration: `${duration}ms`,
    ...details
  });
};

// 데이터베이스 작업 로깅
const logDatabase = (operation, table, details = {}) => {
  logger.info('Database', {
    operation: operation,
    table: table,
    ...details
  });
};

module.exports = {
  logger,
  httpLogger,
  logSecurityEvent,
  logPerformance,
  logDatabase
};