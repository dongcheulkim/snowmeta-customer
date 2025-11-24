import { supabase } from '../supabaseClient';

// 메시지 목록 조회
export const getMessages = async () => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// 단일 메시지 조회
export const getMessage = async (id) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// 메시지 발송 (등록)
export const createMessage = async (messageData) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      sender: messageData.sender,
      content: messageData.message,
      branch: messageData.branch || null
    }])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

// 메시지 삭제
export const deleteMessage = async (id) => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { success: true };
};

// 모든 메시지 삭제 (테스트용)
export const clearAllMessages = async () => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .neq('id', 0);

  if (error) throw new Error(error.message);
  return { success: true };
};
