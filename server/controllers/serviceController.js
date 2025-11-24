// SQLite 기반 모델 사용
const GeneralService = require('../models/GeneralServiceSQLite');

const serviceController = {
  async getAllServices(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const services = await GeneralService.getAll();
      const total = services.length;
      const paginatedServices = services.slice(offset, offset + limit);

      res.json({
        data: paginatedServices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {      res.status(500).json({ error: '정비내역 목록을 가져오는데 실패했습니다.' });
    }
  },

  async getServiceById(req, res) {
    try {
      const { id } = req.params;
      const service = await GeneralService.getById(id);
      
      if (!service) {
        return res.status(404).json({ error: '정비내역을 찾을 수 없습니다.' });
      }
      
      res.json(service);
    } catch (error) {      res.status(500).json({ error: '정비내역 정보를 가져오는데 실패했습니다.' });
    }
  },

  async getServicesByCustomer(req, res) {
    try {
      const { customerId } = req.params;
      const services = await GeneralService.getByCustomerId(customerId);
      res.json(services);
    } catch (error) {      res.status(500).json({ error: '고객 정비내역을 가져오는데 실패했습니다.' });
    }
  },

  async createService(req, res) {
    try {
      const {
        customer_id,
        customer_name,
        customer_phone,
        service_date,
        vehicle_info,
        service_type,
        service_description,
        parts_used,
        labor_hours,
        labor_cost,
        parts_cost,
        total_cost,
        technician_name,
        service_status,
        payment_status,
        branch,
        notes,
        customer_memo
      } = req.body;
      
      if (!service_date || !service_description || (total_cost === undefined || total_cost === null || total_cost === '')) {
        return res.status(400).json({
          error: '정비날짜, 정비내역, 총비용은 필수입니다.'
        });
      }
      
      const newService = await GeneralService.create({
        customer_id,
        customer_name,
        customer_phone,
        service_date,
        vehicle_info,
        service_type,
        service_description,
        parts_used,
        labor_hours,
        labor_cost,
        parts_cost,
        total_cost,
        technician_name,
        service_status,
        payment_status,
        branch,
        notes,
        customer_memo
      });
      
      res.status(201).json(newService);
    } catch (error) {      res.status(500).json({ error: '정비내역 등록에 실패했습니다.' });
    }
  },

  async updateService(req, res) {
    try {
      const { id } = req.params;      const {
        customer_id,
        customer_name,
        customer_phone,
        service_date,
        vehicle_info,
        service_type,
        service_description,
        parts_used,
        labor_hours,
        labor_cost,
        parts_cost,
        total_cost,
        technician_name,
        service_status,
        payment_status,
        branch,
        notes,
        customer_memo
      } = req.body;
      
      if (!service_date || !service_description || total_cost === undefined || total_cost === null) {        return res.status(400).json({ 
          error: '정비날짜, 정비내역, 총비용은 필수입니다.' 
        });
      }
      
      const updatedService = await GeneralService.update(id, {
        customer_id,
        customer_name,
        customer_phone,
        service_date,
        vehicle_info,
        service_type,
        service_description,
        parts_used,
        labor_hours,
        labor_cost,
        parts_cost,
        total_cost,
        technician_name,
        service_status,
        payment_status,
        branch,
        notes,
        customer_memo
      });
      
      if (!updatedService) {
        return res.status(404).json({ error: '정비내역을 찾을 수 없습니다.' });
      }
      
      res.json(updatedService);
    } catch (error) {      res.status(500).json({ error: '정비내역 수정에 실패했습니다.' });
    }
  },

  async deleteService(req, res) {
    try {
      const { id } = req.params;
      const deletedService = await GeneralService.delete(id);
      
      if (!deletedService) {
        return res.status(404).json({ error: '정비내역을 찾을 수 없습니다.' });
      }
      
      res.json({ message: '정비내역이 성공적으로 삭제되었습니다.' });
    } catch (error) {      res.status(500).json({ error: '정비내역 삭제에 실패했습니다.' });
    }
  },

  async getCustomerList(req, res) {
    try {      const services = await GeneralService.getAll();      const customerMap = new Map();
      
      services.forEach(service => {
        if (!service.customer_phone) return;
        
        const key = service.customer_phone;
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            services: [],
            latestDate: service.service_date,
            latestBranch: service.branch || '곳지암'
          });
        }
        
        const customer = customerMap.get(key);
        customer.services.push({
          id: service.id,
          date: service.service_date,
          cost: service.total_cost || 0,
          paymentStatus: service.payment_status,
          description: service.service_description
        });
        
        // 최근 서비스 업데이트
        if (new Date(service.service_date) > new Date(customer.latestDate)) {
          customer.latestDate = service.service_date;
          customer.latestBranch = service.branch || '곳지암';
        }
        
        // 고객 이름 업데이트 (최신 이름으로)
        if (service.customer_name) {
          customer.name = service.customer_name;
        }
      });
      
      // 고객 목록 생성
      const customers = [];
      let id = 1;
      
      for (const [phone, data] of customerMap) {
        const unpaidCount = data.services.filter(s => s.paymentStatus === '미결제').length;
        const totalAmount = data.services.reduce((sum, s) => {
          const cost = s.cost;
          if (typeof cost === 'string' && cost !== '엠버서더') {
            return sum + parseFloat(cost);
          } else if (typeof cost === 'number') {
            return sum + cost;
          }
          return sum;
        }, 0);
        
        customers.push({
          id: id++,
          name: data.name || '이름없음',
          phone: phone,
          totalServices: data.services.length,
          totalAmount: totalAmount,
          lastServiceDate: data.latestDate,
          lastServiceBranch: data.latestBranch,
          unpaidCount: unpaidCount
        });
      }      res.json(customers);
    } catch (error) {      res.status(500).json({ error: '고객 목록을 가져오는데 실패했습니다.' });
    }
  },

  async updateCustomerInfo(req, res) {
    try {
      const { oldPhone, newCustomerData } = req.body;
      
      if (!oldPhone || !newCustomerData) {
        return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
      }

      // 해당 전화번호의 모든 정비내역을 조회
      const services = await GeneralService.findByCustomerPhone(oldPhone);
      
      if (services.length === 0) {
        return res.status(404).json({ error: '해당 고객의 정비내역을 찾을 수 없습니다.' });
      }

      // 모든 정비내역의 고객 정보를 업데이트
      const updatePromises = services.map(service => 
        GeneralService.update(service.id, {
          ...service,
          customer_name: newCustomerData.name,
          customer_phone: newCustomerData.phone
        })
      );

      await Promise.all(updatePromises);
      
      res.json({ 
        message: '고객 정보가 성공적으로 수정되었습니다.',
        updatedCount: services.length
      });
    } catch (error) {      res.status(500).json({ error: '고객 정보 수정에 실패했습니다.' });
    }
  },

  async clearAllData(req, res) {
    try {
      GeneralService.clearAllData();
      res.json({ message: '모든 정비내역 데이터가 성공적으로 삭제되었습니다.' });
    } catch (error) {      res.status(500).json({ error: '정비내역 데이터 삭제에 실패했습니다.' });
    }
  }
};

module.exports = serviceController;