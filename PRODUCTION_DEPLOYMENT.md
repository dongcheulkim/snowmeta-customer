# 🏢 스노우메타 고객관리 시스템 프로덕션 배포 가이드

## 📋 개요

이 문서는 스노우메타 고객관리 시스템을 3개 지점에서 인터넷으로 연동하여 실제 운영하기 위한 완전한 배포 가이드입니다.

---

## 🎯 목표 아키텍처

```
인터넷
    ↓
[ Load Balancer/CDN ]
    ↓
[ Web Server (Nginx/Apache) ]
    ↓
[ Application Server (Node.js) ]
    ↓
[ Database Server (PostgreSQL) ]
    ↓
[ Backup Storage ]

3개 지점 → HTTPS → 중앙 서버
```

---

## 🔧 1단계: 서버 환경 준비

### 1.1 하드웨어 요구사항
- **CPU**: 최소 4코어 (권장 8코어)
- **RAM**: 최소 8GB (권장 16GB)
- **Storage**: 최소 100GB SSD (권장 500GB)
- **Network**: 안정적인 인터넷 연결 (최소 100Mbps)

### 1.2 운영체제 설정
```bash
# Ubuntu 22.04 LTS 권장
sudo apt update
sudo apt upgrade -y

# 기본 패키지 설치
sudo apt install -y curl wget git nginx postgresql postgresql-contrib
sudo apt install -y nodejs npm
```

---

## 🔐 2단계: 보안 설정

### 2.1 방화벽 설정
```bash
# UFW 방화벽 설정
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 5432/tcp # PostgreSQL (필요시)
```

### 2.2 SSL 인증서 설치
```bash
# Let's Encrypt 설치
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급 (도메인 준비 필요)
sudo certbot --nginx -d yourdomain.com
sudo certbot --nginx -d branch1.yourdomain.com
sudo certbot --nginx -d branch2.yourdomain.com
sudo certbot --nginx -d branch3.yourdomain.com
```

---

## 🗄️ 3단계: 데이터베이스 설정

### 3.1 PostgreSQL 보안 설정
```bash
# PostgreSQL 서비스 시작
sudo systemctl start postgresql
sudo systemctl enable postgresql

# postgres 사용자로 전환
sudo -u postgres psql

-- 데이터베이스 및 사용자 생성
CREATE DATABASE snowmeta_customers;
CREATE USER snowmeta_user WITH ENCRYPTED PASSWORD '복잡한_패스워드_2024!@#';
GRANT ALL PRIVILEGES ON DATABASE snowmeta_customers TO snowmeta_user;
\q
```

### 3.2 데이터베이스 보안 강화
```bash
# postgresql.conf 수정
sudo nano /etc/postgresql/14/main/postgresql.conf

# 다음 설정 변경:
listen_addresses = 'localhost'          # 로컬만 접속 허용
ssl = on                                # SSL 활성화
max_connections = 100                   # 연결 수 제한

# pg_hba.conf 수정 (인증 방식 강화)
sudo nano /etc/postgresql/14/main/pg_hba.conf

# 패스워드 인증으로 변경
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
```

---

## 🚀 4단계: 애플리케이션 배포

### 4.1 소스코드 배포
```bash
# 프로덕션 디렉토리 생성
sudo mkdir -p /opt/snowmeta
sudo chown $USER:$USER /opt/snowmeta

# 소스코드 복사 (GitHub 사용 권장)
cd /opt/snowmeta
git clone https://github.com/yourusername/snowmeta-customer-web.git .

# 또는 파일 직접 업로드
scp -r /path/to/snowmeta-customer-web/* user@server:/opt/snowmeta/
```

### 4.2 의존성 설치
```bash
cd /opt/snowmeta

# 서버 의존성 설치
cd server
npm install --production

# 클라이언트 빌드
cd ../client
npm install
npm run build
```

### 4.3 환경 변수 설정
```bash
cd /opt/snowmeta/server

# 프로덕션 환경 설정
cp .env.example .env
nano .env
```

**중요한 환경 변수들:**
```bash
NODE_ENV=production
PORT=5004

# 데이터베이스 (실제 값으로 변경 필수!)
DB_HOST=localhost
DB_USER=snowmeta_user
DB_PASSWORD=복잡한_패스워드_2024!@#
DB_NAME=snowmeta_customers

# 보안 키 (무작위 복잡한 문자열로 설정)
JWT_SECRET=매우_복잡한_JWT_키_32자_이상
SESSION_SECRET=매우_복잡한_세션_키_32자_이상

# CORS (실제 도메인으로 변경)
CORS_ORIGIN=https://yourdomain.com,https://branch1.yourdomain.com,https://branch2.yourdomain.com

# SSL 설정
ENABLE_HTTPS=true
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem

# 샘플 데이터 비활성화
GENERATE_SAMPLE_DATA=false

# 백업 활성화
DB_BACKUP_ENABLED=true
DB_BACKUP_SCHEDULE=0 2 * * *
DB_BACKUP_RETENTION_DAYS=30
```

---

## 🔄 5단계: 프로세스 관리 (PM2)

### 5.1 PM2 설치 및 설정
```bash
# PM2 글로벌 설치
sudo npm install -g pm2

# PM2 설정 파일 생성
cd /opt/snowmeta
nano ecosystem.config.js
```

**ecosystem.config.js 내용:**
```javascript
module.exports = {
  apps: [{
    name: 'snowmeta-server',
    script: './server/server.js',
    cwd: '/opt/snowmeta',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5004
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    merge_logs: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### 5.2 PM2로 애플리케이션 시작
```bash
# 애플리케이션 시작
pm2 start ecosystem.config.js

# 시스템 부팅시 자동 시작 설정
pm2 save
pm2 startup

# 상태 확인
pm2 status
pm2 logs
```

---

## 🌐 6단계: 웹서버 설정 (Nginx)

### 6.1 Nginx 설정
```bash
sudo nano /etc/nginx/sites-available/snowmeta
```

**Nginx 설정 파일:**
```nginx
# 메인 도메인
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL 설정
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # 정적 파일 서빙
    location / {
        root /opt/snowmeta/client/build;
        try_files $uri $uri/ /index.html;

        # 캐싱 설정
        location ~* .(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API 프록시
    location /api/ {
        proxy_pass http://localhost:5004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 타임아웃 설정
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 로그 설정
    access_log /var/log/nginx/snowmeta_access.log;
    error_log /var/log/nginx/snowmeta_error.log;
}

# 지점별 서브도메인 (동일한 설정 반복)
server {
    listen 443 ssl http2;
    server_name branch1.yourdomain.com branch2.yourdomain.com branch3.yourdomain.com;

    # SSL 설정 (와일드카드 인증서 또는 각각 설정)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # 메인 도메인과 동일한 설정...
    location / {
        root /opt/snowmeta/client/build;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5004;
        # ... 동일한 프록시 설정
    }
}
```

### 6.2 Nginx 활성화
```bash
# 설정 파일 링크 생성
sudo ln -s /etc/nginx/sites-available/snowmeta /etc/nginx/sites-enabled/

# 기본 사이트 비활성화
sudo rm /etc/nginx/sites-enabled/default

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 📊 7단계: 모니터링 및 로깅

### 7.1 로그 디렉토리 생성
```bash
mkdir -p /opt/snowmeta/logs
mkdir -p /opt/snowmeta/backups
```

### 7.2 로그 로테이션 설정
```bash
sudo nano /etc/logrotate.d/snowmeta
```

```
/opt/snowmeta/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
```

### 7.3 시스템 모니터링
```bash
# htop 설치 (시스템 모니터링)
sudo apt install htop

# 디스크 사용량 모니터링
df -h
du -sh /opt/snowmeta

# PM2 모니터링
pm2 monit
```

---

## 🔄 8단계: 데이터베이스 백업

### 8.1 자동 백업 스크립트
```bash
# 백업 스크립트 생성
sudo nano /opt/snowmeta/scripts/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/snowmeta/backups"
DB_NAME="snowmeta_customers"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/snowmeta_backup_$DATE.sql"

# 백업 실행
pg_dump -h localhost -U snowmeta_user -d $DB_NAME > $BACKUP_FILE

# 압축
gzip $BACKUP_FILE

# 30일 이전 백업 삭제
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "백업 완료: $BACKUP_FILE.gz"
```

### 8.2 Cron 작업 설정
```bash
# crontab 편집
crontab -e

# 매일 새벽 2시에 백업
0 2 * * * /opt/snowmeta/scripts/backup.sh >> /opt/snowmeta/logs/backup.log 2>&1
```

---

## 🚨 9단계: 보안 강화

### 9.1 시스템 보안
```bash
# SSH 보안 강화
sudo nano /etc/ssh/sshd_config

# 다음 설정 변경:
PermitRootLogin no
PasswordAuthentication no  # 키 인증만 허용
Port 2222  # 기본 포트 변경

sudo systemctl restart ssh
```

### 9.2 애플리케이션 보안
```bash
# 파일 권한 설정
sudo chown -R www-data:www-data /opt/snowmeta
sudo chmod -R 755 /opt/snowmeta
sudo chmod 600 /opt/snowmeta/server/.env
```

---

## 📱 10단계: 3개 지점 접속 설정

### 10.1 지점별 접속 URL
- **본사**: https://yourdomain.com
- **지점1**: https://branch1.yourdomain.com
- **지점2**: https://branch2.yourdomain.com
- **지점3**: https://branch3.yourdomain.com

### 10.2 지점별 사용자 계정 설정
```sql
-- 관리자 계정 생성 (각 지점별)
INSERT INTO users (username, password, branch_name, is_admin) VALUES
('admin_branch1', '암호화된_비밀번호', '지점1', false),
('admin_branch2', '암호화된_비밀번호', '지점2', false),
('admin_branch3', '암호화된_비밀번호', '지점3', false),
('super_admin', '암호화된_비밀번호', '본사', true);
```

---

## 🔧 11단계: 성능 최적화

### 11.1 Node.js 성능 튜닝
```bash
# .env 파일에 추가
NODE_OPTIONS="--max-old-space-size=1024"
```

### 11.2 PostgreSQL 성능 튜닝
```sql
-- postgresql.conf 설정
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
```

---

## 📋 12단계: 배포 체크리스트

### ✅ 배포 전 필수 확인사항

- [ ] 도메인 DNS 설정 완료
- [ ] SSL 인증서 설치 및 자동 갱신 설정
- [ ] 데이터베이스 보안 설정 완료
- [ ] 환경 변수 프로덕션 값으로 설정
- [ ] 샘플 데이터 생성 비활성화
- [ ] 방화벽 설정 완료
- [ ] 백업 시스템 동작 확인
- [ ] 로그 시스템 동작 확인
- [ ] PM2 자동 시작 설정 완료
- [ ] Nginx 설정 및 테스트 완료
- [ ] 성능 테스트 완료

### 🚀 Go-Live 절차

1. **최종 테스트**
   ```bash
   # 애플리케이션 상태 확인
   pm2 status

   # 데이터베이스 연결 확인
   psql -h localhost -U snowmeta_user -d snowmeta_customers -c "SELECT 1;"

   # 웹서버 상태 확인
   sudo nginx -t
   curl -k https://yourdomain.com/api/
   ```

2. **모니터링 준비**
   ```bash
   # 실시간 로그 모니터링
   tail -f /opt/snowmeta/logs/*.log
   pm2 logs --lines 100
   ```

3. **사용자 안내**
   - 지점별 접속 URL 및 계정 전달
   - 사용법 교육 실시
   - 문제 발생시 연락처 안내

---

## 🆘 문제 해결 가이드

### 일반적인 문제들

**1. 서버 접속 불가**
```bash
# 서비스 상태 확인
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# 포트 확인
netstat -tlnp | grep :5004
netstat -tlnp | grep :443
```

**2. 데이터베이스 연결 오류**
```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql

# 연결 테스트
psql -h localhost -U snowmeta_user -d snowmeta_customers
```

**3. SSL 인증서 문제**
```bash
# 인증서 갱신
sudo certbot renew --dry-run

# 인증서 확인
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -text -noout
```

---

## 📞 지원 및 유지보수

### 정기 유지보수 작업
- **매주**: 로그 확인, 시스템 상태 점검
- **매월**: 보안 업데이트, 성능 점검
- **분기별**: 백업 복구 테스트, 전체 시스템 점검

### 긴급 연락처
- **시스템 관리자**: [연락처]
- **개발팀**: [연락처]
- **호스팅 업체**: [연락처]

---

## 🎉 배포 완료!

축하합니다! 스노우메타 고객관리 시스템이 성공적으로 배포되었습니다.

이제 3개 지점에서 안전하고 안정적으로 시스템을 사용할 수 있습니다.

**다음 단계:**
1. 사용자 교육 실시
2. 실제 운영 데이터 입력 시작
3. 정기적인 백업 및 모니터링
4. 필요에 따른 기능 개선

---

> **중요**: 이 문서의 모든 패스워드와 보안 키는 실제 운영 전에 복잡하고 안전한 값으로 변경해야 합니다!