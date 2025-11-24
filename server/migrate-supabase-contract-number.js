/**
 * Supabase 시즌케어 테이블에 contract_number 컬럼 추가 마이그레이션
 *
 * 사용 전 설정:
 * 1. npm install @supabase/supabase-js (이미 설치되어 있음)
 * 2. .env에 SUPABASE_URL, SUPABASE_SERVICE_KEY 추가
 *
 * 사용법: node migrate-supabase-contract-number.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase 설정 (환경변수 또는 직접 입력)
const supabaseUrl = process.env.SUPABASE_URL || 'https://cdboaczqtigxpzgahizy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkYm9hY3pxdGlneHB6Z2FoaXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMzk1ODgsImV4cCI6MjA3NjYxNTU4OH0.S1QoxWiU2hQEDuMLOT7VzO0koSpo8mHxfCXS1bWFPCw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateSupabaseContractNumber() {
  console.log('🔄 Supabase 시즌케어 테이블 마이그레이션 시작...\n');

  try {
    // 1. 테이블 구조 확인
    console.log('📊 현재 테이블 확인 중...');
    const { data: existingData, error: checkError } = await supabase
      .from('season_care')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('❌ 테이블 접근 오류:', checkError.message);
      throw checkError;
    }

    // contract_number 컬럼이 있는지 확인
    if (existingData && existingData.length > 0) {
      if ('contract_number' in existingData[0]) {
        console.log('✅ contract_number 컬럼이 이미 존재합니다.\n');
      } else {
        console.log('⚠️  contract_number 컬럼이 없습니다.');
        console.log('📝 Supabase SQL Editor에서 다음 SQL을 실행해주세요:\n');
        console.log('---SQL 시작---');
        console.log('ALTER TABLE season_care ADD COLUMN contract_number INTEGER DEFAULT 1;');
        console.log('CREATE INDEX idx_season_care_contract ON season_care(customer_phone, contract_number);');
        console.log('---SQL 종료---\n');

        console.log('💡 실행 방법:');
        console.log('   1. https://supabase.com/dashboard 접속');
        console.log('   2. 프로젝트 선택');
        console.log('   3. 왼쪽 메뉴에서 "SQL Editor" 클릭');
        console.log('   4. 위 SQL 복사해서 실행\n');
        return;
      }
    }

    // 2. 기존 데이터 업데이트
    console.log('📝 기존 데이터 분석 중...\n');

    // 모든 고객의 전화번호 목록
    const { data: customers, error: customerError } = await supabase
      .from('season_care')
      .select('customer_phone')
      .not('customer_phone', 'is', null);

    if (customerError) {
      throw customerError;
    }

    // 중복 제거
    const uniquePhones = [...new Set(customers.map(c => c.customer_phone))];
    console.log(`📱 총 ${uniquePhones.length}명의 고객 발견\n`);

    // 각 고객별로 계약 번호 설정
    for (const phone of uniquePhones) {
      // 해당 고객의 모든 기록 가져오기
      const { data: records, error: recordError } = await supabase
        .from('season_care')
        .select('*')
        .eq('customer_phone', phone)
        .order('service_date', { ascending: true })
        .order('id', { ascending: true });

      if (recordError) {
        console.error(`❌ ${phone} 기록 조회 오류:`, recordError.message);
        continue;
      }

      let currentContractNumber = 1;
      let remainingCount = 0;
      let totalCount = 0;

      for (let i = 0; i < records.length; i++) {
        const record = records[i];

        // 첫 번째 기록이거나 이전 계약이 모두 소진된 경우
        if (i === 0 || remainingCount <= 0) {
          if (i > 0) {
            currentContractNumber++;
          }

          // season_count에서 총 횟수 계산
          if (record.season_count) {
            const seasonCount = record.season_count;
            if (seasonCount.includes('+')) {
              const parts = seasonCount.split('+');
              const baseCount = parseInt(parts[0]) || 0;
              const bonusCount = parts[1] === '왁' ? 1 : parseInt(parts[1]) || 0;
              totalCount = baseCount + bonusCount;
            } else {
              totalCount = parseInt(seasonCount) || 0;
            }
            remainingCount = totalCount;
          }
        }

        // contract_number 업데이트
        const { error: updateError } = await supabase
          .from('season_care')
          .update({ contract_number: currentContractNumber })
          .eq('id', record.id);

        if (updateError) {
          console.error(`❌ ID ${record.id} 업데이트 오류:`, updateError.message);
        }

        remainingCount--;
      }

      console.log(`✅ ${phone}: ${records.length}개 기록 업데이트 (계약 ${currentContractNumber}개)`);
    }

    console.log('\n🎉 마이그레이션이 성공적으로 완료되었습니다!\n');

    // 검증
    console.log('🔍 마이그레이션 검증 중...\n');
    const { data: verification, error: verifyError } = await supabase
      .from('season_care')
      .select('customer_phone, contract_number, service_date')
      .order('customer_phone')
      .order('contract_number')
      .limit(10);

    if (!verifyError && verification) {
      console.log('📋 샘플 데이터 (처음 10개):');
      verification.forEach(row => {
        console.log(`   ${row.customer_phone} - 계약#${row.contract_number} (${row.service_date})`);
      });
    }

  } catch (error) {
    console.error('\n❌ 마이그레이션 중 오류 발생:', error.message);
    throw error;
  }
}

// 실행
migrateSupabaseContractNumber()
  .then(() => {
    console.log('\n✅ 스크립트 종료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
