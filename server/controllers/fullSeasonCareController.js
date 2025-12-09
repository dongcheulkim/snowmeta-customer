const FullSeasonCare = require('../models/FullSeasonCare');

const fullSeasonCareController = {
  async getAllFullSeasonCares(req, res) {
    try {
      const services = await FullSeasonCare.getAll();
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: '풀시즌케어 목록을 가져오는데 실패했습니다.' });
    }
  },

  async getFullSeasonCareById(req, res) {
    try {
      const { id } = req.params;
      const service = await FullSeasonCare.getById(id);

      if (!service) {
        return res.status(404).json({ error: '풀시즌케어 내역을 찾을 수 없습니다.' });
      }

      res.json(service);
    } catch (error) {
      res.status(500).json({ error: '풀시즌케어 정보를 가져오는데 실패했습니다.' });
    }
  },

  async getFullSeasonCaresByCustomer(req, res) {
    try {
      const { customerId } = req.params;

      // 전화번호인지 ID인지 확인 (전화번호는 숫자와 하이픈 포함)
      let services;
      if (customerId.includes('-') || customerId.length > 10) {
        // 전화번호로 조회
        services = await FullSeasonCare.getByCustomerPhone(decodeURIComponent(customerId));
      } else {
        // ID로 조회
        services = await FullSeasonCare.getByCustomerId(customerId);
      }
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: '고객 풀시즌케어를 가져오는데 실패했습니다.' });
    }
  },

  async getFullSeasonCaresByPhone(req, res) {
    try {
      const { customerPhone } = req.params;
      const services = await FullSeasonCare.getByCustomerPhone(decodeURIComponent(customerPhone));
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: '고객 풀시즌케어를 가져오는데 실패했습니다.' });
    }
  },

  async createFullSeasonCare(req, res) {
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
      } = req.body;

      console.log('=== 서버: createFullSeasonCare ===');
      console.log('contract_number:', contract_number);
      console.log('customer_phone:', customer_phone);

      if (!customer_name || !customer_phone || !service_date) {
        return res.status(400).json({
          error: '고객이름, 전화번호, 서비스날짜는 필수입니다.'
        });
      }

      const newService = await FullSeasonCare.create({
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
      });

      console.log('생성된 contract_number:', newService.contract_number);
      res.status(201).json(newService);
    } catch (error) {
      res.status(500).json({ error: '풀시즌케어 등록에 실패했습니다.' });
    }
  },

  async updateFullSeasonCare(req, res) {
    try {
      const { id } = req.params;
      // 기존 데이터 조회
      const existingService = await FullSeasonCare.getById(id);
      if (!existingService) {
        return res.status(404).json({ error: '풀시즌케어 내역을 찾을 수 없습니다.' });
      }

      // 전체 body를 기존 데이터와 병합
      const finalData = {
        ...existingService,
        ...req.body
      };

      // 필수 필드 확인
      if (!finalData.customer_name || !finalData.customer_phone || !finalData.service_date) {
        return res.status(400).json({
          error: '고객이름, 전화번호, 서비스날짜는 필수입니다.'
        });
      }

      const updatedService = await FullSeasonCare.update(id, finalData);

      if (!updatedService) {
        return res.status(404).json({ error: '풀시즌케어 내역을 찾을 수 없습니다.' });
      }

      res.json(updatedService);
    } catch (error) {
      res.status(500).json({ error: '풀시즌케어 수정에 실패했습니다.' });
    }
  },

  async deleteFullSeasonCare(req, res) {
    try {
      const { id } = req.params;
      const deletedService = await FullSeasonCare.delete(id);

      if (!deletedService) {
        return res.status(404).json({ error: '풀시즌케어 내역을 찾을 수 없습니다.' });
      }

      res.json({ message: '풀시즌케어 내역이 성공적으로 삭제되었습니다.' });
    } catch (error) {
      res.status(500).json({ error: '풀시즌케어 삭제에 실패했습니다.' });
    }
  }
};

module.exports = fullSeasonCareController;
