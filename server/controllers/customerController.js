// 개발 중에는 메모리 기반 모델 사용 (PostgreSQL 대신)
const Customer = require('../models/CustomerMemory');

const customerController = {
  async getAllCustomers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const customers = await Customer.getAll();
      const total = customers.length;
      const paginatedCustomers = customers.slice(offset, offset + limit);

      res.json({
        data: paginatedCustomers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {      res.status(500).json({ error: '고객 목록을 가져오는데 실패했습니다.' });
    }
  },

  async getCustomerById(req, res) {
    try {
      const { id } = req.params;
      const customer = await Customer.getById(id);
      
      if (!customer) {
        return res.status(404).json({ error: '고객을 찾을 수 없습니다.' });
      }
      
      res.json(customer);
    } catch (error) {      res.status(500).json({ error: '고객 정보를 가져오는데 실패했습니다.' });
    }
  },

  async createCustomer(req, res) {
    try {
      const { name, email, phone, address } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ error: '이름과 이메일은 필수입니다.' });
      }
      
      const newCustomer = await Customer.create({
        name,
        email,
        phone,
        address
      });
      
      res.status(201).json(newCustomer);
    } catch (error) {      if (error.code === '23505') {
        res.status(409).json({ error: '이미 존재하는 이메일입니다.' });
      } else {
        res.status(500).json({ error: '고객 등록에 실패했습니다.' });
      }
    }
  },

  async updateCustomer(req, res) {
    try {
      const { id } = req.params;
      const { name, email, phone, address } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ error: '이름과 이메일은 필수입니다.' });
      }
      
      const updatedCustomer = await Customer.update(id, {
        name,
        email,
        phone,
        address
      });
      
      if (!updatedCustomer) {
        return res.status(404).json({ error: '고객을 찾을 수 없습니다.' });
      }
      
      res.json(updatedCustomer);
    } catch (error) {      if (error.code === '23505') {
        res.status(409).json({ error: '이미 존재하는 이메일입니다.' });
      } else {
        res.status(500).json({ error: '고객 정보 수정에 실패했습니다.' });
      }
    }
  },

  async deleteCustomer(req, res) {
    try {
      const { id } = req.params;
      const deletedCustomer = await Customer.delete(id);
      
      if (!deletedCustomer) {
        return res.status(404).json({ error: '고객을 찾을 수 없습니다.' });
      }
      
      res.json({ message: '고객이 성공적으로 삭제되었습니다.' });
    } catch (error) {      res.status(500).json({ error: '고객 삭제에 실패했습니다.' });
    }
  }
};

module.exports = customerController;