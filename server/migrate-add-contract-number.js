/**
 * 시즌케어 테이블에 contract_number 컬럼 추가 마이그레이션
 *
 * 사용법: node migrate-add-contract-number.js
 */

const db = require('./config/database');

function migrateAddContractNumber() {
  console.log('🔄 시즌케어 테이블 마이그레이션 시작...\n');

  try {
    // 1. contract_number 컬럼이 이미 있는지 확인
    const tableInfo = db.prepare('PRAGMA table_info(season_care)').all();
    const hasContractNumber = tableInfo.some(col => col.name === 'contract_number');

    if (hasContractNumber) {
      console.log('✅ contract_number 컬럼이 이미 존재합니다.');
      console.log('   마이그레이션을 건너뜁니다.\n');
      return;
    }

    // 2. contract_number 컬럼 추가
    console.log('📝 contract_number 컬럼 추가 중...');
    db.prepare('ALTER TABLE season_care ADD COLUMN contract_number INTEGER DEFAULT 1').run();
    console.log('✅ contract_number 컬럼 추가 완료\n');

    // 3. 기존 데이터에 contract_number 설정
    console.log('📊 기존 데이터 업데이트 중...');

    // 모든 고객의 전화번호 목록 가져오기
    const customers = db.prepare(`
      SELECT DISTINCT customer_phone
      FROM season_care
      WHERE customer_phone IS NOT NULL
    `).all();

    let updatedCount = 0;

    for (const customer of customers) {
      const phone = customer.customer_phone;

      // 각 고객의 시즌케어 기록을 날짜순으로 가져오기
      const records = db.prepare(`
        SELECT id, season_count
        FROM season_care
        WHERE customer_phone = ?
        ORDER BY service_date ASC, id ASC
      `).all(phone);

      let currentContractNumber = 1;
      let remainingCount = 0;
      let totalCount = 0;

      for (let i = 0; i < records.length; i++) {
        const record = records[i];

        // 첫 번째 기록이거나 이전 계약이 모두 소진된 경우
        if (i === 0 || remainingCount <= 0) {
          // 새 계약 시작
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
        db.prepare(`
          UPDATE season_care
          SET contract_number = ?
          WHERE id = ?
        `).run(currentContractNumber, record.id);

        remainingCount--;
        updatedCount++;
      }

      console.log(`   ${phone}: ${records.length}개 기록 업데이트 (계약 ${currentContractNumber}개)`);
    }

    console.log(`\n✅ 총 ${updatedCount}개 기록 업데이트 완료\n`);

    // 4. 검증
    console.log('🔍 마이그레이션 검증 중...\n');
    const verification = db.prepare(`
      SELECT
        customer_phone,
        contract_number,
        COUNT(*) as count,
        MIN(service_date) as first_date,
        MAX(service_date) as last_date
      FROM season_care
      GROUP BY customer_phone, contract_number
      ORDER BY customer_phone, contract_number
    `).all();

    console.log('📋 계약별 통계:');
    verification.forEach(row => {
      console.log(`   ${row.customer_phone} - 계약#${row.contract_number}: ${row.count}회 (${row.first_date} ~ ${row.last_date})`);
    });

    console.log('\n🎉 마이그레이션이 성공적으로 완료되었습니다!\n');

  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
    throw error;
  }
}

// 실행
try {
  migrateAddContractNumber();
  console.log('✅ 스크립트 종료');
  process.exit(0);
} catch (error) {
  console.error('❌ 스크립트 실행 실패:', error);
  process.exit(1);
}
