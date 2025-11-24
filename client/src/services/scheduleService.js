import { supabase } from '../supabaseClient';

// 일정 목록 조회
export const getSchedules = async () => {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// 단일 일정 조회
export const getSchedule = async (id) => {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// 일정 등록
export const createSchedule = async (scheduleData) => {
  const { data, error } = await supabase
    .from('schedules')
    .insert([scheduleData])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

// 일정 수정
export const updateSchedule = async (id, scheduleData) => {
  const { data, error } = await supabase
    .from('schedules')
    .update(scheduleData)
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

// 일정 삭제
export const deleteSchedule = async (id) => {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { success: true };
};
