# Supabase 마이그레이션 완료 가이드

## ✅ 완료된 작업

### 1. Service 파일 변환 완료
모든 백엔드 API 호출이 Supabase SDK로 변환되었습니다:

- ✅ `serviceService.js` - 일반 서비스 관리
- ✅ `seasonCareService.js` - 시즌케어 관리
- ✅ `messageService.js` - 메시지 관리
- ✅ `customerService.js` - 고객 관리
- ✅ `promoAthleteService.js` - 프로모션 선수 관리 (새로 생성)
- ✅ `scheduleService.js` - 일정 관리 (새로 생성)
- ✅ `ambassadorService.js` - 앰버서더 관리 (새로 생성)

### 2. Supabase 클라이언트 설정
- ✅ `client/src/supabaseClient.js` 생성
- ✅ Supabase URL 및 Anon Key 설정 완료

## 🚨 필수 작업: Supabase 데이터베이스 업데이트

현재 **season_care** 테이블에 필요한 컬럼이 누락되어 있습니다. 다음 작업을 **반드시** 수행하세요:

### 단계 1: Supabase SQL Editor 열기

1. https://supabase.com 로그인
2. 프로젝트 선택 (cdboaczqtigxpzgahizy)
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

### 단계 2: 마이그레이션 SQL 실행

`supabase-season-care-migration.sql` 파일의 내용을 복사해서 SQL Editor에 붙여넣고 **RUN** 버튼 클릭

이 작업으로 다음 컬럼들이 추가됩니다:
- equipment_type
- equipment_brand
- equipment_model
- service_items
- total_cost
- payment_status
- pickup_scheduled
- customer_memo

## 📝 다음 단계

### 1. 컴포넌트 업데이트 (필요시)

일부 컴포넌트에서 직접 fetch()를 사용하고 있습니다. 이를 service 파일로 변경해야 합니다:

#### PromoAthleteList.js 업데이트 필요
```javascript
// 기존: 직접 fetch 사용
const response = await fetch('http://localhost:5006/api/promo-athletes');

// 변경: service 파일 사용
import { getAllPromoAthleteRecords } from '../services/promoAthleteService';
const data = await getAllPromoAthleteRecords();
```

#### Schedule.js 및 ScheduleCalendar.js 업데이트 필요
```javascript
// 기존: 직접 fetch 사용
const response = await fetch('http://localhost:5006/api/schedules');

// 변경: service 파일 사용
import { getSchedules } from '../services/scheduleService';
const data = await getSchedules();
```

### 2. 테스트

로컬에서 앱을 실행하고 모든 기능이 정상 작동하는지 확인:

```bash
cd client
npm start
```

테스트 항목:
- [ ] 일반 서비스 등록/조회/수정/삭제
- [ ] 시즌케어 등록/조회/수정/삭제
- [ ] 프로모션 선수 관리
- [ ] 일정 관리
- [ ] 메시지 전송/조회/삭제
- [ ] 대시보드 통계 확인

### 3. Vercel 배포 준비

모든 테스트가 완료되면 Vercel에 배포:

1. **Vercel 계정 생성/로그인**
   - https://vercel.com 방문
   - GitHub 계정으로 로그인

2. **프로젝트 Import**
   - "Add New Project" 클릭
   - GitHub 저장소 선택 (또는 수동으로 파일 업로드)

3. **빌드 설정**
   - Framework Preset: Create React App
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `build`

4. **환경 변수 설정**
   Vercel 프로젝트 설정에서 다음 환경 변수 추가:
   ```
   REACT_APP_SUPABASE_URL=https://cdboaczqtigxpzgahizy.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkYm9hY3pxdGlneHB6Z2FoaXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMzk1ODgsImV4cCI6MjA3NjYxNTU4OH0.S1QoxWiU2hQEDuMLOT7VzO0koSpo8mHxfCXS1bWFPCw
   ```

5. **배포**
   - Deploy 버튼 클릭
   - 배포 완료 후 URL 확인 (예: `https://snowmeta-customer-wep.vercel.app`)

## 🔒 보안 고려사항

### Supabase Row Level Security (RLS) 설정

현재는 인증 없이 모든 데이터에 접근 가능합니다. 프로덕션 환경에서는 RLS를 활성화해야 합니다:

```sql
-- 예시: services 테이블에 RLS 활성화
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Enable read access for all users" ON services
  FOR SELECT USING (true);

-- 모든 사용자가 쓰기 가능 (나중에 인증 추가 권장)
CREATE POLICY "Enable insert for all users" ON services
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON services
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON services
  FOR DELETE USING (true);
```

동일한 정책을 다른 테이블에도 적용하세요:
- season_care
- promo_athletes
- ambassadors
- schedules
- messages

## 📊 데이터 마이그레이션 (선택사항)

기존 PostgreSQL 데이터베이스에 데이터가 있다면:

1. **데이터 Export**
   ```bash
   pg_dump -h localhost -U postgres -d snowmeta_customers --data-only --inserts > data.sql
   ```

2. **Supabase로 Import**
   - Supabase SQL Editor에서 data.sql 내용 실행

## ⚠️ 주의사항

1. **Supabase 무료 티어 제한**
   - 데이터베이스: 500MB
   - API 요청: 무제한 (하지만 rate limit 있음)
   - 대역폭: 5GB/월

2. **백업**
   - Supabase는 자동 백업 제공 (유료 플랜)
   - 무료 플랜에서는 정기적으로 수동 백업 권장

3. **모니터링**
   - Supabase Dashboard에서 사용량 확인
   - Vercel Analytics로 트래픽 모니터링

## 🎯 배포 후 확인사항

- [ ] 모든 지점(곤지암, 대관령, 비발디)에서 접속 가능
- [ ] 모바일/태블릿에서 정상 작동
- [ ] 데이터 입력/조회/수정/삭제 모두 정상
- [ ] 대시보드 통계가 올바르게 표시
- [ ] 메시지 기능 정상 작동
- [ ] 검색 기능 정상 작동

## 🆘 문제 해결

### 1. CORS 에러 발생
- Supabase는 자동으로 CORS 처리하므로 발생하지 않아야 함
- 발생시 Supabase Project Settings > API에서 확인

### 2. 데이터가 보이지 않음
- Supabase Table Editor에서 데이터 확인
- 브라우저 Console에서 에러 메시지 확인
- Network 탭에서 API 요청/응답 확인

### 3. 배포 후 빈 화면
- Vercel 배포 로그 확인
- 빌드 에러가 있는지 확인
- 환경 변수가 제대로 설정되었는지 확인

## 📞 지원

문제가 발생하면:
1. 브라우저 개발자 도구 Console 확인
2. Vercel 배포 로그 확인
3. Supabase 로그 확인 (Logs & Reports 메뉴)

---

**작성일**: 2025-10-21
**상태**: 마이그레이션 완료, 테스트 필요
