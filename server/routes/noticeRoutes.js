const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');

// 모든 공지사항 조회
router.get('/', noticeController.getAllNotices);

// ID로 공지사항 조회
router.get('/:id', noticeController.getNoticeById);

// 공지사항 생성
router.post('/', noticeController.createNotice);

// 공지사항 수정
router.put('/:id', noticeController.updateNotice);

// 공지사항 삭제
router.delete('/:id', noticeController.deleteNotice);

// 모든 데이터 초기화 (개발/테스트용)
router.post('/clear-all', noticeController.clearAllData);

module.exports = router;
