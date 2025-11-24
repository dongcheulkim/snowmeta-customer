const db = require('../config/database');

class GeneralServiceSQLite {
  static getAll() {
    try {
      const stmt = db.prepare('SELECT * FROM services ORDER BY service_date DESC');
      return stmt.all();
    } catch (error) {
      throw error;
    }
  }

  static getById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM services WHERE id = ?');
      return stmt.get(id);
    } catch (error) {
      throw error;
    }
  }

  static create(serviceData) {
    try {
      const stmt = db.prepare(`
        INSERT INTO services (
          customer_name, customer_phone, service_description, service_date,
          total_cost, payment_status, branch, notes, customer_memo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        serviceData.customer_name,
        serviceData.customer_phone,
        serviceData.service_description,
        serviceData.service_date,
        serviceData.total_cost,
        serviceData.payment_status || 'unpaid',
        serviceData.branch || null,
        serviceData.notes || null,
        serviceData.customer_memo || null
      );

      return this.getById(result.lastInsertRowid);
    } catch (error) {
      throw error;
    }
  }

  static update(id, serviceData) {
    try {
      const stmt = db.prepare(`
        UPDATE services SET
          customer_name = ?,
          customer_phone = ?,
          service_description = ?,
          service_date = ?,
          total_cost = ?,
          payment_status = ?,
          branch = ?,
          notes = ?,
          customer_memo = ?,
          updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `);

      stmt.run(
        serviceData.customer_name,
        serviceData.customer_phone,
        serviceData.service_description,
        serviceData.service_date,
        serviceData.total_cost,
        serviceData.payment_status,
        serviceData.branch,
        serviceData.notes,
        serviceData.customer_memo,
        id
      );

      return this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  static delete(id) {
    try {
      const service = this.getById(id);
      const stmt = db.prepare('DELETE FROM services WHERE id = ?');
      stmt.run(id);
      return service;
    } catch (error) {
      throw error;
    }
  }

  static findByCustomerPhone(phone) {
    try {
      const stmt = db.prepare('SELECT * FROM services WHERE customer_phone = ? ORDER BY service_date DESC');
      return stmt.all(phone);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = GeneralServiceSQLite;
