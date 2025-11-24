const { body, param, query, validationResult } = require('express-validator');
const { logger, logSecurityEvent } = require('../utils/logger');

// 검증 결과 확인 미들웨어
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // 검증 실패 로깅
    logSecurityEvent('VALIDATION_FAILED', {
      errors: errors.array(),
      body: req.body,
      params: req.params,
      query: req.query
    }, req);

    return res.status(400).json({
      success: false,
      message: '입력값 검증에 실패했습니다.',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// 공통 검증 규칙들
const commonValidations = {
  // 이메일 검증
  email: body('email')
    .isEmail()
    .withMessage('올바른 이메일 형식이 아닙니다')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('이메일은 100자를 초과할 수 없습니다'),

  // 전화번호 검증 (한국 형식)
  phone: body('phone')
    .matches(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/)
    .withMessage('올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)')
    .isLength({ max: 20 })
    .withMessage('전화번호는 20자를 초과할 수 없습니다'),

  // 이름 검증
  name: body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('이름은 1-50자 사이여야 합니다')
    .matches(/^[가-힣a-zA-Z\s]+$/)
    .withMessage('이름은 한글, 영문, 공백만 포함할 수 있습니다'),

  // 주소 검증
  address: body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('주소는 200자를 초과할 수 없습니다'),

  // ID 파라미터 검증
  id: param('id')
    .isInt({ min: 1 })
    .withMessage('올바른 ID 형식이 아닙니다'),

  // 날짜 검증
  date: body('date')
    .isISO8601()
    .withMessage('올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)')
    .toDate(),

  // 가격 검증
  price: body('price')
    .isFloat({ min: 0 })
    .withMessage('가격은 0 이상의 숫자여야 합니다')
    .custom((value) => {
      if (value > 10000000) {
        throw new Error('가격은 천만원을 초과할 수 없습니다');
      }
      return true;
    }),

  // 텍스트 필드 검증 (일반)
  text: (fieldName, minLength = 1, maxLength = 500) =>
    body(fieldName)
      .trim()
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${fieldName}는 ${minLength}-${maxLength}자 사이여야 합니다`)
      .escape(), // XSS 방지

  // 선택적 텍스트 필드
  optionalText: (fieldName, maxLength = 500) =>
    body(fieldName)
      .optional()
      .trim()
      .isLength({ max: maxLength })
      .withMessage(`${fieldName}는 ${maxLength}자를 초과할 수 없습니다`)
      .escape()
};

// 고객 관련 검증
const customerValidations = {
  create: [
    commonValidations.name,
    commonValidations.email,
    commonValidations.phone,
    commonValidations.address,
    checkValidation
  ],

  update: [
    commonValidations.id,
    commonValidations.name,
    commonValidations.email,
    commonValidations.phone,
    commonValidations.address,
    checkValidation
  ],

  get: [
    commonValidations.id,
    checkValidation
  ],

  delete: [
    commonValidations.id,
    checkValidation
  ]
};

// 서비스 관련 검증
const serviceValidations = {
  create: [
    commonValidations.text('customer_name', 1, 50),
    commonValidations.text('customer_phone', 1, 20),
    commonValidations.text('service_type', 1, 100),
    commonValidations.optionalText('service_details', 1000),
    commonValidations.price,
    commonValidations.date,
    commonValidations.optionalText('technician', 50),
    checkValidation
  ],

  update: [
    commonValidations.id,
    commonValidations.text('customer_name', 1, 50),
    commonValidations.text('customer_phone', 1, 20),
    commonValidations.text('service_type', 1, 100),
    commonValidations.optionalText('service_details', 1000),
    commonValidations.price,
    commonValidations.date,
    commonValidations.optionalText('technician', 50),
    checkValidation
  ]
};

// 시즌케어 관련 검증
const seasonCareValidations = {
  create: [
    commonValidations.text('customer_name', 1, 50),
    commonValidations.text('customer_phone', 1, 20),
    body('package_type')
      .isIn(['5회+왁싱', '10회+1회'])
      .withMessage('패키지 타입은 "5회+왁싱" 또는 "10회+1회"만 선택 가능합니다'),
    commonValidations.optionalText('notes', 500),
    checkValidation
  ]
};


// SQL 인젝션 방지를 위한 추가 검증
const sanitizeInput = (req, res, next) => {
  const suspiciousPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i,
    /exec\s*\(/i,
    /script\s*>/i,
    /<\s*script/i
  ];

  const checkObject = (obj, path = '') => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(obj[key])) {
            logSecurityEvent('SQL_INJECTION_ATTEMPT', {
              field: `${path}${key}`,
              value: obj[key],
              pattern: pattern.toString()
            }, req);

            return res.status(400).json({
              success: false,
              message: '허용되지 않는 문자가 포함되어 있습니다.'
            });
          }
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        const result = checkObject(obj[key], `${path}${key}.`);
        if (result) return result;
      }
    }
  };

  checkObject(req.body, 'body.');
  checkObject(req.query, 'query.');
  checkObject(req.params, 'params.');

  next();
};

module.exports = {
  checkValidation,
  commonValidations,
  customerValidations,
  serviceValidations,
  seasonCareValidations,
  sanitizeInput
};