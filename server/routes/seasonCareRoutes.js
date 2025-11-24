const express = require('express');
const router = express.Router();
const seasonCareController = require('../controllers/seasonCareController');

// 고객 목록 조회 (최적화됨) - /:id보다 먼저 와야 함!
router.get('/customers', seasonCareController.getCustomerList);

// 샘플 데이터 생성 (극한 테스트용) - /:id보다 먼저 와야 함!
router.post('/generate-sample-data', seasonCareController.generateSampleData);

// 모든 데이터 초기화 (극한 테스트용) - /:id보다 먼저 와야 함!
router.delete('/clear-all-data', seasonCareController.clearAllData);

// 시즌케어 서비스 추가 (횟수 차감)
router.post('/add-service', seasonCareController.addService);

// 고객 정보 수정 (전화번호 기준으로 모든 시즌케어의 고객정보 변경)
router.put('/customer/update', seasonCareController.updateCustomerInfo);

// 특정 고객의 시즌케어 조회 (ID 기준)
router.get('/customer/:customerId', seasonCareController.getSeasonCaresByCustomer);

// 모든 시즌케어 조회
router.get('/', seasonCareController.getAllSeasonCares);

// 특정 시즌케어 조회
router.get('/:id', seasonCareController.getSeasonCareById);

// 시즌케어 등록
router.post('/', seasonCareController.createSeasonCare);

// 시즌케어 수정
router.put('/:id', seasonCareController.updateSeasonCare);

// 시즌케어 삭제
router.delete('/:id', seasonCareController.deleteSeasonCare);

module.exports = router;