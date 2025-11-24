-- 일반정비 테이블에 customer_memo 컬럼 추가
ALTER TABLE general_services
ADD COLUMN IF NOT EXISTS customer_memo VARCHAR(255);

-- 컬럼 추가 확인
COMMENT ON COLUMN general_services.customer_memo IS '고객 메모 (예: 25-26 엠버서더)';
