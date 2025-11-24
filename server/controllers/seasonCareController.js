const SeasonCare = require('../models/SeasonCare');

const seasonCareController = {
  async getAllSeasonCares(req, res) {
    try {
      const services = await SeasonCare.getAll();
      res.json(services);
    } catch (error) {      res.status(500).json({ error: '시즌케어 목록을 가져오는데 실패했습니다.' });
    }
  },

  async getSeasonCareById(req, res) {
    try {
      const { id } = req.params;
      const service = await SeasonCare.getById(id);
      
      if (!service) {
        return res.status(404).json({ error: '시즌케어 내역을 찾을 수 없습니다.' });
      }
      
      res.json(service);
    } catch (error) {      res.status(500).json({ error: '시즌케어 정보를 가져오는데 실패했습니다.' });
    }
  },

  async getSeasonCaresByCustomer(req, res) {
    try {
      const { customerId } = req.params;
      
      // 전화번호인지 ID인지 확인 (전화번호는 숫자와 하이픈 포함)
      let services;
      if (customerId.includes('-') || customerId.length > 10) {
        // 전화번호로 조회        services = await SeasonCare.getByCustomerPhone(decodeURIComponent(customerId));
      } else {
        // ID로 조회
        services = await SeasonCare.getByCustomerId(customerId);
      }      res.json(services);
    } catch (error) {      res.status(500).json({ error: '고객 시즌케어를 가져오는데 실패했습니다.' });
    }
  },

  async getSeasonCaresByPhone(req, res) {
    try {
      const { customerPhone } = req.params;      const services = await SeasonCare.getByCustomerPhone(decodeURIComponent(customerPhone));      res.json(services);
    } catch (error) {      res.status(500).json({ error: '고객 시즌케어를 가져오는데 실패했습니다.' });
    }
  },

  async createSeasonCare(req, res) {
    try {      const {
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

      console.log('=== 서버: createSeasonCare ===');
      console.log('contract_number:', contract_number);
      console.log('customer_phone:', customer_phone);

      if (!customer_name || !customer_phone || !service_date) {
        return res.status(400).json({
          error: '고객이름, 전화번호, 서비스날짜는 필수입니다.'
        });
      }

      const newService = await SeasonCare.create({
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
    } catch (error) {      res.status(500).json({ error: '시즌케어 등록에 실패했습니다.' });
    }
  },

  async updateSeasonCare(req, res) {
    try {
      const { id } = req.params;      // 기존 데이터 조회
      const existingService = await SeasonCare.getById(id);
      if (!existingService) {
        return res.status(404).json({ error: '시즌케어 내역을 찾을 수 없습니다.' });
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
      
      const updatedService = await SeasonCare.update(id, finalData);
      
      if (!updatedService) {
        return res.status(404).json({ error: '시즌케어 내역을 찾을 수 없습니다.' });
      }
      
      res.json(updatedService);
    } catch (error) {      res.status(500).json({ error: '시즌케어 수정에 실패했습니다.' });
    }
  },

  async deleteSeasonCare(req, res) {
    try {
      const { id } = req.params;
      const deletedService = await SeasonCare.delete(id);
      
      if (!deletedService) {
        return res.status(404).json({ error: '시즌케어 내역을 찾을 수 없습니다.' });
      }
      
      res.json({ message: '시즌케어 내역이 성공적으로 삭제되었습니다.' });
    } catch (error) {      res.status(500).json({ error: '시즌케어 삭제에 실패했습니다.' });
    }
  },

  async getCustomerList(req, res) {
    try {      const seasonCares = await SeasonCare.getAll();      const customerMap = new Map();
      
      // 전화번호별로 데이터를 그룹화
      seasonCares.forEach(seasonCare => {
        const phone = seasonCare.customer_phone;
        const isPackage = !seasonCare.parent_package_id; // parent_package_id가 없으면 패키지
        
        if (!customerMap.has(phone)) {
          customerMap.set(phone, {
            packages: [], // 패키지 목록을 저장
            services: []  // 서비스 사용 기록 저장
          });
        }
        
        const customer = customerMap.get(phone);
        
        if (isPackage) {
          // 패키지인 경우
          customer.packages.push(seasonCare);
        } else {
          // 서비스 사용 기록인 경우
          customer.services.push(seasonCare);
        }
      });

      // 패키지별로 별도의 고객 항목 생성
      const customers = [];
      
      customerMap.forEach((data, phone) => {
        data.packages.forEach(pkg => {
          // 해당 패키지의 서비스 사용 기록 개수 계산
          const serviceUsages = data.services.filter(service => service.parent_package_id === pkg.id);

          // DB의 remaining_count가 이미 서비스 사용에 따라 정확하게 관리되므로
          // 추가적인 계산 없이 DB 값을 그대로 사용
          const actualRemaining = pkg.remaining_count;          // 패키지가 존재하는 경우 표시 (남은 횟수가 0이어도 표시)
          if (true) {
            // 해당 패키지와 관련된 모든 서비스에서 가장 최근 날짜 찾기
            const relatedServices = [pkg, ...serviceUsages];
            const lastServiceDate = relatedServices
              .map(s => new Date(s.service_date))
              .sort((a, b) => b - a)[0];
            
            customers.push({
              id: pkg.id,
              name: pkg.customer_name,
              phone: pkg.customer_phone,
              last_service: lastServiceDate.toISOString().split('T')[0],
              total_services: 1, // 패키지 하나당 1개
              total_amount: parseFloat(pkg.price) || 0,
              total_remaining: actualRemaining,
              package_types: [pkg.package_type],
              package_type: pkg.package_type, // 단일 패키지 타입
              remaining_count: actualRemaining // 호환성을 위해 추가
            });
          }
        });
      });
      
      // 최근 서비스 날짜 순으로 정렬
      customers.sort((a, b) => new Date(b.last_service) - new Date(a.last_service));      res.json(customers);
    } catch (error) {      res.status(500).json({ error: '시즌케어 고객 목록을 가져오는데 실패했습니다.' });
    }
  },

  async addService(req, res) {
    try {
      const { customer_phone, package_id, service_date, service_content, branch } = req.body;      // package_id가 있으면 전화번호는 선택사항, 없으면 전화번호 필수
      if (!package_id && !customer_phone) {
        return res.status(400).json({ 
          error: '패키지 ID 또는 고객 전화번호가 필요합니다.' 
        });
      }
      
      if (!service_date || !service_content) {
        return res.status(400).json({ 
          error: '서비스 날짜, 서비스 내용은 필수입니다.' 
        });
      }
      
      const newService = await SeasonCare.addService({
        customer_phone,
        package_id,
        service_date,
        service_content,
        branch: branch || '곤지암'
      });

      if (!newService) {
        // 조용히 처리 - 패키지를 찾을 수 없거나 남은 횟수가 없는 경우
        return res.status(200).json({
          message: '서비스 추가를 건너뛰었습니다. (패키지 없음 또는 횟수 소진)',
          skipped: true
        });
      }

      res.status(201).json(newService);
    } catch (error) {      res.status(400).json({ error: error.message || '서비스 추가에 실패했습니다.' });
    }
  },

  async updateCustomerInfo(req, res) {
    try {
      const { oldPhone, newName, newPhone } = req.body;
      
      if (!oldPhone || !newName || !newPhone) {
        return res.status(400).json({ 
          error: '기존 전화번호, 새로운 이름, 새로운 전화번호는 모두 필수입니다.' 
        });
      }
      
      const result = await SeasonCare.updateCustomerInfo(oldPhone, newName, newPhone);
      
      res.json({ 
        message: '고객 정보가 성공적으로 업데이트되었습니다.',
        updatedCount: result
      });
    } catch (error) {      res.status(500).json({ error: '고객 정보 수정에 실패했습니다.' });
    }
  },

  async generateSampleData(req, res) {
    try {
      const result = SeasonCare.generateSampleData();
      res.json({
        message: '시즌케어 샘플 데이터 생성 완료',
        totalRecords: result.length
      });
    } catch (error) {      res.status(500).json({ error: '샘플 데이터 생성에 실패했습니다.' });
    }
  },

  async clearAllData(req, res) {
    try {
      SeasonCare.clearAllData();
      res.json({ message: '모든 시즌케어 데이터가 초기화되었습니다.' });
    } catch (error) {      res.status(500).json({ error: '데이터 초기화에 실패했습니다.' });
    }
  }
};

module.exports = seasonCareController;