const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// 모든 메시지 조회
router.get('/', messageController.getAllMessages);

// 모든 메시지 데이터 삭제 - /:id보다 먼저 와야 함!
router.delete('/clear-all-data', messageController.clearAllData);

// 특정 메시지 조회
router.get('/:id', messageController.getMessageById);

// 메시지 전송
router.post('/', messageController.createMessage);

// 메시지 삭제
router.delete('/:id', messageController.deleteMessage);

module.exports = router;
