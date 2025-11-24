-- 스노우메타 고객관리 데이터베이스 스키마

-- 고객 테이블
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 일반정비 서비스 테이블
CREATE TABLE IF NOT EXISTS general_services (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    vehicle_info JSONB, -- 차량 정보 (모델, 연식, 번호판 등)
    service_type VARCHAR(100) NOT NULL, -- 정비 유형 (정기점검, 오일교환, 타이어교체 등)
    service_description TEXT, -- 정비 상세 내용
    parts_used JSONB, -- 사용된 부품 목록 [{"name": "엔진오일", "quantity": 1, "price": 50000}]
    labor_hours DECIMAL(4,2), -- 작업 시간
    labor_cost INTEGER, -- 인건비
    parts_cost INTEGER, -- 부품비
    total_cost INTEGER NOT NULL, -- 총 비용
    technician_name VARCHAR(100), -- 담당 기술자
    service_status VARCHAR(50) DEFAULT 'completed', -- 서비스 상태 (scheduled, in_progress, completed, cancelled)
    notes TEXT, -- 추가 메모
    customer_memo VARCHAR(255), -- 고객 메모 (예: 25-26 엠버서더)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_general_services_customer_id ON general_services(customer_id);
CREATE INDEX IF NOT EXISTS idx_general_services_service_date ON general_services(service_date);
CREATE INDEX IF NOT EXISTS idx_general_services_service_type ON general_services(service_type);
CREATE INDEX IF NOT EXISTS idx_general_services_status ON general_services(service_status);
CREATE INDEX IF NOT EXISTS idx_season_care_customer_id ON season_care(customer_id);
CREATE INDEX IF NOT EXISTS idx_season_care_service_date ON season_care(service_date);
CREATE INDEX IF NOT EXISTS idx_season_care_package_type ON season_care(package_type);

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- customers 테이블 트리거
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- general_services 테이블 트리거
DROP TRIGGER IF EXISTS update_general_services_updated_at ON general_services;
CREATE TRIGGER update_general_services_updated_at 
    BEFORE UPDATE ON general_services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 시즌케어 테이블
CREATE TABLE IF NOT EXISTS season_care (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    package_type VARCHAR(50) NOT NULL CHECK (package_type IN ('5회+왁싱', '10회+1회')),
    total_count INTEGER NOT NULL,
    remaining_count INTEGER NOT NULL DEFAULT 0,
    service_date DATE NOT NULL,
    service_content TEXT NOT NULL,
    parent_package_id INTEGER REFERENCES season_care(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- season_care 테이블 트리거
DROP TRIGGER IF EXISTS update_season_care_updated_at ON season_care;
CREATE TRIGGER update_season_care_updated_at 
    BEFORE UPDATE ON season_care 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입 (선택사항)
-- INSERT INTO customers (name, email, phone, address) VALUES 
-- ('김철수', 'kim@example.com', '010-1234-5678', '서울시 강남구'),
-- ('이영희', 'lee@example.com', '010-9876-5432', '서울시 서초구');

-- INSERT INTO general_services (customer_id, service_date, vehicle_info, service_type, service_description, parts_used, labor_hours, labor_cost, parts_cost, total_cost, technician_name, notes) VALUES 
-- (1, '2024-01-15', '{"model": "현대 아반떼", "year": 2020, "plate": "12가3456"}', '정기점검', '6개월 정기점검 및 오일교환', '[{"name": "엔진오일", "quantity": 4, "price": 15000}, {"name": "오일필터", "quantity": 1, "price": 8000}]', 2.5, 50000, 23000, 73000, '박정비', '다음 점검은 6개월 후'),
-- (2, '2024-01-20', '{"model": "기아 K5", "year": 2019, "plate": "34나5678"}', '타이어교체', '겨울타이어 4개 교체', '[{"name": "겨울타이어", "quantity": 4, "price": 80000}]', 1.5, 30000, 320000, 350000, '이기술', '여름타이어는 창고에 보관');