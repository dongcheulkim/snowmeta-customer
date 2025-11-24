-- 쿠폰 타입 및 할인율 필드 추가
-- Supabase SQL Editor에서 실행

-- coupon_type 컬럼 추가 ('free': 무료 1회, 'discount': 30% 할인)
ALTER TABLE coupons
ADD COLUMN IF NOT EXISTS coupon_type VARCHAR(20) DEFAULT 'free';

-- discount_amount 컬럼 추가 (할인율, discount 타입은 30% 고정)
ALTER TABLE coupons
ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT NULL;

-- 기존 쿠폰들은 모두 무료 쿠폰으로 설정
UPDATE coupons
SET coupon_type = 'free'
WHERE coupon_type IS NULL;
