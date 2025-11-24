const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// SQLite 데이터베이스 파일 경로
const dbPath = path.join(__dirname, 'snowmeta.db');
const db = new Database(dbPath);

console.log('데이터베이스 초기화 시작...');

// 스키마 파일 읽기
const schemaPath = path.join(__dirname, 'sql', 'schema.sqlite.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// 스키마를 세미콜론으로 분리하여 각각 실행
const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);

try {
  // 트랜잭션 시작
  db.exec('BEGIN');

  statements.forEach((statement, index) => {
    try {
      db.exec(statement);
      console.log(`✓ Statement ${index + 1} 실행 완료`);
    } catch (err) {
      console.error(`✗ Statement ${index + 1} 실행 실패:`, err.message);
      console.error('실패한 SQL:', statement);
    }
  });

  // 트랜잭션 커밋
  db.exec('COMMIT');

  console.log('\n✓ 데이터베이스 초기화 완료!');
  console.log('데이터베이스 파일:', dbPath);

  // 테이블 목록 확인
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('\n생성된 테이블:', tables.map(t => t.name).join(', '));

} catch (error) {
  db.exec('ROLLBACK');
  console.error('데이터베이스 초기화 실패:', error);
  process.exit(1);
} finally {
  db.close();
}
