const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 로그인 - 인증 불필요 (토큰을 받기 위한 엔드포인트)
router.post('/login', userController.login);

// 모든 사용자 조회 - 관리자 권한 필요
router.get('/', authenticateToken, requireAdmin, userController.getAllUsers);

// ID로 사용자 조회 - 인증 필요
router.get('/:id', authenticateToken, userController.getUserById);

// 사용자 생성 - 관리자 권한 필요
router.post('/', authenticateToken, requireAdmin, userController.createUser);

// 비밀번호 변경 - 인증 필요
router.put('/:id/password', authenticateToken, userController.updatePassword);

// 사용자 정보 수정 - 관리자 권한 필요
router.put('/:id', authenticateToken, requireAdmin, userController.updateUser);

// 사용자 삭제 - 관리자 권한 필요
router.delete('/:id', authenticateToken, requireAdmin, userController.deleteUser);

module.exports = router;
