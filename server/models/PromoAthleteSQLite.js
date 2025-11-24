const db = require('../config/database');

class PromoAthleteSQLite {
  // 모든 프로모션 선수 기록 조회
  static getAll() {
    try {
      const stmt = db.prepare(`
        SELECT * FROM promo_athletes
        ORDER BY service_date DESC, created_at DESC
      `);
      return stmt.all();
    } catch (error) {      throw error;
    }
  }

  // ID로 프로모션 선수 기록 조회
  static getById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM promo_athletes WHERE id = ?');
      return stmt.get(id);
    } catch (error) {      throw error;
    }
  }

  // 전화번호로 프로모션 선수 기록 조회
  static getByAthletePhone(athletePhone) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM promo_athletes
        WHERE athlete_phone = ?
        ORDER BY service_date DESC, created_at DESC
      `);
      return stmt.all(athletePhone);
    } catch (error) {      throw error;
    }
  }

  // 프로모션 선수 기록 생성
  static create(athleteData) {
    try {
      const {
        athlete_name,
        athlete_phone,
        boot_size,
        branch,
        service_date,
        equipment,
        service_content,
        notes,
        ski_brand,
        ski_model,
        ski_length,
        binding_brand,
        binding_model,
        boot_brand,
        boot_model,
        instagram_id,
        youtube_id
      } = athleteData;

      const stmt = db.prepare(`
        INSERT INTO promo_athletes (
          athlete_name, athlete_phone, boot_size, branch,
          service_date, equipment, service_content, notes,
          ski_brand, ski_model, ski_length,
          binding_brand, binding_model,
          boot_brand, boot_model,
          instagram_id, youtube_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        athlete_name,
        athlete_phone,
        boot_size || null,
        branch || '곤지암',
        service_date,
        equipment || null,
        service_content || null,
        notes || null,
        ski_brand || null,
        ski_model || null,
        ski_length || null,
        binding_brand || null,
        binding_model || null,
        boot_brand || null,
        boot_model || null,
        instagram_id || null,
        youtube_id || null
      );

      return this.getById(result.lastInsertRowid);
    } catch (error) {      throw error;
    }
  }

  // 프로모션 선수 기록 수정
  static update(id, athleteData) {
    try {
      const {
        athlete_name,
        athlete_phone,
        boot_size,
        branch,
        service_date,
        equipment,
        service_content,
        notes,
        ski_brand,
        ski_model,
        ski_length,
        binding_brand,
        binding_model,
        boot_brand,
        boot_model,
        instagram_id,
        youtube_id
      } = athleteData;

      const stmt = db.prepare(`
        UPDATE promo_athletes SET
          athlete_name = ?,
          athlete_phone = ?,
          boot_size = ?,
          branch = ?,
          service_date = ?,
          equipment = ?,
          service_content = ?,
          notes = ?,
          ski_brand = ?,
          ski_model = ?,
          ski_length = ?,
          binding_brand = ?,
          binding_model = ?,
          boot_brand = ?,
          boot_model = ?,
          instagram_id = ?,
          youtube_id = ?,
          updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `);

      stmt.run(
        athlete_name,
        athlete_phone,
        boot_size || null,
        branch || '곤지암',
        service_date,
        equipment || null,
        service_content || null,
        notes || null,
        ski_brand || null,
        ski_model || null,
        ski_length || null,
        binding_brand || null,
        binding_model || null,
        boot_brand || null,
        boot_model || null,
        instagram_id || null,
        youtube_id || null,
        id
      );

      return this.getById(id);
    } catch (error) {      throw error;
    }
  }

  // 프로모션 선수 기록 삭제
  static delete(id) {
    try {
      const athlete = this.getById(id);
      if (!athlete) {
        return null;
      }

      const stmt = db.prepare('DELETE FROM promo_athletes WHERE id = ?');
      stmt.run(id);

      return athlete;
    } catch (error) {      throw error;
    }
  }

  // 선수 목록 조회 (전화번호로 그룹화)
  static getAthleteList() {
    try {
      const allRecords = this.getAll();

      // 전화번호로 그룹화
      const athleteMap = new Map();

      allRecords.forEach(record => {
        const phone = record.athlete_phone;
        if (!athleteMap.has(phone)) {
          athleteMap.set(phone, {
            id: record.id,
            athlete_name: record.athlete_name,
            athlete_phone: record.athlete_phone,
            boot_size: record.boot_size,
            branch: record.branch,
            instagram_id: record.instagram_id,
            youtube_id: record.youtube_id,
            totalServices: 1,
            lastServiceDate: record.service_date,
            services: [record],
            equipments: []
          });
        } else {
          const athlete = athleteMap.get(phone);
          athlete.totalServices++;
          athlete.services.push(record);
          // 최신 서비스 날짜로 업데이트
          if (record.service_date > athlete.lastServiceDate) {
            athlete.lastServiceDate = record.service_date;
            athlete.boot_size = record.boot_size || athlete.boot_size;
            athlete.branch = record.branch || athlete.branch;
          }
        }
      });

      return Array.from(athleteMap.values());
    } catch (error) {      throw error;
    }
  }

  // 선수 기본 정보 업데이트 (전화번호 기준으로 모든 기록 업데이트)
  static updateAthleteInfo(oldPhone, newName, newPhone, newBootSize, newInstagramId, newYoutubeId) {
    try {
      const stmt = db.prepare(`
        UPDATE promo_athletes SET
          athlete_name = ?,
          athlete_phone = ?,
          boot_size = COALESCE(?, boot_size),
          instagram_id = COALESCE(?, instagram_id),
          youtube_id = COALESCE(?, youtube_id),
          updated_at = datetime('now', 'localtime')
        WHERE athlete_phone = ?
      `);

      const result = stmt.run(newName, newPhone, newBootSize, newInstagramId, newYoutubeId, oldPhone);
      return result.changes;
    } catch (error) {      throw error;
    }
  }

  // 모든 데이터 삭제 (테스트용)
  static clearAllData() {
    try {
      const stmt = db.prepare('DELETE FROM promo_athletes');
      stmt.run();

      // AUTOINCREMENT 카운터 리셋
      const resetStmt = db.prepare("DELETE FROM sqlite_sequence WHERE name='promo_athletes'");
      resetStmt.run();
    } catch (error) {      throw error;
    }
  }
}

module.exports = PromoAthleteSQLite;
