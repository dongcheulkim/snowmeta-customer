const express = require('express');
const router = express.Router();
const fullSeasonCareController = require('../controllers/fullSeasonCareController');

// 특정 고객의 풀시즌케어 조회 (ID 기준)
router.get('/customer/:customerId', fullSeasonCareController.getFullSeasonCaresByCustomer);

// 모든 풀시즌케어 조회
router.get('/', fullSeasonCareController.getAllFullSeasonCares);

// 특정 풀시즌케어 조회
router.get('/:id', fullSeasonCareController.getFullSeasonCareById);

// 풀시즌케어 등록
router.post('/', fullSeasonCareController.createFullSeasonCare);

// 풀시즌케어 수정
router.put('/:id', fullSeasonCareController.updateFullSeasonCare);

// 풀시즌케어 삭제
router.delete('/:id', fullSeasonCareController.deleteFullSeasonCare);

module.exports = router;
