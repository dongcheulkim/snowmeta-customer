import { supabase } from '../supabaseClient';

// 모든 공지사항 조회
export const getNotices = async () => {
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .order('important', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// 단일 공지사항 조회
export const getNotice = async (id) => {
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// 공지사항 생성
export const createNotice = async (noticeData) => {
  const { data, error } = await supabase
    .from('notices')
    .insert([{
      title: noticeData.title,
      content: noticeData.content,
      author: noticeData.author || '관리자',
      important: noticeData.important || false
    }])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

// 공지사항 수정
export const updateNotice = async (id, noticeData) => {
  const { data, error } = await supabase
    .from('notices')
    .update({
      title: noticeData.title,
      content: noticeData.content,
      important: noticeData.important || false
    })
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

// 공지사항 삭제
export const deleteNotice = async (id) => {
  const { error } = await supabase
    .from('notices')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { success: true };
};
