const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 모든 정비내역 조회 - 인증 필요
router.get('/', authenticateToken, serviceController.getAllServices);

// 고객 목록 조회 (최적화됨) - 인증 필요
router.get('/customers', authenticateToken, serviceController.getCustomerList);

// 모든 정비내역 데이터 삭제 - 관리자 권한 필요
router.delete('/clear-all-data', authenticateToken, requireAdmin, serviceController.clearAllData);

// 특정 정비내역 조회 - 인증 필요
router.get('/:id', authenticateToken, serviceController.getServiceById);

// 특정 고객의 정비내역 조회 - 인증 필요
router.get('/customer/:customerId', authenticateToken, serviceController.getServicesByCustomer);

// 정비내역 등록 - 인증 필요
router.post('/', authenticateToken, serviceController.createService);

// 정비내역 수정 - 인증 필요
router.put('/:id', authenticateToken, serviceController.updateService);

// 정비내역 삭제 - 인증 필요
router.delete('/:id', authenticateToken, serviceController.deleteService);

// 고객 정보 수정 - 인증 필요
router.put('/customer/update', authenticateToken, serviceController.updateCustomerInfo);

module.exports = router;