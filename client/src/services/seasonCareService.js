import { supabase } from '../supabaseClient';

// 전체 시즌케어 조회
export const getSeasonCares = async () => {
  const { data, error } = await supabase
    .from('season_care')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// 단일 시즌케어 조회
export const getSeasonCare = async (id) => {
  const { data, error } = await supabase
    .from('season_care')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// 시즌케어 등록
export const createSeasonCare = async (seasonCareData) => {
  const { data, error } = await supabase
    .from('season_care')
    .insert([seasonCareData])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

// 시즌케어 수정
export const updateSeasonCare = async (id, seasonCareData) => {
  const { data, error } = await supabase
    .from('season_care')
    .update(seasonCareData)
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

// 시즌케어 삭제
export const deleteSeasonCare = async (id) => {
  const { error } = await supabase
    .from('season_care')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { success: true };
};

// 시즌케어 대시보드 통계 조회
export const getSeasonCareDashboardStats = async () => {
  const services = await getSeasonCares();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const thisMonth = now.toISOString().slice(0, 7);

  // 시즌 기간 계산
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  let seasonStart, seasonEnd;
  if (currentMonth >= 10) {
    seasonStart = `${currentYear}-11-01`;
    seasonEnd = `${currentYear + 1}-04-30`;
  } else {
    seasonStart = `${currentYear - 1}-11-01`;
    seasonEnd = `${currentYear}-04-30`;
  }

  // 이번주 시작일 계산
  const startOfWeek = new Date(now);
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startOfWeek.setDate(now.getDate() + diff);
  const thisWeekStart = startOfWeek.toISOString().split('T')[0];

  const getServicesByPeriod = (period) => {
    switch(period) {
      case 'today':
        return services.filter(service => service.service_date === today);
      case 'week':
        return services.filter(service => service.service_date >= thisWeekStart);
      case 'month':
        return services.filter(service => service.service_date.startsWith(thisMonth));
      case 'season':
        return services.filter(service =>
          service.service_date >= seasonStart && service.service_date <= seasonEnd
        );
      case 'total':
        return services;
      default:
        return [];
    }
  };

  const calculateBranchStats = (periodServices) => {
    const stats = {
      '곤지암': 0,
      '대관령': 0,
      '비발디': 0
    };

    periodServices.forEach(service => {
      const branch = service.branch || '곤지암';
      if (stats.hasOwnProperty(branch)) {
        stats[branch]++;
      }
    });

    return stats;
  };

  const branchStatsByPeriod = {
    today: calculateBranchStats(getServicesByPeriod('today')),
    week: calculateBranchStats(getServicesByPeriod('week')),
    month: calculateBranchStats(getServicesByPeriod('month')),
    season: calculateBranchStats(getServicesByPeriod('season')),
    total: calculateBranchStats(getServicesByPeriod('total'))
  };

  const thisMonthServices = getServicesByPeriod('month');
  const thisMonthRevenue = thisMonthServices.reduce((sum, service) =>
    sum + (parseFloat(service.total_cost) || 0), 0
  );

  const thisSeasonServices = getServicesByPeriod('season');
  const thisSeasonRevenue = thisSeasonServices.reduce((sum, service) =>
    sum + (parseFloat(service.total_cost) || 0), 0
  );

  const branchStats = branchStatsByPeriod.month;

  const totalRevenue = services.reduce((sum, service) =>
    sum + (parseFloat(service.total_cost) || 0), 0
  );

  const uniqueCustomers = new Set(
    services.map(service => service.customer_phone)
      .filter(phone => phone)
  );

  const storedEquipmentCount = services.filter(service =>
    service.storage_location && !service.is_picked_up
  ).length;

  const pickupScheduledCount = services.filter(service =>
    service.pickup_date && !service.is_picked_up
  ).length;

  const recentServices = [...services]
    .sort((a, b) => new Date(b.service_date) - new Date(a.service_date))
    .slice(0, 5);

  return {
    todayServices: getServicesByPeriod('today').length,
    thisMonthServices: thisMonthServices.length,
    thisMonthRevenue,
    thisSeasonServices: thisSeasonServices.length,
    thisSeasonRevenue,
    branchStats,
    branchStatsByPeriod,
    totalRevenue,
    totalCustomers: uniqueCustomers.size,
    totalServices: services.length,
    storedEquipmentCount,
    pickupScheduledCount,
    recentServices
  };
};
