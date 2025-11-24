const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://your-project.supabase.co'; // 여기에 실제 Supabase URL 입력
const supabaseKey = 'your-supabase-anon-key'; // 여기에 실제 Supabase Key 입력

const supabase = createClient(supabaseUrl, supabaseKey);

// 랜덤 쿠폰 번호 생성 (대문자 + 숫자)
function generateCouponNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let couponNumber = '';
  for (let i = 0; i < 12; i++) {
    couponNumber += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return couponNumber;
}

// 쿠폰 100개 생성
async function generateDiscountCoupons() {
  const coupons = [];
  const generatedNumbers = new Set();

  // 중복되지 않는 100개의 쿠폰 번호 생성
  while (generatedNumbers.size < 100) {
    const couponNumber = generateCouponNumber();
    if (!generatedNumbers.has(couponNumber)) {
      generatedNumbers.add(couponNumber);
      coupons.push({
        coupon_number: couponNumber,
        coupon_type: 'discount',
        discount_amount: 30,
        status: 'unused',
        issued_to_customer: null,
        notes: '30% 할인 쿠폰'
      });
    }
  }

  console.log('생성된 쿠폰 100개:');
  coupons.forEach((coupon, index) => {
    console.log(`${index + 1}. ${coupon.coupon_number}`);
  });

  // Supabase에 삽입
  try {
    const { data, error } = await supabase
      .from('coupons')
      .insert(coupons);

    if (error) {
      console.error('쿠폰 생성 실패:', error);
    } else {
      console.log('\n✅ 30% 할인 쿠폰 100개가 성공적으로 생성되었습니다!');
    }
  } catch (err) {
    console.error('오류 발생:', err);
  }
}

generateDiscountCoupons();
