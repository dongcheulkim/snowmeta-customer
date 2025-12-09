import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://cdboaczqtigxpzgahizy.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkYm9hY3pxdGlneHB6Z2FoaXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMzk1ODgsImV4cCI6MjA3NjYxNTU4OH0.S1QoxWiU2hQEDuMLOT7VzO0koSpo8mHxfCXS1bWFPCw';

const supabase = createClient(supabaseUrl, supabaseKey);

export const getFullSeasonCares = async () => {
  try {
    const { data, error } = await supabase
      .from('full_season_care')
      .select('*')
      .order('service_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('풀시즌케어 조회 실패:', error);
    throw error;
  }
};

export const getFullSeasonCareById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('full_season_care')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('풀시즌케어 상세 조회 실패:', error);
    throw error;
  }
};

export const createFullSeasonCare = async (fullSeasonCareData) => {
  try {
    const { data, error } = await supabase
      .from('full_season_care')
      .insert([fullSeasonCareData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('풀시즌케어 등록 실패:', error);
    throw error;
  }
};

export const updateFullSeasonCare = async (id, fullSeasonCareData) => {
  try {
    const { data, error } = await supabase
      .from('full_season_care')
      .update(fullSeasonCareData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('풀시즌케어 수정 실패:', error);
    throw error;
  }
};

export const deleteFullSeasonCare = async (id) => {
  try {
    const { error } = await supabase
      .from('full_season_care')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('풀시즌케어 삭제 실패:', error);
    throw error;
  }
};
