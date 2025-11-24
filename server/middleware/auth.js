const jwt = require('jsonwebtoken');

// JWT Secret (환경변수에서 가져오기)
const JWT_SECRET = process.env.JWT_SECRET || 'SnowMeta2024JWTSecretKey!@#$%^&*()';

// JWT 토큰 생성 함수
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    branchName: user.branch_name,
    isAdmin: user.is_admin === 1
  };

  // 토큰 유효기간: 24시간
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

// JWT 인증 미들웨어
const authenticateToken = (req, res, next) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN 형식

    if (!token) {
      return res.status(401).json({
        error: '인증 토큰이 필요합니다.',
        code: 'NO_TOKEN'
      });
    }

    // 토큰 검증
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: '토큰이 만료되었습니다. 다시 로그인해주세요.',
            code: 'TOKEN_EXPIRED'
          });
        }
        return res.status(403).json({
          error: '유효하지 않은 토큰입니다.',
          code: 'INVALID_TOKEN'
        });
      }

      // 검증된 사용자 정보를 req.user에 저장
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('인증 오류:', error);
    res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다.' });
  }
};

// 관리자 권한 검증 미들웨어
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      error: '관리자 권한이 필요합니다.',
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
};

module.exports = {
  generateToken,
  authenticateToken,
  requireAdmin
};
