// 앰버서더 컨트롤러 (일반정비와 동일한 구조)
const Ambassador = require('../models/AmbassadorMemory');

const ambassadorController = {
  async getAllAmbassadors(req, res) {
    try {
      const ambassadors = await Ambassador.getAll();
      res.json(ambassadors);
    } catch (error) {      res.status(500).json({ error: '앰버서더 목록을 가져오는데 실패했습니다.' });
    }
  },

  async getAmbassadorById(req, res) {
    try {
      const { id } = req.params;
      const ambassador = await Ambassador.getById(id);

      if (!ambassador) {
        return res.status(404).json({ error: '앰버서더를 찾을 수 없습니다.' });
      }

      res.json(ambassador);
    } catch (error) {      res.status(500).json({ error: '앰버서더 정보를 가져오는데 실패했습니다.' });
    }
  },

  async getAmbassadorsByCustomer(req, res) {
    try {
      const { customerId } = req.params;
      const ambassadors = await Ambassador.getByCustomerId(customerId);
      res.json(ambassadors);
    } catch (error) {      res.status(500).json({ error: '고객 앰버서더를 가져오는데 실패했습니다.' });
    }
  },

  async createAmbassador(req, res) {
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
        notes
      } = req.body;

      // 디버깅: 받은 데이터 로그      // 필수 필드 검증 - 더 관대하게 수정
      if (!service_date) {
        return res.status(400).json({
          error: '정비날짜는 필수입니다.'
        });
      }

      if (!service_description) {
        return res.status(400).json({
          error: '정비내역은 필수입니다.'
        });
      }

      if (total_cost === undefined || total_cost === null) {
        return res.status(400).json({
          error: '총비용은 필수입니다.'
        });
      }

      const newAmbassador = await Ambassador.create({
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
        notes
      });

      res.status(201).json(newAmbassador);
    } catch (error) {      res.status(500).json({ error: '앰버서더 등록에 실패했습니다.' });
    }
  },

  async updateAmbassador(req, res) {
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
        notes
      } = req.body;

      if (!service_date || !service_description || total_cost === undefined || total_cost === null) {        return res.status(400).json({
          error: '정비날짜, 정비내역, 총비용은 필수입니다.'
        });
      }

      const updatedAmbassador = await Ambassador.update(id, {
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
        notes
      });

      if (!updatedAmbassador) {
        return res.status(404).json({ error: '앰버서더를 찾을 수 없습니다.' });
      }

      res.json(updatedAmbassador);
    } catch (error) {      res.status(500).json({ error: '앰버서더 수정에 실패했습니다.' });
    }
  },

  async deleteAmbassador(req, res) {
    try {
      const { id } = req.params;
      const deletedAmbassador = await Ambassador.delete(id);

      if (!deletedAmbassador) {
        return res.status(404).json({ error: '앰버서더를 찾을 수 없습니다.' });
      }

      res.json({ message: '앰버서더가 성공적으로 삭제되었습니다.' });
    } catch (error) {      res.status(500).json({ error: '앰버서더 삭제에 실패했습니다.' });
    }
  },

  async getCustomerList(req, res) {
    try {      const ambassadors = await Ambassador.getAll();      const customerMap = new Map();

      ambassadors.forEach(ambassador => {
        if (!ambassador.customer_phone) return;

        const key = ambassador.customer_phone;
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            services: [],
            latestDate: ambassador.service_date,
            latestBranch: ambassador.branch || '곳지암'
          });
        }

        const customer = customerMap.get(key);
        customer.services.push({
          id: ambassador.id,
          date: ambassador.service_date,
          cost: ambassador.total_cost || 0,
          paymentStatus: ambassador.payment_status,
          description: ambassador.service_description
        });

        // 최근 서비스 업데이트
        if (new Date(ambassador.service_date) > new Date(customer.latestDate)) {
          customer.latestDate = ambassador.service_date;
          customer.latestBranch = ambassador.branch || '곳지암';
        }

        // 고객 이름 업데이트 (최신 이름으로)
        if (ambassador.customer_name) {
          customer.name = ambassador.customer_name;
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
    } catch (error) {      res.status(500).json({ error: '앰버서더 고객 목록을 가져오는데 실패했습니다.' });
    }
  },

  async updateCustomerInfo(req, res) {
    try {
      const { oldPhone, newCustomerData } = req.body;

      if (!oldPhone || !newCustomerData) {
        return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
      }

      // 해당 전화번호의 모든 앰버서더 정비내역을 조회
      const ambassadors = await Ambassador.findByCustomerPhone(oldPhone);

      if (ambassadors.length === 0) {
        return res.status(404).json({ error: '해당 고객의 앰버서더 정비내역을 찾을 수 없습니다.' });
      }

      // 모든 정비내역의 고객 정보를 업데이트
      const updatePromises = ambassadors.map(ambassador =>
        Ambassador.update(ambassador.id, {
          ...ambassador,
          customer_name: newCustomerData.name,
          customer_phone: newCustomerData.phone
        })
      );

      await Promise.all(updatePromises);

      res.json({
        message: '앰버서더 고객 정보가 성공적으로 수정되었습니다.',
        updatedCount: ambassadors.length
      });
    } catch (error) {      res.status(500).json({ error: '앰버서더 고객 정보 수정에 실패했습니다.' });
    }
  },

  async clearAllData(req, res) {
    try {
      Ambassador.clearAllData();
      res.json({ message: '모든 앰버서더 데이터가 성공적으로 삭제되었습니다.' });
    } catch (error) {      res.status(500).json({ error: '앰버서더 데이터 삭제에 실패했습니다.' });
    }
  }
};

module.exports = ambassadorController;