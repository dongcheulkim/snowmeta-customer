/**
 * 비밀번호 마이그레이션 스크립트
 * 평문 비밀번호를 bcrypt로 해싱하여 DB 업데이트
 *
 * 사용법: node migrate-passwords.js
 */

const bcrypt = require('bcryptjs');
const db = require('./config/database');

async function migratePasswords() {
  console.log('🔐 비밀번호 마이그레이션 시작...\n');

  try {
    // 1. 모든 사용자 조회
    const users = db.prepare('SELECT id, username, password FROM users').all();

    if (users.length === 0) {
      console.log('❌ 사용자가 없습니다.');
      return;
    }

    console.log(`📊 총 ${users.length}명의 사용자 발견\n`);

    let successCount = 0;
    let skipCount = 0;

    // 2. 각 사용자의 비밀번호 해싱
    for (const user of users) {
      // bcrypt 해시 형식 확인 (이미 해싱된 비밀번호는 건너뛰기)
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        console.log(`⏭️  [${user.username}] 이미 해싱된 비밀번호 - 건너뜀`);
        skipCount++;
        continue;
      }

      // 평문 비밀번호를 해싱
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // DB 업데이트
      const updateStmt = db.prepare(`
        UPDATE users
        SET password = ?,
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `);

      updateStmt.run(hashedPassword, user.id);

      console.log(`✅ [${user.username}] 비밀번호 해싱 완료`);
      console.log(`   원본: ${user.password}`);
      console.log(`   해시: ${hashedPassword.substring(0, 30)}...\n`);

      successCount++;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 마이그레이션 완료!`);
    console.log(`   성공: ${successCount}명`);
    console.log(`   건너뜀: ${skipCount}명`);
    console.log(`   총: ${users.length}명`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 3. 검증
    console.log('🔍 마이그레이션 검증 중...\n');

    for (const user of users) {
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        continue; // 이미 해싱된 경우 원본 비밀번호를 모르므로 건너뜀
      }

      const updatedUser = db.prepare('SELECT password FROM users WHERE id = ?').get(user.id);
      const isValid = await bcrypt.compare(user.password, updatedUser.password);

      if (isValid) {
        console.log(`✅ [${user.username}] 검증 성공 - 기존 비밀번호로 로그인 가능`);
      } else {
        console.log(`❌ [${user.username}] 검증 실패!`);
      }
    }

    console.log('\n🎉 모든 작업이 완료되었습니다!');
    console.log('📌 이제 서버를 실행하면 기존 비밀번호로 로그인할 수 있습니다.\n');

  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
migratePasswords().then(() => {
  console.log('✅ 스크립트 종료');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 오류:', error);
  process.exit(1);
});
