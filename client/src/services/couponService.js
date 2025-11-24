import { supabase } from '../supabaseClient';

// 쿠폰 목록 조회
export const getCoupons = async () => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// 단일 쿠폰 조회
export const getCoupon = async (id) => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// 쿠폰 번호로 조회
export const getCouponByNumber = async (couponNumber) => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('coupon_number', couponNumber)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// 쿠폰 등록 (관리자)
export const createCoupon = async (couponData) => {
  const { data, error } = await supabase
    .from('coupons')
    .insert([{
      coupon_number: couponData.coupon_number,
      coupon_type: couponData.coupon_type || 'free', // 'free' or 'discount'
      discount_amount: couponData.coupon_type === 'discount' ? 30 : null, // 30% 고정
      status: 'unused',
      issued_to_customer: null,
      notes: couponData.notes || null
    }])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

// 쿠폰 지급 (손님에게 나감)
export const issueCoupon = async (id) => {
  const { data, error } = await supabase
    .from('coupons')
    .update({
      issued_to_customer: 'issued',
      issued_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

// 쿠폰 사용 (지점)
export const useCoupon = async (id, couponData) => {
  const { data, error } = await supabase
    .from('coupons')
    .update({
      status: 'used',
      customer_name: couponData.customer_name,
      customer_phone: couponData.customer_phone,
      service_description: couponData.service_description,
      service_date: couponData.service_date,
      total_cost: couponData.total_cost || null,
      payment_status: couponData.payment_status || 'paid',
      branch: couponData.branch,
      notes: couponData.notes || null,
      used_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

// 쿠폰 수정
export const updateCoupon = async (id, couponData) => {
  const { data, error } = await supabase
    .from('coupons')
    .update({
      ...couponData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

// 쿠폰 삭제
export const deleteCoupon = async (id) => {
  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { success: true };
};
