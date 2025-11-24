import { supabase } from '../supabaseClient';

// 로그인
export const login = async (username, password) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !user) {
      throw new Error('사용자명 또는 비밀번호가 올바르지 않습니다.');
    }

    const { password: _, ...userWithoutPassword } = user;
    return {
      success: true,
      user: {
        id: userWithoutPassword.id,
        username: userWithoutPassword.username,
        branchName: userWithoutPassword.branch_name,
        isAdmin: userWithoutPassword.is_admin
      }
    };
  } catch (error) {
    throw new Error(error.message || '로그인 중 오류가 발생했습니다.');
  }
};

// 모든 사용자 조회
export const getUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, branch_name, is_admin, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// 사용자 정보 조회
export const getUser = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, branch_name, is_admin, created_at')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// 비밀번호 변경
export const updatePassword = async (id, newPassword) => {
  const { data, error } = await supabase
    .from('users')
    .update({ password: newPassword })
    .eq('id', id)
    .select('id, username, branch_name, is_admin');

  if (error) throw new Error(error.message);
  return {
    success: true,
    message: '비밀번호가 성공적으로 변경되었습니다.',
    user: data[0]
  };
};

// 사용자 생성 (관리자 전용)
export const createUser = async (userData) => {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      username: userData.username,
      password: userData.password,
      branch_name: userData.branch_name,
      is_admin: userData.is_admin || false
    }])
    .select('id, username, branch_name, is_admin');

  if (error) {
    if (error.message.includes('duplicate') || error.code === '23505') {
      throw new Error('이미 존재하는 사용자명입니다.');
    }
    throw new Error(error.message);
  }
  return data[0];
};

// 사용자 정보 수정 (관리자 전용)
export const updateUser = async (id, userData) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      username: userData.username,
      branch_name: userData.branch_name,
      is_admin: userData.is_admin
    })
    .eq('id', id)
    .select('id, username, branch_name, is_admin');

  if (error) throw new Error(error.message);
  return data[0];
};

// 사용자 삭제 (관리자 전용)
export const deleteUser = async (id) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { message: '사용자가 성공적으로 삭제되었습니다.' };
};
