import { supabase } from '../supabaseClient';

// 비상연락처 목록 조회
export const getEmergencyContacts = async () => {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// 비상연락처 추가
export const createEmergencyContact = async (contactData) => {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .insert([{
      name: contactData.name,
      phone: contactData.phone,
      branch: contactData.branch || null
    }])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

// 비상연락처 수정
export const updateEmergencyContact = async (id, contactData) => {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .update({
      name: contactData.name,
      phone: contactData.phone,
      branch: contactData.branch || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

// 비상연락처 삭제
export const deleteEmergencyContact = async (id) => {
  const { error } = await supabase
    .from('emergency_contacts')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
};

// 지점별 전화번호 조회
export const getBranchPhones = async () => {
  const { data, error } = await supabase
    .from('branch_phones')
    .select('*');

  if (error) throw new Error(error.message);
  return data;
};

// 지점별 전화번호 저장/수정
export const saveBranchPhone = async (branchName, phone) => {
  const { data, error } = await supabase
    .from('branch_phones')
    .upsert({
      branch_name: branchName,
      phone: phone,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'branch_name'
    })
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};
