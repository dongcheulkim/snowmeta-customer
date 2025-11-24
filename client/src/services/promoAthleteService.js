import { supabase } from '../supabaseClient';

// 프로모션 선수 목록 조회 (전화번호별로 그룹화)
export const getPromoAthletes = async () => {
  const { data, error } = await supabase
    .from('promo_athletes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  // 전화번호별로 그룹화
  const groupedByPhone = data.reduce((acc, record) => {
    const phone = record.phone;
    if (!acc[phone]) {
      acc[phone] = {
        name: record.name,
        phone: record.phone,
        boot_size: record.boot_size,
        branch: record.branch,
        services: []
      };
    }
    acc[phone].services.push(record);
    return acc;
  }, {});

  return Object.values(groupedByPhone);
};

// 전체 프로모션 선수 레코드 조회 (그룹화 없이)
export const getAllPromoAthleteRecords = async () => {
  const { data, error } = await supabase
    .from('promo_athletes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// 단일 프로모션 선수 조회
export const getPromoAthlete = async (id) => {
  const { data, error } = await supabase
    .from('promo_athletes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// 전화번호로 선수 조회
export const getPromoAthleteByPhone = async (phone) => {
  const { data, error } = await supabase
    .from('promo_athletes')
    .select('*')
    .eq('phone', phone)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// 프로모션 선수 등록
export const createPromoAthlete = async (athleteData) => {
  const { data, error } = await supabase
    .from('promo_athletes')
    .insert([{
      name: athleteData.name,
      phone: athleteData.phone,
      boot_size: athleteData.bootSize || athleteData.boot_size || null,
      branch: athleteData.branch || null,
      ski_brand: athleteData.ski_brand || null,
      athlete_memo: athleteData.athlete_memo || null,
      notes: athleteData.notes || null
    }])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

// 프로모션 선수 수정
export const updatePromoAthlete = async (id, athleteData) => {
  const updateData = {
    name: athleteData.name,
    phone: athleteData.phone,
    boot_size: athleteData.bootSize || athleteData.boot_size || null,
    branch: athleteData.branch || null,
    ski_brand: athleteData.ski_brand || null,
    athlete_memo: athleteData.athlete_memo || null
  };

  // notes는 제공된 경우에만 업데이트
  if (athleteData.notes !== undefined) {
    updateData.notes = athleteData.notes;
  }

  const { data, error } = await supabase
    .from('promo_athletes')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

// 전화번호로 선수 기본 정보 일괄 업데이트
export const updatePromoAthleteByPhone = async (phone, athleteData) => {
  const { data, error } = await supabase
    .from('promo_athletes')
    .update({
      name: athleteData.name,
      phone: athleteData.phone,
      boot_size: athleteData.bootSize || athleteData.boot_size || null,
      branch: athleteData.branch || null
    })
    .eq('phone', phone)
    .select();

  if (error) throw new Error(error.message);
  return data;
};

// 프로모션 선수 삭제
export const deletePromoAthlete = async (id) => {
  const { error } = await supabase
    .from('promo_athletes')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { success: true };
};

// 전화번호로 선수 전체 삭제
export const deletePromoAthleteByPhone = async (phone) => {
  const { error } = await supabase
    .from('promo_athletes')
    .delete()
    .eq('phone', phone);

  if (error) throw new Error(error.message);
  return { success: true };
};
