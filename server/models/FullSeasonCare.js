const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 설정
const supabaseUrl = process.env.SUPABASE_URL || 'https://cdboaczqtigxpzgahizy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkYm9hY3pxdGlneHB6Z2FoaXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMzk1ODgsImV4cCI6MjA3NjYxNTU4OH0.S1QoxWiU2hQEDuMLOT7VzO0koSpo8mHxfCXS1bWFPCw';

const supabase = createClient(supabaseUrl, supabaseKey);

class FullSeasonCare {
  static async getAll() {
    try {
      const { data, error } = await supabase
        .from('full_season_care')
        .select('*')
        .order('service_date', { ascending: false });

      if (error) throw error;

      return data.map(row => ({
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
      const { data, error } = await supabase
        .from('full_season_care')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async getByCustomerPhone(customerPhone) {
    try {
      const { data, error } = await supabase
        .from('full_season_care')
        .select('*')
        .eq('customer_phone', customerPhone)
        .order('contract_number', { ascending: false })
        .order('service_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  // 고객의 최신 계약 번호 조회
  static async getLatestContractNumber(customerPhone) {
    try {
      const { data, error } = await supabase
        .from('full_season_care')
        .select('contract_number')
        .eq('customer_phone', customerPhone)
        .order('contract_number', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data && data.length > 0 ? data[0].contract_number : 0;
    } catch (error) {
      throw error;
    }
  }

  // 특정 계약의 등록된 횟수와 총 횟수 확인
  static async getContractUsage(customerPhone, contractNumber) {
    try {
      // 해당 계약의 모든 기록 조회
      const { data: allRecords, error: allError } = await supabase
        .from('full_season_care')
        .select('season_count')
        .eq('customer_phone', customerPhone)
        .eq('contract_number', contractNumber);

      if (allError) throw allError;

      if (!allRecords || allRecords.length === 0) {
        return { totalCount: 0, usedCount: 0 };
      }

      // season_count가 있는 첫 번째 레코드 찾기
      const firstRecord = allRecords.find(record => record.season_count);

      if (!firstRecord) {
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

      // 사용된 횟수는 이미 조회한 allRecords 사용
      const usedCount = allRecords.length;

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
      let contractNumber;

      if (seasonCareData.contract_number) {
        // "서비스 추가"로 등록 - 기존 계약 번호 사용
        contractNumber = seasonCareData.contract_number;
      } else {
        // "새 풀시즌케어"로 등록 - 새 계약 번호 생성
        const latestContractNumber = await this.getLatestContractNumber(customer_phone);
        contractNumber = latestContractNumber + 1;
      }

      const { data, error } = await supabase
        .from('full_season_care')
        .insert([{
          customer_name,
          customer_phone,
          customer_memo: customer_memo || null,
          season_count: season_count || null,
          total_cost: price || null,
          payment_location: payment_location || null,
          service_date,
          service_description: service_description || null,
          notes: notes || null,
          payment_status: payment_status || '미결제',
          contract_number: contractNumber
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
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

      const { data, error } = await supabase
        .from('full_season_care')
        .update({
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
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const seasonCare = await this.getById(id);

      const { error } = await supabase
        .from('full_season_care')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return seasonCare;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = FullSeasonCare;
