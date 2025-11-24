-- SnowMeta 고객관리 시스템 데이터베이스 스키마 (Supabase용)

-- 기존 테이블 삭제
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS season_care CASCADE;
DROP TABLE IF EXISTS promo_athletes CASCADE;
DROP TABLE IF EXISTS ambassadors CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS branch_messages CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. 서비스 테이블 (일반정비)
CREATE TABLE IF NOT EXISTS services (
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

-- 2. 시즌케어 테이블
CREATE TABLE IF NOT EXISTS season_care (
    id BIGSERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_memo TEXT,
    ski_brand VARCHAR(100),
    ski_model VARCHAR(100),
    ski_length VARCHAR(50),
    service_date DATE,
    service_description TEXT,
    total_cost VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    branch VARCHAR(100),
    season_memo TEXT,
    storage_location VARCHAR(255),
    pickup_date DATE,
    is_picked_up BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 프로모션 선수 테이블
CREATE TABLE IF NOT EXISTS promo_athletes (
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
    service_date DATE,
    service_content TEXT,
    athlete_memo TEXT,
    notes TEXT,
    instagram_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. 앰버서더 테이블
CREATE TABLE IF NOT EXISTS ambassadors (
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

-- 5. 일정 테이블
CREATE TABLE IF NOT EXISTS schedules (
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

-- 6. 메시지 테이블
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    sender VARCHAR(100) NOT NULL,
    sender_icon VARCHAR(50),
    message TEXT NOT NULL,
    branch VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. 지점 메시지 테이블
CREATE TABLE IF NOT EXISTS branch_messages (
    id BIGSERIAL PRIMARY KEY,
    branch_name TEXT NOT NULL,
    message TEXT NOT NULL,
    sender TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 사용자 테이블 (로그인용)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    branch_name VARCHAR(100) NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_services_phone ON services(customer_phone);
CREATE INDEX IF NOT EXISTS idx_services_date ON services(service_date);
CREATE INDEX IF NOT EXISTS idx_services_branch ON services(branch);

CREATE INDEX IF NOT EXISTS idx_season_care_phone ON season_care(customer_phone);
CREATE INDEX IF NOT EXISTS idx_season_care_date ON season_care(service_date);

CREATE INDEX IF NOT EXISTS idx_promo_athletes_phone ON promo_athletes(athlete_phone);
CREATE INDEX IF NOT EXISTS idx_promo_athletes_date ON promo_athletes(service_date);

CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(start_date);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_branch_messages_branch ON branch_messages(branch_name);
CREATE INDEX IF NOT EXISTS idx_branch_messages_date ON branch_messages(created_at);

-- 자동 업데이트 타임스탬프 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_season_care_updated_at BEFORE UPDATE ON season_care
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promo_athletes_updated_at BEFORE UPDATE ON promo_athletes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ambassadors_updated_at BEFORE UPDATE ON ambassadors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 기본 사용자 계정 삽입 (비밀번호는 나중에 bcrypt로 해싱해야 함)
-- 임시로 평문 비밀번호 저장 (나중에 변경 필요)
INSERT INTO users (username, password, branch_name, is_admin) VALUES
('admin', 'admin123', '관리자', true),
('gonjiam', 'gonjiam123', '곤지암', false),
('daegwallyeong', 'daegwallyeong123', '대관령', false),
('vivaldi', 'vivaldi123', '비발디', false)
ON CONFLICT (username) DO NOTHING;

-- RLS (Row Level Security) 설정 - 보안을 위해
-- 일단 비활성화 (나중에 필요하면 활성화)
-- ALTER TABLE services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE season_care ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE promo_athletes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ambassadors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 샘플 데이터 삽입
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

-- 완료!
SELECT 'SnowMeta 데이터베이스 스키마가 성공적으로 생성되었습니다!' as status;
