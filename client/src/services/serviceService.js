import { supabase } from '../supabaseClient';

// 고객 목록 조회 (전화번호별로 그룹화)
export const getCustomers = async () => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  // 전화번호별로 그룹화
  const groupedByPhone = data.reduce((acc, service) => {
    const phone = service.customer_phone;
    if (!acc[phone]) {
      acc[phone] = {
        customer_name: service.customer_name,
        customer_phone: service.customer_phone,
        customer_memo: service.customer_memo,
        services: []
      };
    }
    acc[phone].services.push(service);
    return acc;
  }, {});

  return { data: Object.values(groupedByPhone) };
};

// 서비스 목록 조회 (페이지네이션)
export const getServices = async (page = 1, limit = 20) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('services')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    data,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    }
  };
};

// 모든 서비스 조회 (통계용)
export const getAllServices = async () => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// 단일 서비스 조회
export const getService = async (id) => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// 고객별 서비스 조회
export const getServicesByCustomer = async (customerPhone) => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('customer_phone', customerPhone)
    .order('service_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// 서비스 등록
export const createService = async (serviceData) => {
  const { data, error } = await supabase
    .from('services')
    .insert([{
      customer_name: serviceData.customer_name,
      customer_phone: serviceData.customer_phone,
      customer_memo: serviceData.customer_memo || null,
      service_description: serviceData.service_description,
      total_cost: serviceData.total_cost,
      service_date: serviceData.service_date,
      payment_status: serviceData.payment_status,
      branch: serviceData.branch,
      notes: serviceData.notes || null
    }])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

// 서비스 수정
export const updateService = async (id, serviceData) => {
  const { data, error} = await supabase
    .from('services')
    .update({
      customer_name: serviceData.customer_name,
      customer_phone: serviceData.customer_phone,
      customer_memo: serviceData.customer_memo || null,
      service_description: serviceData.service_description,
      total_cost: serviceData.total_cost,
      service_date: serviceData.service_date,
      payment_status: serviceData.payment_status,
      branch: serviceData.branch,
      notes: serviceData.notes || null
    })
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

// 서비스 삭제
export const deleteService = async (id) => {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { success: true };
};

// 시즌별 서비스 조회
export const getServicesBySeason = async (season) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  let seasonStart, seasonEnd;

  if (currentMonth >= 10) {
    seasonStart = `${currentYear}-11-01`;
    seasonEnd = `${currentYear + 1}-04-30`;
  } else if (currentMonth <= 3) {
    seasonStart = `${currentYear - 1}-11-01`;
    seasonEnd = `${currentYear}-04-30`;
  } else {
    seasonStart = `${currentYear}-05-01`;
    seasonEnd = `${currentYear}-10-31`;
  }

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .gte('service_date', seasonStart)
    .lte('service_date', seasonEnd)
    .order('service_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// 지점별 서비스 조회
export const getServicesByBranch = async (branch) => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('branch', branch)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// 결제 상태별 서비스 조회
export const getServicesByPaymentStatus = async (status) => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('payment_status', status)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// 고객 검색
export const searchCustomers = async (searchTerm) => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .or(`customer_name.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  // 전화번호별로 그룹화
  const groupedByPhone = data.reduce((acc, service) => {
    const phone = service.customer_phone;
    if (!acc[phone]) {
      acc[phone] = {
        customer_name: service.customer_name,
        customer_phone: service.customer_phone,
        customer_memo: service.customer_memo,
        services: []
      };
    }
    acc[phone].services.push(service);
    return acc;
  }, {});

  return Object.values(groupedByPhone);
};
