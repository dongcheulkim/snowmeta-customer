const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

// 시합일정 관련 라우트
router.get('/', scheduleController.getAllSchedules);
router.get('/date-range', scheduleController.getSchedulesByDateRange);
router.get('/type/:type', scheduleController.getSchedulesByType);
router.get('/:id', scheduleController.getScheduleById);
router.post('/', scheduleController.createSchedule);
router.put('/:id', scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);

module.exports = router;