-- ============================================
-- 스노우메타 고객관리 시스템 - 완전한 Supabase 스키마
-- ============================================
-- 사용법: 기존 테이블을 모두 삭제하고 이 SQL을 전체 복사해서 Supabase SQL Editor에 붙여넣고 RUN
-- ============================================

-- 기존 테이블 삭제 (있는 경우)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS ambassadors CASCADE;
DROP TABLE IF EXISTS promo_athletes CASCADE;
DROP TABLE IF EXISTS season_care CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- 1. 일반 서비스 테이블
-- ============================================
CREATE TABLE services (
    id BIGSERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_memo TEXT,
    service_description TEXT,
    total_cost VARCHAR(50),
    service_date DATE,
    payment_status VARCHAR(50),
    branch VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. 시즌케어 테이블
-- ============================================
CREATE TABLE season_care (
    id BIGSERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_memo TEXT,
    equipment_type VARCHAR(50),
    equipment_brand VARCHAR(100),
    equipment_model VARCHAR(100),
    service_date DATE,
    service_description TEXT,
    service_items TEXT,
    total_cost VARCHAR(50),
    payment_status VARCHAR(50),
    branch VARCHAR(100),
    storage_location VARCHAR(255),
    pickup_date DATE,
    pickup_scheduled BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. 프로모션 선수 테이블
-- ============================================
CREATE TABLE promo_athletes (
    id BIGSERIAL PRIMARY KEY,
    athlete_name VARCHAR(255) NOT NULL,
    athlete_phone VARCHAR(50) NOT NULL,
    boot_size VARCHAR(50),
    branch VARCHAR(100),
    ski_brand VARCHAR(100),
    ski_model VARCHAR(100),
    ski_length VARCHAR(50),
    equipment TEXT,
    equipments JSONB,
    instagram_id VARCHAR(100),
    service_date DATE,
    service_description TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. 앰버서더 테이블
-- ============================================
CREATE TABLE ambassadors (
    id BIGSERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    service_description TEXT,
    service_date DATE,
    branch VARCHAR(100),
    customer_memo TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. 일정 테이블
-- ============================================
CREATE TABLE schedules (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    location VARCHAR(255),
    organizer VARCHAR(255),
    participants TEXT,
    description TEXT,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. 메시지 테이블
-- ============================================
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    sender VARCHAR(100) NOT NULL,
    sender_icon VARCHAR(50),
    message TEXT NOT NULL,
    branch VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. 사용자 테이블 (로그인용)
-- ============================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    branch_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 인덱스 생성 (성능 최적화)
-- ============================================

-- services 테이블 인덱스
CREATE INDEX idx_services_phone ON services(customer_phone);
CREATE INDEX idx_services_date ON services(service_date);
CREATE INDEX idx_services_branch ON services(branch);
CREATE INDEX idx_services_payment ON services(payment_status);

-- season_care 테이블 인덱스
CREATE INDEX idx_season_care_phone ON season_care(customer_phone);
CREATE INDEX idx_season_care_date ON season_care(service_date);
CREATE INDEX idx_season_care_branch ON season_care(branch);
CREATE INDEX idx_season_care_payment ON season_care(payment_status);

-- promo_athletes 테이블 인덱스
CREATE INDEX idx_promo_athletes_phone ON promo_athletes(athlete_phone);
CREATE INDEX idx_promo_athletes_date ON promo_athletes(service_date);
CREATE INDEX idx_promo_athletes_branch ON promo_athletes(branch);

-- ambassadors 테이블 인덱스
CREATE INDEX idx_ambassadors_phone ON ambassadors(customer_phone);
CREATE INDEX idx_ambassadors_date ON ambassadors(service_date);
CREATE INDEX idx_ambassadors_branch ON ambassadors(branch);

-- schedules 테이블 인덱스
CREATE INDEX idx_schedules_start_date ON schedules(start_date);
CREATE INDEX idx_schedules_event_type ON schedules(event_type);
CREATE INDEX idx_schedules_status ON schedules(status);

-- messages 테이블 인덱스
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_messages_branch ON messages(branch);

-- users 테이블 인덱스
CREATE INDEX idx_users_username ON users(username);

-- ============================================
-- 트리거 함수: updated_at 자동 업데이트
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- 트리거 생성
-- ============================================
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_season_care_updated_at
    BEFORE UPDATE ON season_care
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promo_athletes_updated_at
    BEFORE UPDATE ON promo_athletes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ambassadors_updated_at
    BEFORE UPDATE ON ambassadors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) 활성화
-- ============================================
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_care ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS 정책 (모든 사용자가 읽기/쓰기 가능)
-- ============================================

-- services 테이블 정책
CREATE POLICY "Enable all access for services" ON services FOR ALL USING (true) WITH CHECK (true);

-- season_care 테이블 정책
CREATE POLICY "Enable all access for season_care" ON season_care FOR ALL USING (true) WITH CHECK (true);

-- promo_athletes 테이블 정책
CREATE POLICY "Enable all access for promo_athletes" ON promo_athletes FOR ALL USING (true) WITH CHECK (true);

-- ambassadors 테이블 정책
CREATE POLICY "Enable all access for ambassadors" ON ambassadors FOR ALL USING (true) WITH CHECK (true);

-- schedules 테이블 정책
CREATE POLICY "Enable all access for schedules" ON schedules FOR ALL USING (true) WITH CHECK (true);

-- messages 테이블 정책
CREATE POLICY "Enable all access for messages" ON messages FOR ALL USING (true) WITH CHECK (true);

-- users 테이블 정책
CREATE POLICY "Enable all access for users" ON users FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 샘플 데이터 삽입
-- ============================================

-- season_care 샘플 데이터
INSERT INTO season_care (customer_name, customer_phone, customer_memo, service_date, service_description, total_cost, payment_status, notes) VALUES
('박영희', '010-1111-2222', 'VIP 고객 - 매년 시즌권 구매', '2025-10-15', '스키 풀튜닝', '300000', 'paid', '첫 등록'),
('이철수', '010-3333-4444', '단골 고객', '2025-10-16', '왁싱', '150000', 'paid', NULL),
('김민수', '010-5555-6666', '프리미엄 고객', '2025-10-15', '스키 풀튜닝 + 보드 튜닝', '450000', 'paid', '15회권 첫 등록'),
('최지우', '010-7777-8888', '단골 고객 - 매년 5회권 구매', '2025-10-16', '엣지 작업 완료', '150000', 'paid', '수정 테스트 - 작업 완료됨'),
('정현우', '010-9999-0000', 'VIP - 5년차', '2025-10-14', '왁싱 + 베이스 리페어', '300000', 'paid', '10회권 시작'),
('한소희', '010-1234-5678', '엠버서더 등급', '2025-10-13', '스키 풀튜닝', '600000', 'paid', '20회권 프리미엄'),
('테스트고객', '010-9999-9999', NULL, '2025-10-22', '테스트 서비스', '375000', 'paid', '테스트'),
('테스트', '010-1234-5678', NULL, '2025-10-23', '테스트', '375000', 'paid', NULL),
('11123123', '123-1231-2', NULL, '2025-10-23', '123123', '375000', 'paid', NULL);

-- ============================================
-- 완료!
-- ============================================
-- 이제 앱을 테스트하세요.
