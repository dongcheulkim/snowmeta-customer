const PromoAthlete = require('../models/PromoAthleteSQLite');

const promoAthleteController = {
  getAllPromoAthletes(req, res) {
    try {
      const records = PromoAthlete.getAll();
      res.json(records);
    } catch (error) {      res.status(500).json({ error: '프로모션 선수 목록을 가져오는데 실패했습니다.' });
    }
  },

  getPromoAthleteById(req, res) {
    try {
      const { id } = req.params;
      const record = PromoAthlete.getById(id);

      if (!record) {
        return res.status(404).json({ error: '프로모션 선수 기록을 찾을 수 없습니다.' });
      }

      res.json(record);
    } catch (error) {      res.status(500).json({ error: '프로모션 선수 정보를 가져오는데 실패했습니다.' });
    }
  },

  getPromoAthletesByPhone(req, res) {
    try {
      const { athletePhone } = req.params;      const records = PromoAthlete.getByAthletePhone(decodeURIComponent(athletePhone));      res.json(records);
    } catch (error) {      res.status(500).json({ error: '프로모션 선수 기록을 가져오는데 실패했습니다.' });
    }
  },

  createPromoAthlete(req, res) {
    try {      // 프론트엔드에서 보내는 필드명 처리
      const {
        name,
        phone,
        bootSize,
        branch,
        athlete_memo,
        equipment,
        maintenanceHistory,
        notes,
        equipments,
        // 추가 장비 정보
        ski_brand,
        ski_model,
        ski_length,
        binding_brand,
        binding_model,
        boot_brand,
        boot_model,
        instagram_id,
        youtube_id
      } = req.body;

      if (!name || !phone) {
        return res.status(400).json({
          error: '선수이름과 전화번호는 필수입니다.'
        });
      }

      // 백엔드 모델이 기대하는 필드명으로 변환
      const newRecord = PromoAthlete.create({
        athlete_name: name,
        athlete_phone: phone,
        boot_size: bootSize || null,
        service_date: new Date().toISOString().split('T')[0],
        equipment: equipment || null,
        service_content: maintenanceHistory || null,
        branch: branch || '곤지암',
        athlete_memo: athlete_memo || null,
        notes: notes || null,
        ski_brand: ski_brand || null,
        ski_model: ski_model || null,
        ski_length: ski_length || null,
        binding_brand: binding_brand || null,
        binding_model: binding_model || null,
        boot_brand: boot_brand || null,
        boot_model: boot_model || null,
        instagram_id: instagram_id || null,
        youtube_id: youtube_id || null
      });

      res.status(201).json(newRecord);
    } catch (error) {
      console.error('프로모션 선수 등록 오류:', error);
      res.status(500).json({ error: '프로모션 선수 등록에 실패했습니다.', details: error.message });
    }
  },

  updatePromoAthlete(req, res) {
    try {
      const { id } = req.params;      // 프론트엔드에서 보내는 필드명 처리
      const {
        name,
        phone,
        bootSize,
        branch,
        athlete_memo,
        equipment,
        maintenanceHistory,
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
      } = req.body;

      // 기존 데이터 조회해서 필수 필드 체크
      const existingRecord = PromoAthlete.getById(id);
      if (!existingRecord) {
        return res.status(404).json({ error: '프로모션 선수 기록을 찾을 수 없습니다.' });
      }

      // 필수 필드들이 있는지 확인 (기존 데이터 또는 새로운 데이터에서)
      const finalData = {
        athlete_name: name || existingRecord.athlete_name,
        athlete_phone: phone || existingRecord.athlete_phone,
        boot_size: bootSize !== undefined ? bootSize : existingRecord.boot_size,
        service_date: existingRecord.service_date,
        equipment: equipment !== undefined ? equipment : existingRecord.equipment,
        service_content: maintenanceHistory !== undefined ? maintenanceHistory : existingRecord.service_content,
        branch: branch !== undefined ? branch : (existingRecord.branch || '곤지암'),
        athlete_memo: athlete_memo !== undefined ? athlete_memo : existingRecord.athlete_memo,
        notes: notes !== undefined ? notes : existingRecord.notes,
        ski_brand: ski_brand !== undefined ? ski_brand : existingRecord.ski_brand,
        ski_model: ski_model !== undefined ? ski_model : existingRecord.ski_model,
        ski_length: ski_length !== undefined ? ski_length : existingRecord.ski_length,
        binding_brand: binding_brand !== undefined ? binding_brand : existingRecord.binding_brand,
        binding_model: binding_model !== undefined ? binding_model : existingRecord.binding_model,
        boot_brand: boot_brand !== undefined ? boot_brand : existingRecord.boot_brand,
        boot_model: boot_model !== undefined ? boot_model : existingRecord.boot_model,
        instagram_id: instagram_id !== undefined ? instagram_id : existingRecord.instagram_id,
        youtube_id: youtube_id !== undefined ? youtube_id : existingRecord.youtube_id
      };

      if (!finalData.athlete_name || !finalData.athlete_phone) {
        return res.status(400).json({
          error: '선수이름과 전화번호는 필수입니다.'
        });
      }

      const updatedRecord = PromoAthlete.update(id, finalData);

      if (!updatedRecord) {
        return res.status(404).json({ error: '프로모션 선수 기록을 찾을 수 없습니다.' });
      }

      res.json(updatedRecord);
    } catch (error) {      res.status(500).json({ error: '프로모션 선수 수정에 실패했습니다.' });
    }
  },

  deletePromoAthlete(req, res) {
    try {
      const { id } = req.params;
      const deletedRecord = PromoAthlete.delete(id);

      if (!deletedRecord) {
        return res.status(404).json({ error: '프로모션 선수 기록을 찾을 수 없습니다.' });
      }

      res.json({ message: '프로모션 선수 기록이 성공적으로 삭제되었습니다.' });
    } catch (error) {      res.status(500).json({ error: '프로모션 선수 삭제에 실패했습니다.' });
    }
  },

  getAthleteList(req, res) {
    try {
      const athletes = PromoAthlete.getAthleteList();
      res.json(athletes);
    } catch (error) {      res.status(500).json({ error: '프로모션 선수 목록을 가져오는데 실패했습니다.' });
    }
  },

  updateAthleteInfo(req, res) {
    try {
      const { athlete_phone, new_name, new_phone, new_boot_size, new_instagram_id, new_youtube_id } = req.body;

      if (!athlete_phone || !new_name || !new_phone) {
        return res.status(400).json({
          error: '기존 전화번호, 새로운 이름, 새로운 전화번호는 모두 필수입니다.'
        });
      }

      const result = PromoAthlete.updateAthleteInfo(athlete_phone, new_name, new_phone, new_boot_size, new_instagram_id, new_youtube_id);

      res.json({
        message: '선수 정보가 성공적으로 업데이트되었습니다.',
        updatedCount: result
      });
    } catch (error) {      res.status(500).json({ error: '선수 정보 수정에 실패했습니다.' });
    }
  },

  clearAllData(req, res) {
    try {
      PromoAthlete.clearAllData();
      res.json({ message: '모든 프로모션 선수 데이터가 초기화되었습니다.' });
    } catch (error) {      res.status(500).json({ error: '데이터 초기화에 실패했습니다.' });
    }
  }
};

module.exports = promoAthleteController;