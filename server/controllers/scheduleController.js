const Schedule = require('../models/Schedule');

// 모든 시합일정 조회
const getAllSchedules = (req, res) => {
  try {    const schedules = Schedule.getAll();    res.json(schedules);
  } catch (error) {    res.status(500).json({ error: '시합일정 목록을 불러오는데 실패했습니다.' });
  }
};

// 특정 시합일정 조회
const getScheduleById = (req, res) => {
  try {
    const { id } = req.params;    const schedule = Schedule.getById(id);
    if (!schedule) {
      return res.status(404).json({ error: '시합일정을 찾을 수 없습니다.' });
    }

    res.json(schedule);
  } catch (error) {    res.status(500).json({ error: '시합일정을 불러오는데 실패했습니다.' });
  }
};

// 새 시합일정 생성
const createSchedule = (req, res) => {
  try {
    const { title, date, startDate } = req.body;
    const scheduleDate = date || startDate;

    if (!title || !scheduleDate) {
      return res.status(400).json({ error: '제목과 날짜는 필수 입력 항목입니다.' });
    }

    // date 필드가 없으면 startDate를 date로 설정
    const scheduleData = {
      ...req.body,
      date: scheduleDate
    };

    const newSchedule = Schedule.create(scheduleData);
    res.status(201).json(newSchedule);
  } catch (error) {
    res.status(500).json({ error: '시합일정 생성에 실패했습니다.' });
  }
};

// 시합일정 수정
const updateSchedule = (req, res) => {
  try {
    const { id } = req.params;    const updatedSchedule = Schedule.update(id, req.body);
    if (!updatedSchedule) {
      return res.status(404).json({ error: '시합일정을 찾을 수 없습니다.' });
    }    res.json(updatedSchedule);
  } catch (error) {    res.status(500).json({ error: '시합일정 수정에 실패했습니다.' });
  }
};

// 시합일정 삭제
const deleteSchedule = (req, res) => {
  try {
    const { id } = req.params;    const deleted = Schedule.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: '시합일정을 찾을 수 없습니다.' });
    }    res.json({ message: '시합일정이 삭제되었습니다.' });
  } catch (error) {    res.status(500).json({ error: '시합일정 삭제에 실패했습니다.' });
  }
};

// 날짜 범위로 시합일정 조회
const getSchedulesByDateRange = (req, res) => {
  try {
    const { startDate, endDate } = req.query;    if (!startDate || !endDate) {
      return res.status(400).json({ error: '시작 날짜와 종료 날짜를 모두 입력해주세요.' });
    }

    const schedules = Schedule.getByDateRange(startDate, endDate);    res.json(schedules);
  } catch (error) {    res.status(500).json({ error: '시합일정 조회에 실패했습니다.' });
  }
};

// 유형별 시합일정 조회
const getSchedulesByType = (req, res) => {
  try {
    const { type } = req.params;    const schedules = Schedule.getByType(type);    res.json(schedules);
  } catch (error) {    res.status(500).json({ error: '시합일정 조회에 실패했습니다.' });
  }
};

module.exports = {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedulesByDateRange,
  getSchedulesByType
};