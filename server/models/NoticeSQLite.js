const db = require('../config/database');

class NoticeSQLite {
  // 모든 공지사항 조회
  static getAll() {
    try {
      const stmt = db.prepare(`
        SELECT * FROM notices
        ORDER BY important DESC, created_at DESC
      `);
      return stmt.all();
    } catch (error) {
      throw error;
    }
  }

  // ID로 공지사항 조회
  static getById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM notices WHERE id = ?');
      return stmt.get(id);
    } catch (error) {
      throw error;
    }
  }

  // 공지사항 생성
  static create(noticeData) {
    try {
      const { title, content, author, important } = noticeData;

      const stmt = db.prepare(`
        INSERT INTO notices (title, content, author, important)
        VALUES (?, ?, ?, ?)
      `);

      const result = stmt.run(
        title,
        content,
        author || '관리자',
        important ? 1 : 0
      );

      return this.getById(result.lastInsertRowid);
    } catch (error) {
      throw error;
    }
  }

  // 공지사항 수정
  static update(id, noticeData) {
    try {
      const { title, content, important } = noticeData;

      const stmt = db.prepare(`
        UPDATE notices SET
          title = ?,
          content = ?,
          important = ?,
          updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `);

      stmt.run(title, content, important ? 1 : 0, id);
      return this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  // 공지사항 삭제
  static delete(id) {
    try {
      const notice = this.getById(id);
      if (!notice) {
        return null;
      }

      const stmt = db.prepare('DELETE FROM notices WHERE id = ?');
      stmt.run(id);

      return notice;
    } catch (error) {
      throw error;
    }
  }

  // 모든 데이터 삭제 (테스트용)
  static clearAllData() {
    try {
      const stmt = db.prepare('DELETE FROM notices');
      stmt.run();

      // AUTOINCREMENT 카운터 리셋
      const resetStmt = db.prepare("DELETE FROM sqlite_sequence WHERE name='notices'");
      resetStmt.run();
    } catch (error) {
      throw error;
    }
  }
}

module.exports = NoticeSQLite;
