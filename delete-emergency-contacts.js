// 비상연락처 샘플 데이터 삭제 스크립트
import { supabase } from './client/src/supabaseClient.js';

async function deleteAllEmergencyContacts() {
  try {
    console.log('비상연락처 데이터 삭제 중...');

    // 모든 비상연락처 삭제
    const { data, error } = await supabase
      .from('emergency_contacts')
      .delete()
      .neq('id', 0); // 모든 레코드 삭제 (id가 0이 아닌 모든 것)

    if (error) {
      console.error('삭제 실패:', error);
      return;
    }

    console.log('✅ 모든 비상연락처가 삭제되었습니다.');

    // 지점 전화번호도 초기화하려면 주석 해제
    // const { error: branchError } = await supabase
    //   .from('branch_phones')
    //   .delete()
    //   .neq('branch_name', '');
    //
    // if (branchError) {
    //   console.error('지점 전화번호 삭제 실패:', branchError);
    // } else {
    //   console.log('✅ 지점 전화번호도 삭제되었습니다.');
    // }

  } catch (error) {
    console.error('에러 발생:', error);
  }
}

deleteAllEmergencyContacts();
