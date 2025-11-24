-- 시즌케어 테이블에 누락된 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

-- equipment_type 컬럼 추가
ALTER TABLE season_care ADD COLUMN IF NOT EXISTS equipment_type VARCHAR(50);

-- equipment_brand 컬럼 추가 (ski_brand와 동일한 의미지만 코드에서 사용)
ALTER TABLE season_care ADD COLUMN IF NOT EXISTS equipment_brand VARCHAR(100);

-- equipment_model 컬럼 추가 (ski_model과 동일한 의미지만 코드에서 사용)
ALTER TABLE season_care ADD COLUMN IF NOT EXISTS equipment_model VARCHAR(100);

-- service_items 컬럼 추가
ALTER TABLE season_care ADD COLUMN IF NOT EXISTS service_items TEXT;

-- total_cost 컬럼 추가
ALTER TABLE season_care ADD COLUMN IF NOT EXISTS total_cost VARCHAR(50);

-- payment_status 컬럼 추가
ALTER TABLE season_care ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50);

-- pickup_scheduled 컬럼 추가
ALTER TABLE season_care ADD COLUMN IF NOT EXISTS pickup_scheduled BOOLEAN DEFAULT false;

-- customer_memo 컬럼 추가 (season_memo와 별도로 필요)
ALTER TABLE season_care ADD COLUMN IF NOT EXISTS customer_memo TEXT;

-- 기존 데이터 마이그레이션 (있는 경우)
-- ski_brand -> equipment_brand
UPDATE season_care SET equipment_brand = ski_brand WHERE equipment_brand IS NULL AND ski_brand IS NOT NULL;

-- ski_model -> equipment_model
UPDATE season_care SET equipment_model = ski_model WHERE equipment_model IS NULL AND ski_model IS NOT NULL;

-- season_memo -> customer_memo
UPDATE season_care SET customer_memo = season_memo WHERE customer_memo IS NULL AND season_memo IS NOT NULL;

-- is_picked_up -> pickup_scheduled
UPDATE season_care SET pickup_scheduled = is_picked_up WHERE is_picked_up IS NOT NULL;
