const db = require('../config/database');
const bcrypt = require('bcryptjs');

class UserSQLite {
  // 모든 사용자 조회
  static getAll() {
    try {
      const stmt = db.prepare('SELECT id, username, branch_name, is_admin, created_at FROM users');
      return stmt.all();
    } catch (error) {
      throw error;
    }
  }

  // ID로 사용자 조회
  static getById(id) {
    try {
      const stmt = db.prepare('SELECT id, username, branch_name, is_admin, created_at FROM users WHERE id = ?');
      return stmt.get(id);
    } catch (error) {
      throw error;
    }
  }

  // 사용자명으로 사용자 조회 (로그인용)
  static getByUsername(username) {
    try {
      const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
      return stmt.get(username);
    } catch (error) {
      throw error;
    }
  }

  // 로그인 검증
  static async authenticate(username, password) {
    try {
      const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
      const user = stmt.get(username);

      if (!user) {
        return null;
      }

      // bcrypt로 비밀번호 비교
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return null;
      }

      // 비밀번호는 반환하지 않음
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  }

  // 사용자 생성
  static async create(userData) {
    try {
      const { username, password, branch_name, is_admin } = userData;

      // 비밀번호 해싱 (salt rounds: 10)
      const hashedPassword = await bcrypt.hash(password, 10);

      const stmt = db.prepare(`
        INSERT INTO users (username, password, branch_name, is_admin)
        VALUES (?, ?, ?, ?)
      `);

      const result = stmt.run(
        username,
        hashedPassword,
        branch_name,
        is_admin ? 1 : 0
      );

      return this.getById(result.lastInsertRowid);
    } catch (error) {
      throw error;
    }
  }

  // 비밀번호 변경
  static async updatePassword(id, newPassword) {
    try {
      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const stmt = db.prepare(`
        UPDATE users SET
          password = ?,
          updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `);

      stmt.run(hashedPassword, id);
      return this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  // 사용자 정보 수정
  static update(id, userData) {
    try {
      const { username, branch_name, is_admin } = userData;

      const stmt = db.prepare(`
        UPDATE users SET
          username = ?,
          branch_name = ?,
          is_admin = ?,
          updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `);

      stmt.run(username, branch_name, is_admin ? 1 : 0, id);
      return this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  // 사용자 삭제
  static delete(id) {
    try {
      const user = this.getById(id);
      if (!user) {
        return null;
      }

      const stmt = db.prepare('DELETE FROM users WHERE id = ?');
      stmt.run(id);

      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserSQLite;
