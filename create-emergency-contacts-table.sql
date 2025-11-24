-- 비상연락처 테이블 생성
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  branch VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 지점 전화번호 테이블 생성
CREATE TABLE IF NOT EXISTS branch_phones (
  id BIGSERIAL PRIMARY KEY,
  branch_name VARCHAR(50) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 활성화
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_phones ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능하도록 정책 설정
CREATE POLICY "Enable read access for all users" ON emergency_contacts FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON emergency_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON emergency_contacts FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON emergency_contacts FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON branch_phones FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON branch_phones FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON branch_phones FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON branch_phones FOR DELETE USING (true);
