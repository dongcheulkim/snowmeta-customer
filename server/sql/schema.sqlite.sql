-- SQLite 스키마

-- 일반정비 서비스 테이블
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    service_description TEXT NOT NULL,
    service_date TEXT NOT NULL,
    total_cost TEXT NOT NULL,
    payment_status TEXT DEFAULT 'unpaid',
    branch TEXT,
    notes TEXT,
    customer_memo TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 시즌케어 테이블
CREATE TABLE IF NOT EXISTS season_care (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_memo TEXT,
    season_count TEXT,
    price TEXT,
    payment_location TEXT,
    service_date TEXT NOT NULL,
    service_description TEXT,
    notes TEXT,
    payment_status TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_services_customer ON services(customer_name, customer_phone);
CREATE INDEX IF NOT EXISTS idx_services_date ON services(service_date);
CREATE INDEX IF NOT EXISTS idx_services_payment ON services(payment_status);

CREATE INDEX IF NOT EXISTS idx_season_care_customer ON season_care(customer_name, customer_phone);
CREATE INDEX IF NOT EXISTS idx_season_care_date ON season_care(service_date);

-- 프로모션 선수 테이블
CREATE TABLE IF NOT EXISTS promo_athletes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    athlete_name TEXT NOT NULL,
    athlete_phone TEXT NOT NULL,
    boot_size TEXT,
    branch TEXT DEFAULT '곤지암',
    service_date TEXT NOT NULL,
    equipment TEXT,
    service_content TEXT,
    notes TEXT,
    ski_brand TEXT,
    ski_model TEXT,
    ski_length TEXT,
    binding_brand TEXT,
    binding_model TEXT,
    boot_brand TEXT,
    boot_model TEXT,
    instagram_id TEXT,
    youtube_id TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 프로모션 선수 인덱스
CREATE INDEX IF NOT EXISTS idx_promo_athletes_phone ON promo_athletes(athlete_phone);
CREATE INDEX IF NOT EXISTS idx_promo_athletes_name ON promo_athletes(athlete_name);
CREATE INDEX IF NOT EXISTS idx_promo_athletes_date ON promo_athletes(service_date);

-- 공지사항 테이블
CREATE TABLE IF NOT EXISTS notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    important INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 공지사항 인덱스
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_important ON notices(important, created_at DESC);

-- 메시지 테이블
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT NOT NULL,
    sender_icon TEXT,
    message TEXT NOT NULL,
    branch TEXT,
    timestamp TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 메시지 인덱스
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_branch ON messages(branch);

-- 시합일정 테이블
CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    event_type TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT,
    location TEXT,
    organizer TEXT,
    participants TEXT,
    description TEXT,
    status TEXT DEFAULT 'scheduled',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 시합일정 인덱스
CREATE INDEX IF NOT EXISTS idx_schedules_start_date ON schedules(start_date);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);

-- 사용자 테이블 (로그인용)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    branch_name TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 사용자 인덱스
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 기본 사용자 데이터 삽입
INSERT OR IGNORE INTO users (username, password, branch_name, is_admin) VALUES
('admin', 'admin123', '관리자', 1),
('gonjiam', 'gonjiam123', '곤지암점', 0),
('daegwallyeong', 'daegwallyeong123', '대관령점', 0),
('vivaldi', 'vivaldi123', '비발디점', 0);
