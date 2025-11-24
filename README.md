# 스노우메타 고객관리 시스템

React + Node.js + Express + PostgreSQL을 사용한 고객관리 웹 애플리케이션

## 기술 스택

### 프론트엔드
- React 18
- CSS3
- JavaScript ES6+

### 백엔드
- Node.js
- Express.js
- PostgreSQL
- 기타: cors, body-parser, dotenv

## 프로젝트 구조

```
snowmeta-customer-web/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── services/      # API 서비스
│   │   ├── utils/         # 유틸리티 함수
│   │   └── styles/        # 스타일시트
│   └── public/
├── server/                # Node.js 백엔드
│   ├── routes/            # API 라우트
│   ├── controllers/       # 컨트롤러
│   ├── models/           # 데이터 모델
│   └── config/           # 설정 파일
└── package.json
```

## 설치 및 실행

### 1. 의존성 설치
```bash
# 루트 디렉토리에서
npm run install-deps
```

### 2. PostgreSQL 설정
1. PostgreSQL 설치
2. 데이터베이스 생성: `snowmeta_customers`
3. server/.env 파일에서 데이터베이스 연결 정보 설정

### 3. 데이터베이스 초기화
```bash
cd server
node init-db.js
```

### 4. 개발 서버 실행
```bash
# 루트 디렉토리에서 (프론트엔드 + 백엔드 동시 실행)
npm run dev

# 또는 개별 실행
npm run server  # 백엔드만
npm run client  # 프론트엔드만
```

## API 엔드포인트

- `GET /api/customers` - 모든 고객 조회
- `GET /api/customers/:id` - 특정 고객 조회
- `POST /api/customers` - 새 고객 등록
- `PUT /api/customers/:id` - 고객 정보 수정
- `DELETE /api/customers/:id` - 고객 삭제

## 기능

- 고객 목록 조회
- 새 고객 등록
- 고객 정보 수정
- 고객 삭제
- 반응형 웹 디자인

## 환경 변수

server/.env 파일 설정:
```
PORT=5000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=snowmeta_customers
DB_PORT=5432
```