const express = require('express');
const router = express.Router();
const promoAthleteController = require('../controllers/promoAthleteController');

// 선수 목록 조회 (최적화됨) - /:id보다 먼저 와야 함!
router.get('/athletes', promoAthleteController.getAthleteList);

// 모든 데이터 초기화 (테스트용) - /:id보다 먼저 와야 함!
router.delete('/clear-all-data', promoAthleteController.clearAllData);

// 선수 정보 수정 (전화번호 기준으로 모든 기록의 선수정보 변경)
router.put('/athlete/update', promoAthleteController.updateAthleteInfo);

// 특정 선수의 기록 조회 (전화번호 기준)
router.get('/athlete/:athletePhone', promoAthleteController.getPromoAthletesByPhone);

// 모든 프로모션 선수 기록 조회
router.get('/', promoAthleteController.getAllPromoAthletes);

// 특정 프로모션 선수 기록 조회
router.get('/:id', promoAthleteController.getPromoAthleteById);

// 프로모션 선수 기록 등록
router.post('/', promoAthleteController.createPromoAthlete);

// 프로모션 선수 기록 수정
router.put('/:id', promoAthleteController.updatePromoAthlete);

// 프로모션 선수 기록 삭제
router.delete('/:id', promoAthleteController.deletePromoAthlete);

module.exports = router;