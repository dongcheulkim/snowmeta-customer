import { supabase } from '../supabaseClient';

// 앰버서더 목록 조회 (전화번호별로 그룹화)
export const getAmbassadors = async () => {
  const { data, error } = await supabase
    .from('ambassadors')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  // 전화번호별로 그룹화
  const groupedByPhone = data.reduce((acc, record) => {
    const phone = record.customer_phone;
    if (!acc[phone]) {
      acc[phone] = {
        customer_name: record.customer_name,
        customer_phone: record.customer_phone,
        customer_memo: record.customer_memo,
        services: []
      };
    }
    acc[phone].services.push(record);
    return acc;
  }, {});

  return Object.values(groupedByPhone);
};

// 전체 앰버서더 레코드 조회 (그룹화 없이)
export const getAllAmbassadorRecords = async () => {
  const { data, error } = await supabase
    .from('ambassadors')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// 단일 앰버서더 조회
export const getAmbassador = async (id) => {
  const { data, error } = await supabase
    .from('ambassadors')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// 전화번호로 앰버서더 조회
export const getAmbassadorByPhone = async (phone) => {
  const { data, error } = await supabase
    .from('ambassadors')
    .select('*')
    .eq('customer_phone', phone)
    .order('service_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// 앰버서더 등록
export const createAmbassador = async (ambassadorData) => {
  const { data, error } = await supabase
    .from('ambassadors')
    .insert([{
      customer_name: ambassadorData.customer_name,
      customer_phone: ambassadorData.customer_phone,
      service_description: ambassadorData.service_description || null,
      service_date: ambassadorData.service_date || new Date().toISOString().split('T')[0],
      branch: ambassadorData.branch || null,
      customer_memo: ambassadorData.customer_memo || null,
      notes: ambassadorData.notes || null
    }])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

// 앰버서더 수정
export const updateAmbassador = async (id, ambassadorData) => {
  const { data, error } = await supabase
    .from('ambassadors')
    .update({
      customer_name: ambassadorData.customer_name,
      customer_phone: ambassadorData.customer_phone,
      service_description: ambassadorData.service_description || null,
      service_date: ambassadorData.service_date || null,
      branch: ambassadorData.branch || null,
      customer_memo: ambassadorData.customer_memo || null,
      notes: ambassadorData.notes || null
    })
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

// 전화번호로 앰버서더 기본 정보 일괄 업데이트
export const updateAmbassadorByPhone = async (phone, ambassadorData) => {
  const { data, error } = await supabase
    .from('ambassadors')
    .update({
      customer_name: ambassadorData.customer_name,
      customer_phone: ambassadorData.customer_phone,
      customer_memo: ambassadorData.customer_memo || null
    })
    .eq('customer_phone', phone)
    .select();

  if (error) throw new Error(error.message);
  return data;
};

// 앰버서더 삭제
export const deleteAmbassador = async (id) => {
  const { error } = await supabase
    .from('ambassadors')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { success: true };
};

// 전화번호로 앰버서더 전체 삭제
export const deleteAmbassadorByPhone = async (phone) => {
  const { error } = await supabase
    .from('ambassadors')
    .delete()
    .eq('customer_phone', phone);

  if (error) throw new Error(error.message);
  return { success: true };
};
