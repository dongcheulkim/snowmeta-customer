const Database = require('better-sqlite3');
const path = require('path');

// SQLite 데이터베이스 파일 경로
const dbPath = path.join(__dirname, '..', 'snowmeta.db');
const db = new Database(dbPath);

// WAL 모드 활성화 (성능 향상)
db.pragma('journal_mode = WAL');

console.log('SQLite 데이터베이스에 연결되었습니다:', dbPath);

module.exports = db;
