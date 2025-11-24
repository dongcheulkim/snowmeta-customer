const db = require('./config/database');

console.log('시즌케어 샘플 데이터 생성 시작...');

const surnames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
const givenNames = ['민수', '지영', '현우', '수진', '태현', '은지', '동혁', '혜원', '성호', '미영'];
const branches = ['곤지암점', '대관령점', '비발디점'];
const seasonCounts = ['5+왁', '10+1'];
const prices = ['550000', '750000'];
const descriptions = [
  '로시뇰 165 S/B/F',
  '살로몬 160 풀튜닝',
  '아토믹 170 엣지작업',
  '피셔 175 왁싱',
  'K2 180 스톤그라인딩',
  '헤드 165 S/B',
  '볼클 170 풀세팅',
  '에란 155 베이스수리',
  '로시뇰 170 풀튜닝',
  '살로몬 165 엣지/왁싱'
];

const paymentStatuses = ['paid', 'paid', 'paid', 'paid', 'unpaid'];

const generateRandomPhone = () => {
  const middle = Math.floor(Math.random() * 9000) + 1000;
  const last = Math.floor(Math.random() * 9000) + 1000;
  return `010-${middle}-${last}`;
};

const generateRandomDate = () => {
  const start = new Date(2025, 9, 1); // 2025년 10월 1일
  const end = new Date(2025, 9, 9); // 2025년 10월 9일
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime).toISOString().split('T')[0];
};

try {
  for (let i = 0; i < 10; i++) {
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const givenName = givenNames[Math.floor(Math.random() * givenNames.length)];
    const customerName = surname + givenName;
    const customerPhone = generateRandomPhone();
    const branch = branches[Math.floor(Math.random() * branches.length)];
    const seasonCountIndex = Math.floor(Math.random() * seasonCounts.length);
    const seasonCount = seasonCounts[seasonCountIndex];
    const price = prices[seasonCountIndex];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    const serviceDate = generateRandomDate();
    const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
    const notes = Math.random() > 0.5 ? '25-26 시즌' : '';

    const stmt = db.prepare(`
      INSERT INTO season_care (
        customer_name, customer_phone, season_count, price, payment_location,
        service_date, service_description, notes, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      customerName,
      customerPhone,
      seasonCount,
      price,
      branch,
      serviceDate,
      description,
      notes,
      paymentStatus
    );

    console.log(`${i + 1}. ${customerName} (${seasonCount}, ${branch}) 추가 완료`);
  }

  console.log('\n✅ 시즌케어 샘플 데이터 10건 생성 완료!');

  // 확인
  const count = db.prepare('SELECT COUNT(*) as count FROM season_care').get();
  console.log(`총 시즌케어 데이터: ${count.count}건`);

} catch (error) {
  console.error('데이터 생성 실패:', error);
} finally {
  db.close();
}
