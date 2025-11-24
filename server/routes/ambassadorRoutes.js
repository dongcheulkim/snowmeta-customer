const express = require('express');
const router = express.Router();
const ambassadorController = require('../controllers/ambassadorController');

// 모든 앰버서더 정비내역 조회
router.get('/', ambassadorController.getAllAmbassadors);

// 고객 목록 조회 (최적화됨) - /:id보다 먼저 와야 함!
router.get('/customers', ambassadorController.getCustomerList);

// 모든 앰버서더 정비내역 데이터 삭제 - /:id보다 먼저 와야 함!
router.delete('/clear-all-data', ambassadorController.clearAllData);

// 특정 앰버서더 정비내역 조회
router.get('/:id', ambassadorController.getAmbassadorById);

// 특정 고객의 앰버서더 정비내역 조회
router.get('/customer/:customerId', ambassadorController.getAmbassadorsByCustomer);

// 앰버서더 정비내역 등록
router.post('/', ambassadorController.createAmbassador);

// 앰버서더 정비내역 수정
router.put('/:id', ambassadorController.updateAmbassador);

// 앰버서더 정비내역 삭제
router.delete('/:id', ambassadorController.deleteAmbassador);

// 고객 정보 수정 (전화번호 기준으로 모든 앰버서더 정비내역의 고객정보 변경)
router.put('/customer/update', ambassadorController.updateCustomerInfo);

module.exports = router;