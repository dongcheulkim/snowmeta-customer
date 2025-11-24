const Notice = require('../models/NoticeSQLite');

const noticeController = {
  getAllNotices(req, res) {
    try {
      const notices = Notice.getAll();
      res.json(notices);
    } catch (error) {
      console.error('공지사항 목록 조회 오류:', error);
      res.status(500).json({ error: '공지사항 목록을 가져오는데 실패했습니다.' });
    }
  },

  getNoticeById(req, res) {
    try {
      const { id } = req.params;
      const notice = Notice.getById(id);

      if (!notice) {
        return res.status(404).json({ error: '공지사항을 찾을 수 없습니다.' });
      }

      res.json(notice);
    } catch (error) {
      console.error('공지사항 조회 오류:', error);
      res.status(500).json({ error: '공지사항을 가져오는데 실패했습니다.' });
    }
  },

  createNotice(req, res) {
    try {
      const { title, content, author, important } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          error: '제목과 내용은 필수입니다.'
        });
      }

      const newNotice = Notice.create({
        title,
        content,
        author: author || '관리자',
        important: important || false
      });

      res.status(201).json(newNotice);
    } catch (error) {
      console.error('공지사항 등록 오류:', error);
      res.status(500).json({ error: '공지사항 등록에 실패했습니다.', details: error.message });
    }
  },

  updateNotice(req, res) {
    try {
      const { id } = req.params;
      const { title, content, important } = req.body;

      const existingNotice = Notice.getById(id);
      if (!existingNotice) {
        return res.status(404).json({ error: '공지사항을 찾을 수 없습니다.' });
      }

      if (!title || !content) {
        return res.status(400).json({
          error: '제목과 내용은 필수입니다.'
        });
      }

      const updatedNotice = Notice.update(id, {
        title,
        content,
        important: important || false
      });

      res.json(updatedNotice);
    } catch (error) {
      console.error('공지사항 수정 오류:', error);
      res.status(500).json({ error: '공지사항 수정에 실패했습니다.' });
    }
  },

  deleteNotice(req, res) {
    try {
      const { id } = req.params;
      const deletedNotice = Notice.delete(id);

      if (!deletedNotice) {
        return res.status(404).json({ error: '공지사항을 찾을 수 없습니다.' });
      }

      res.json({ message: '공지사항이 성공적으로 삭제되었습니다.' });
    } catch (error) {
      console.error('공지사항 삭제 오류:', error);
      res.status(500).json({ error: '공지사항 삭제에 실패했습니다.' });
    }
  },

  clearAllData(req, res) {
    try {
      Notice.clearAllData();
      res.json({ message: '모든 공지사항 데이터가 초기화되었습니다.' });
    } catch (error) {
      console.error('데이터 초기화 오류:', error);
      res.status(500).json({ error: '데이터 초기화에 실패했습니다.' });
    }
  }
};

module.exports = noticeController;
