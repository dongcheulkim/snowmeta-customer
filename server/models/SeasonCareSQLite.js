const db = require('../config/database');

class SeasonCareSQLite {
  static async getAll() {
    try {
      const stmt = db.prepare('SELECT * FROM season_care ORDER BY service_date DESC');
      const results = stmt.all();

      return results.map(row => ({
        ...row,
        customer_name: row.customer_name || '알 수 없음',
        customer_phone: row.customer_phone || '알 수 없음'
      }));
    } catch (error) {
      throw error;
    }
  }

  static async getById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM season_care WHERE id = ?');
      const row = stmt.get(id);

      if (!row) return null;

      return row;
    } catch (error) {
      throw error;
    }
  }

  static async getByCustomerPhone(customerPhone) {
    try {
      const stmt = db.prepare('SELECT * FROM season_care WHERE customer_phone = ? ORDER BY contract_number DESC, service_date DESC');
      return stmt.all(customerPhone);
    } catch (error) {
      throw error;
    }
  }

  // 고객의 최신 계약 번호 조회
  static async getLatestContractNumber(customerPhone) {
    try {
      const stmt = db.prepare('SELECT MAX(contract_number) as max_contract FROM season_care WHERE customer_phone = ?');
      const result = stmt.get(customerPhone);
      return result?.max_contract || 0;
    } catch (error) {
      throw error;
    }
  }

  // 특정 계약의 등록된 횟수와 총 횟수 확인
  static async getContractUsage(customerPhone, contractNumber) {
    try {
      // 해당 계약의 모든 기록 조회
      const stmt = db.prepare(`
        SELECT season_count
        FROM season_care
        WHERE customer_phone = ? AND contract_number = ?
        ORDER BY id ASC
        LIMIT 1
      `);
      const firstRecord = stmt.get(customerPhone, contractNumber);

      if (!firstRecord || !firstRecord.season_count) {
        return { totalCount: 0, usedCount: 0 };
      }

      // season_count에서 총 횟수 파싱 (예: "10+1" → 11, "5+왁" → 6)
      const seasonCount = firstRecord.season_count;
      let totalCount = 0;

      if (seasonCount.includes('+')) {
        const parts = seasonCount.split('+');
        const baseCount = parseInt(parts[0]) || 0;
        const bonusCount = parts[1] === '왁' ? 1 : parseInt(parts[1]) || 0;
        totalCount = baseCount + bonusCount;
      } else {
        totalCount = parseInt(seasonCount) || 0;
      }

      // 사용된 횟수 조회
      const countStmt = db.prepare(`
        SELECT COUNT(*) as used
        FROM season_care
        WHERE customer_phone = ? AND contract_number = ?
      `);
      const usedResult = countStmt.get(customerPhone, contractNumber);
      const usedCount = usedResult?.used || 0;

      return { totalCount, usedCount };
    } catch (error) {
      throw error;
    }
  }

  static async create(seasonCareData) {
    try {
      const {
        customer_name,
        customer_phone,
        customer_memo,
        service_date,
        service_description,
        price,
        notes,
        payment_status,
        payment_location,
        season_count
      } = seasonCareData;

      // 계약 번호 결정 로직
      let contractNumber = 1;

      // 기존 계약이 있는지 확인
      const latestContractNumber = await this.getLatestContractNumber(customer_phone);

      if (latestContractNumber > 0) {
        // 최신 계약의 사용 현황 확인
        const { totalCount, usedCount } = await this.getContractUsage(customer_phone, latestContractNumber);

        // 남은 횟수가 있으면 같은 계약 번호 사용, 없으면 새 계약 번호
        if (usedCount >= totalCount && totalCount > 0) {
          // 모두 사용했으면 새 계약 시작
          contractNumber = latestContractNumber + 1;
        } else {
          // 아직 남은 횟수가 있으면 기존 계약에 추가
          contractNumber = latestContractNumber;
        }
      }

      const stmt = db.prepare(`
        INSERT INTO season_care (
          customer_name, customer_phone, customer_memo, season_count, price, payment_location,
          service_date, service_description, notes, payment_status, contract_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        customer_name,
        customer_phone,
        customer_memo || null,
        season_count || null,
        price || null,
        payment_location || null,
        service_date,
        service_description || null,
        notes || null,
        payment_status || '미결제',
        contractNumber
      );

      return await this.getById(result.lastInsertRowid);
    } catch (error) {
      throw error;
    }
  }

  static async update(id, seasonCareData) {
    try {
      const {
        customer_name,
        customer_phone,
        customer_memo,
        service_date,
        service_description,
        price,
        notes,
        payment_status,
        payment_location,
        season_count,
        contract_number
      } = seasonCareData;

      const stmt = db.prepare(`
        UPDATE season_care SET
          customer_name = ?,
          customer_phone = ?,
          customer_memo = ?,
          season_count = ?,
          price = ?,
          payment_location = ?,
          service_date = ?,
          service_description = ?,
          notes = ?,
          payment_status = ?,
          contract_number = ?,
          updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `);

      stmt.run(
        customer_name,
        customer_phone,
        customer_memo,
        season_count,
        price,
        payment_location,
        service_date,
        service_description,
        notes,
        payment_status,
        contract_number,
        id
      );

      return await this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const seasonCare = await this.getById(id);
      const stmt = db.prepare('DELETE FROM season_care WHERE id = ?');
      stmt.run(id);
      return seasonCare;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SeasonCareSQLite;
