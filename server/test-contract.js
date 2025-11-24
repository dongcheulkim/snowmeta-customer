const SeasonCare = require('./models/SeasonCare');

async function testContractNumber() {
  console.log('🧪 계약 번호 테스트 시작...\n');

  try {
    // 1. 현재 최신 계약 번호 확인
    const latestContract = await SeasonCare.getLatestContractNumber('123-123');
    console.log(`📋 현재 최신 계약 번호: ${latestContract}`);

    // 2. 새 시즌케어 등록
    console.log('\n📝 새 시즌케어 등록 중...');
    const newSeasonCare = await SeasonCare.create({
      customer_name: '테스트고객',
      customer_phone: '123-123',
      service_date: '2025-11-21',
      season_count: '10+1',
      price: '750000',
      payment_status: 'paid',
      payment_location: '곤지암'
    });

    console.log('\n✅ 등록 완료!');
    console.log(`   계약 번호: ${newSeasonCare.contract_number}`);
    console.log(`   ID: ${newSeasonCare.id}`);

    // 3. 다시 최신 계약 번호 확인
    const newLatestContract = await SeasonCare.getLatestContractNumber('123-123');
    console.log(`\n📋 업데이트된 최신 계약 번호: ${newLatestContract}`);

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error(error);
  }

  process.exit(0);
}

testContractNumber();
