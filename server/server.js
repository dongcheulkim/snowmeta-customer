const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const customerRoutes = require('./routes/customerRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const seasonCareRoutes = require('./routes/seasonCareRoutes');
const fullSeasonCareRoutes = require('./routes/fullSeasonCareRoutes');
const promoAthleteRoutes = require('./routes/promoAthleteRoutes');
const ambassadorRoutes = require('./routes/ambassadorRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const messageRoutes = require('./routes/messageRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5006;

// 보안 헤더 설정
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));
} else {
  // 개발 환경에서는 CSP 비활성화
  app.use(helmet({
    contentSecurityPolicy: false
  }));
}

// Rate Limiting (개발 환경에서는 비활성화)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15분
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // 최대 100개 요청
    message: {
      error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);
}

// CORS 설정
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // 개발 환경에서는 origin이 없는 요청(Postman 등) 허용
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('CORS 정책에 의해 차단되었습니다.'));
    }
  },
  credentials: true, // 쿠키 전송 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// UTF-8 인코딩 설정을 최우선으로
app.use(express.json({
  limit: '10mb',
  strict: false
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// Content-Type과 charset 설정
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// JSON 파싱 에러 처리 미들웨어
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      error: '잘못된 JSON 형식입니다. 특수문자나 형식을 확인해주세요.'
    });
  }
  next(error);
});

app.use('/api/customers', customerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/season-care', seasonCareRoutes);
app.use('/api/full-season-care', fullSeasonCareRoutes);
app.use('/api/promo-athletes', promoAthleteRoutes);
app.use('/api/ambassadors', ambassadorRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/users', userRoutes);

// 프로덕션 환경에서 React 빌드 파일 제공
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../client/build');
  app.use(express.static(buildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: '스노우메타 고객관리 API 서버가 실행중입니다.' });
  });
}

// HTTPS 서버 설정 (운영 환경)
function startServer() {

  if (process.env.ENABLE_HTTPS === 'true' && process.env.SSL_CERT_PATH && process.env.SSL_KEY_PATH) {
    try {
      const httpsOptions = {
        cert: fs.readFileSync(process.env.SSL_CERT_PATH),
        key: fs.readFileSync(process.env.SSL_KEY_PATH)
      };

      https.createServer(httpsOptions, app).listen(PORT, () => {
        console.log(`🔒 HTTPS 서버가 포트 ${PORT}에서 실행중입니다.`);
        console.log(`🌐 환경: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔐 보안 기능: 활성화됨`);
      });
    } catch (error) {
      console.error('❌ HTTPS 서버 시작 실패:', error.message);
      console.log('🔄 HTTP 서버로 대체 실행...');
      startHttpServer();
    }
  } else {
    startHttpServer();
  }
}

function startHttpServer() {
  app.listen(PORT, () => {
    console.log(`🌐 HTTP 서버가 포트 ${PORT}에서 실행중입니다.`);
    console.log(`📍 환경: ${process.env.NODE_ENV || 'development'}`);
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️  운영 환경에서는 HTTPS 사용을 권장합니다.');
    }
  });
}

// 우아한 종료 처리
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM 신호 수신. 서버를 우아하게 종료합니다...');
  // 여기에 정리 로직 추가 (DB 연결 종료 등)
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT 신호 수신. 서버를 우아하게 종료합니다...');
  process.exit(0);
});

// Vercel에서는 app export, 로컬에서는 서버 시작
if (process.env.VERCEL) {
  module.exports = app;
} else {
  startServer();
}