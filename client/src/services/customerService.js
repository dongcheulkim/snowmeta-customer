import { supabase } from '../supabaseClient';

// 고객 목록 조회 (services 테이블에서 전화번호별로 그룹화)
export const getCustomers = async (page = 1, limit = 20) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('services')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  // 전화번호별로 그룹화
  const groupedByPhone = data.reduce((acc, service) => {
    const phone = service.customer_phone;
    if (!acc[phone]) {
      acc[phone] = {
        id: phone, // ID로 전화번호 사용
        customer_name: service.customer_name,
        customer_phone: service.customer_phone,
        customer_memo: service.customer_memo,
        services: []
      };
    }
    acc[phone].services.push(service);
    return acc;
  }, {});

  const customers = Object.values(groupedByPhone);

  // 페이지네이션 적용
  const paginatedCustomers = customers.slice(from, to + 1);

  return {
    data: paginatedCustomers,
    pagination: {
      total: customers.length,
      page,
      limit,
      totalPages: Math.ceil(customers.length / limit)
    }
  };
};

// 단일 고객 조회 (전화번호로)
export const getCustomer = async (phone) => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('customer_phone', phone)
    .order('service_date', { ascending: false });

  if (error) throw new Error(error.message);

  if (data.length === 0) {
    throw new Error('고객을 찾을 수 없습니다.');
  }

  return {
    id: phone,
    customer_name: data[0].customer_name,
    customer_phone: data[0].customer_phone,
    customer_memo: data[0].customer_memo,
    services: data
  };
};

// 고객 생성 (첫 서비스 등록)
// 주의: Supabase에서는 별도의 customers 테이블이 없으므로
// 새 고객은 첫 서비스 등록시 자동 생성됨
export const createCustomer = async (customerData) => {
  // 이 함수는 하위 호환성을 위해 유지하지만
  // 실제로는 서비스 등록이 필요함
  throw new Error('고객은 서비스 등록을 통해 생성됩니다. createService를 사용하세요.');
};

// 고객 정보 업데이트 (해당 전화번호의 모든 서비스 레코드 업데이트)
export const updateCustomer = async (oldPhone, customerData) => {
  const { data, error } = await supabase
    .from('services')
    .update({
      customer_name: customerData.customer_name || customerData.name,
      customer_phone: customerData.customer_phone || customerData.phone,
      customer_memo: customerData.customer_memo || customerData.memo || null
    })
    .eq('customer_phone', oldPhone)
    .select();

  if (error) throw new Error(error.message);

  // season_care 테이블도 업데이트
  const { error: seasonCareError } = await supabase
    .from('season_care')
    .update({
      customer_name: customerData.customer_name || customerData.name,
      customer_phone: customerData.customer_phone || customerData.phone,
      customer_memo: customerData.customer_memo || customerData.memo || null
    })
    .eq('customer_phone', oldPhone);

  if (seasonCareError) {
    console.warn('시즌케어 업데이트 중 오류:', seasonCareError.message);
  }

  return data;
};

// 고객 삭제 (해당 전화번호의 모든 서비스 삭제)
export const deleteCustomer = async (phone) => {
  // services 테이블에서 삭제
  const { error: servicesError } = await supabase
    .from('services')
    .delete()
    .eq('customer_phone', phone);

  if (servicesError) throw new Error(servicesError.message);

  // season_care 테이블에서도 삭제
  const { error: seasonCareError } = await supabase
    .from('season_care')
    .delete()
    .eq('customer_phone', phone);

  if (seasonCareError) {
    console.warn('시즌케어 삭제 중 오류:', seasonCareError.message);
  }

  return { success: true };
};
