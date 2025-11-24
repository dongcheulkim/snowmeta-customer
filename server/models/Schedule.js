const schedules = [];
let nextId = 1;

class Schedule {
  static getAll() {
    return schedules;
  }

  static getById(id) {
    return schedules.find(schedule => schedule.id === parseInt(id));
  }

  static create(scheduleData) {
    const newSchedule = {
      id: nextId++,
      title: scheduleData.title,
      date: scheduleData.date,
      location: scheduleData.location || '',
      memo: scheduleData.memo || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    schedules.push(newSchedule);    return newSchedule;
  }

  static update(id, updateData) {
    const index = schedules.findIndex(schedule => schedule.id === parseInt(id));
    if (index === -1) {
      return null;
    }

    const updatedSchedule = {
      ...schedules[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    schedules[index] = updatedSchedule;    return updatedSchedule;
  }

  static delete(id) {
    const index = schedules.findIndex(schedule => schedule.id === parseInt(id));
    if (index === -1) {
      return false;
    }

    const deletedSchedule = schedules.splice(index, 1)[0];    return true;
  }

  static getByDateRange(startDate, endDate) {
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return scheduleDate >= start && scheduleDate <= end;
    });
  }

  static getByType(type) {
    return schedules.filter(schedule => schedule.type === type);
  }

  static resetAll() {
    schedules.length = 0;
    nextId = 1;  }

  static initializeSampleData() {
    const sampleSchedules = [
      {
        title: '전국 스키대회',
        date: '2025-09-25',
        location: '용평리조트',
        memo: '선수 준비물 체크 필요'
      },
      {
        title: '겨울 훈련 캠프',
        date: '2025-09-28',
        location: '알펜시아',
        memo: '장비 점검 완료'
      },
      {
        title: '코치진 회의',
        date: '2025-09-30',
        location: '본부 회의실',
        memo: '시즌 계획서 검토'
      }
    ];

    sampleSchedules.forEach(scheduleData => {
      this.create(scheduleData);
    });  }
}

module.exports = Schedule;