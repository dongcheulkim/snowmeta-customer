import React, { useState, useEffect } from 'react';
import SimpleCustomerList from './components/SimpleCustomerList';
import SeasonCare from './components/SeasonCare';
import PromoAthleteList from './components/PromoAthleteList';
import Schedule from './components/Schedule';
import CouponManagement from './components/CouponManagement';
import LoginPage from './components/LoginPage';
import FloatingMessenger from './components/FloatingMessenger';
import { useMediaQuery, BREAKPOINTS } from './hooks/useMediaQuery';
import { getNotices, createNotice, deleteNotice } from './services/noticeService';
import { updatePassword } from './services/userService';
import { getAllServices } from './services/serviceService';
import { getSeasonCares } from './services/seasonCareService';
import { getFullSeasonCares } from './services/fullSeasonCareService';
import logo from './assets/logo.svg';

// 매출 통계 모달 컴포넌트
const SalesStatisticsModal = ({ onClose }) => {
  const [services, setServices] = useState([]);
  const [seasonCares, setSeasonCares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general'); // 'general' or 'season'
  const [monthFilter, setMonthFilter] = useState('all'); // 'all', '11', '12', '1', '2', '3'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [servicesData, seasonCaresData] = await Promise.all([
        getAllServices(),
        getSeasonCares()
      ]);
      setServices(servicesData || []);
      setSeasonCares(seasonCaresData || []);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setServices([]);
      setSeasonCares([]);
    } finally {
      setLoading(false);
    }
  };

  // 월별 필터 함수
  const filterServicesByMonth = (servicesList) => {
    if (monthFilter === 'all') {
      return servicesList;
    }

    return servicesList.filter(service => {
      if (!service.service_date) return false;

      const serviceDate = new Date(service.service_date);
      const month = serviceDate.getMonth() + 1; // 0-11 -> 1-12
      const year = serviceDate.getFullYear();

      const filterMonth = parseInt(monthFilter);

      // 11월, 12월은 2025년
      if (filterMonth === 11 || filterMonth === 12) {
        return month === filterMonth && year === 2025;
      }
      // 1월, 2월, 3월은 2026년
      else if (filterMonth >= 1 && filterMonth <= 3) {
        return month === filterMonth && year === 2026;
      }

      return false;
    });
  };

  // 지점별 매출 집계
  const calculateBranchSales = () => {
    const branches = {
      '곤지암': { totalSales: 0, count: 0, paid: 0, unpaid: 0 },
      '비발디': { totalSales: 0, count: 0, paid: 0, unpaid: 0 },
      '대관령': { totalSales: 0, count: 0, paid: 0, unpaid: 0 }
    };

    if (!Array.isArray(services)) {
      return branches;
    }

    // 월별 필터 적용
    const filteredServices = filterServicesByMonth(services);

    filteredServices.forEach(service => {
      const branch = service.branch;
      if (branches[branch]) {
        // 엠버서더가 아닌 경우에만 매출 계산
        if (service.total_cost && service.total_cost !== '엠버서더') {
          const cost = typeof service.total_cost === 'string' ?
            parseInt(service.total_cost.replace(/[^0-9]/g, '')) :
            service.total_cost;

          if (!isNaN(cost)) {
            branches[branch].totalSales += cost;
            if (service.payment_status === 'paid') {
              branches[branch].paid += cost;
            } else {
              branches[branch].unpaid += cost;
            }
          }
        }
        branches[branch].count += 1;
      }
    });

    return branches;
  };

  // 시즌케어 지점별 매출 집계 (단순 결제지점 기준)
  const calculateSeasonCareSales = () => {
    const branches = {
      '곤지암': { totalSales: 0, count: 0 },
      '비발디': { totalSales: 0, count: 0 },
      '대관령': { totalSales: 0, count: 0 }
    };

    if (!Array.isArray(seasonCares)) {
      return branches;
    }

    // payment_location이 있고 total_cost가 있는 항목만 집계
    seasonCares.forEach(care => {
      if (care.payment_location && branches[care.payment_location]) {
        // 금액이 있으면 매출에 포함
        if (care.total_cost && care.total_cost !== '엠버서더') {
          const cost = typeof care.total_cost === 'string' ?
            parseInt(care.total_cost.replace(/[^0-9]/g, '')) :
            care.total_cost;

          if (!isNaN(cost)) {
            branches[care.payment_location].totalSales += cost;
            branches[care.payment_location].count += 1;
          }
        }
      }
    });

    return branches;
  };

  const branchSales = calculateBranchSales();
  const totalSales = Object.values(branchSales).reduce((sum, branch) => sum + branch.totalSales, 0);
  const seasonCareSales = calculateSeasonCareSales();
  const totalSeasonCareSales = Object.values(seasonCareSales).reduce((sum, branch) => sum + branch.totalSales, 0);

  const branchColors = {
    '곤지암': { bg: '#065F46', light: '#10B981', icon: '🏔️' },
    '비발디': { bg: '#7C2D12', light: '#F97316', icon: '🎿' },
    '대관령': { bg: '#1E40AF', light: '#3B82F6', icon: '⛷️' }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1F2937',
        borderRadius: '12px',
        maxWidth: '1000px',
        width: '100%',
        maxHeight: '85vh',
        overflow: 'auto',
        position: 'relative',
        border: '1px solid #374151'
      }}>
        {/* 헤더 */}
        <div style={{
          backgroundColor: '#10B981',
          borderBottom: '1px solid #374151',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px'
        }}>
          <div style={{
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2rem' }}>💰</span>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                매출 통계
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '2rem',
                cursor: 'pointer',
                padding: '0',
                lineHeight: '1'
              }}
            >
              ×
            </button>
          </div>

          {/* 탭 메뉴 */}
          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '0 24px 16px'
          }}>
            <button
              onClick={() => setActiveTab('general')}
              style={{
                flex: 1,
                padding: '12px 24px',
                backgroundColor: activeTab === 'general' ? '#fff' : 'rgba(255,255,255,0.2)',
                color: activeTab === 'general' ? '#10B981' : '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              일반정비
            </button>
            <button
              onClick={() => setActiveTab('season')}
              style={{
                flex: 1,
                padding: '12px 24px',
                backgroundColor: activeTab === 'season' ? '#fff' : 'rgba(255,255,255,0.2)',
                color: activeTab === 'season' ? '#10B981' : '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              시즌케어
            </button>
          </div>

          {/* 일반정비 월별 필터 */}
          {activeTab === 'general' && (
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '16px 24px',
              overflowX: 'auto'
            }}>
              {[
                { value: 'all', label: '전체' },
                { value: '11', label: '11월' },
                { value: '12', label: '12월' },
                { value: '1', label: '1월' },
                { value: '2', label: '2월' },
                { value: '3', label: '3월' }
              ].map(month => (
                <button
                  key={month.value}
                  onClick={() => setMonthFilter(month.value)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: monthFilter === month.value ? '#10B981' : '#374151',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  {month.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 내용 */}
        <div style={{ padding: '32px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>
              로딩 중...
            </div>
          ) : (
            <>
              {activeTab === 'general' ? (
                <>
                  {/* 전체 매출 */}
                  <div style={{
                    backgroundColor: '#111827',
                    border: '2px solid #10B981',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '32px',
                    textAlign: 'center'
                  }}>
                    <h3 style={{ color: '#9CA3AF', fontSize: '1rem', margin: '0 0 12px 0', fontWeight: '500' }}>
                      전체 매출
                    </h3>
                    <p style={{ color: '#10B981', fontSize: '2.5rem', fontWeight: '700', margin: 0 }}>
                      {totalSales.toLocaleString()}원
                    </p>
                  </div>

                  {/* 지점별 매출 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px'
                  }}>
                    {Object.entries(branchSales).map(([branch, data]) => (
                      <div key={branch} style={{
                        backgroundColor: '#111827',
                        border: `2px solid ${branchColors[branch].light}`,
                        borderRadius: '12px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          backgroundColor: branchColors[branch].bg,
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{ fontSize: '1.5rem' }}>{branchColors[branch].icon}</span>
                          <h4 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                            {branch}점
                          </h4>
                        </div>
                        <div style={{ padding: '20px' }}>
                          <div style={{ marginBottom: '16px' }}>
                            <p style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: '0 0 4px 0' }}>
                              총 매출
                            </p>
                            <p style={{ color: branchColors[branch].light, fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>
                              {data.totalSales.toLocaleString()}원
                            </p>
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px',
                            marginBottom: '16px'
                          }}>
                            <div style={{
                              backgroundColor: '#1F2937',
                              padding: '12px',
                              borderRadius: '8px'
                            }}>
                              <p style={{ color: '#9CA3AF', fontSize: '0.75rem', margin: '0 0 4px 0' }}>
                                결제완료
                              </p>
                              <p style={{ color: '#10B981', fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
                                {data.paid.toLocaleString()}원
                              </p>
                            </div>
                            <div style={{
                              backgroundColor: '#1F2937',
                              padding: '12px',
                              borderRadius: '8px'
                            }}>
                              <p style={{ color: '#9CA3AF', fontSize: '0.75rem', margin: '0 0 4px 0' }}>
                                미결제
                              </p>
                              <p style={{ color: '#DC2626', fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
                                {data.unpaid.toLocaleString()}원
                              </p>
                            </div>
                          </div>
                          <div style={{
                            backgroundColor: '#1F2937',
                            padding: '12px',
                            borderRadius: '8px'
                          }}>
                            <p style={{ color: '#9CA3AF', fontSize: '0.75rem', margin: '0 0 4px 0' }}>
                              서비스 건수
                            </p>
                            <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
                              {data.count}건
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* 시즌케어 전체 매출 */}
                  <div style={{
                    backgroundColor: '#111827',
                    border: '2px solid #10B981',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '32px',
                    textAlign: 'center'
                  }}>
                    <h3 style={{ color: '#9CA3AF', fontSize: '1rem', margin: '0 0 12px 0', fontWeight: '500' }}>
                      전체 매출 (첫 결제 기준)
                    </h3>
                    <p style={{ color: '#10B981', fontSize: '2.5rem', fontWeight: '700', margin: 0 }}>
                      {totalSeasonCareSales.toLocaleString()}원
                    </p>
                  </div>

                  {/* 시즌케어 지점별 매출 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px'
                  }}>
                    {Object.entries(seasonCareSales).map(([branch, data]) => (
                      <div key={branch} style={{
                        backgroundColor: '#111827',
                        border: `2px solid ${branchColors[branch].light}`,
                        borderRadius: '12px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          backgroundColor: branchColors[branch].bg,
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{ fontSize: '1.5rem' }}>{branchColors[branch].icon}</span>
                          <h4 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                            {branch}점
                          </h4>
                        </div>
                        <div style={{ padding: '20px' }}>
                          <div style={{ marginBottom: '16px' }}>
                            <p style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: '0 0 4px 0' }}>
                              첫 결제 매출
                            </p>
                            <p style={{ color: branchColors[branch].light, fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>
                              {data.totalSales.toLocaleString()}원
                            </p>
                          </div>
                          <div style={{
                            backgroundColor: '#1F2937',
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '12px'
                          }}>
                            <p style={{ color: '#9CA3AF', fontSize: '0.75rem', margin: '0 0 4px 0' }}>
                              첫 결제 계약 건수
                            </p>
                            <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
                              {data.count}건
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [refreshList, setRefreshList] = useState(0);
  const [activeCategory, setActiveCategory] = useState('home');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 반응형 디자인을 위한 미디어 쿼리
  const isMobile = useMediaQuery(BREAKPOINTS.mobile);
  const isTablet = useMediaQuery(BREAKPOINTS.tablet);
  const isSmall = useMediaQuery(BREAKPOINTS.small);
  const [notices, setNotices] = useState([]);
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    important: false
  });
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showNoticeDetail, setShowNoticeDetail] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);

  // 통합 검색 관련 state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allServices, setAllServices] = useState({ general: [], season: [], fullSeason: [] });
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState(null);

  const handleCustomerAdded = () => {
    setRefreshList(prev => prev + 1);
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    // 카테고리 변경 시 고객 필터 초기화
    setSelectedCustomerFilter(null);
  };

  // 검색 결과에서 서비스 타입 클릭 시 해당 페이지로 이동
  const handleServiceTypeClick = (customerName, customerPhone, serviceType) => {
    setSelectedCustomerFilter({ name: customerName, phone: customerPhone });

    if (serviceType === '일반정비') {
      setActiveCategory('general');
    } else if (serviceType === '시즌케어') {
      setActiveCategory('season');
    } else if (serviceType === '풀시즌케어') {
      setActiveCategory('fullseason');
    }

    // 검색창 초기화
    setSearchQuery('');
    setSearchResults([]);
  };

  // 검색 결과에서 서비스 타입 더블클릭 시 상세정보 팝업 열기
  const handleServiceTypeDoubleClick = (customerName, customerPhone, serviceType) => {
    setSelectedCustomerFilter({
      name: customerName,
      phone: customerPhone,
      openDetailModal: true // 상세정보 팝업 열기 플래그
    });

    if (serviceType === '일반정비') {
      setActiveCategory('general');
    } else if (serviceType === '시즌케어') {
      setActiveCategory('season');
    } else if (serviceType === '풀시즌케어') {
      setActiveCategory('fullseason');
    }

    // 검색창 초기화
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleLogin = (loginData) => {
    setUserInfo(loginData);
    setIsLoggedIn(true);
    // 로그인 정보를 sessionStorage에 저장 (브라우저 닫으면 자동 삭제)
    sessionStorage.setItem('snowmeta_user', JSON.stringify(loginData));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserInfo(null);
    setActiveCategory('home');
    // sessionStorage에서 로그인 정보 삭제
    sessionStorage.removeItem('snowmeta_user');
  };

  const handleAddNotice = async () => {
    if (!newNotice.title.trim() || !newNotice.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      const notice = await createNotice({
        title: newNotice.title,
        content: newNotice.content,
        author: userInfo?.username || '관리자',
        important: newNotice.important
      });

      await loadNotices(); // 목록 다시 로드
      setNewNotice({ title: '', content: '', important: false });
      setShowNoticeForm(false);
    } catch (error) {
      console.error('공지사항 등록 실패:', error);
      alert('공지사항 등록에 실패했습니다.');
    }
  };

  const handleDeleteNotice = async (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteNotice(id);
        await loadNotices(); // 목록 다시 로드
      } catch (error) {
        console.error('공지사항 삭제 실패:', error);
        alert('공지사항 삭제에 실패했습니다.');
      }
    }
  };

  const loadNotices = async () => {
    try {
      const data = await getNotices();
      // created_at을 date로 변환
      const noticesWithDate = data.map(notice => ({
        ...notice,
        date: notice.created_at.split('T')[0] || notice.created_at.split(' ')[0]
      }));
      setNotices(noticesWithDate);
    } catch (error) {
      console.error('공지사항 로드 실패:', error);
    }
  };

  const handleShowNoticeDetail = (notice) => {
    setSelectedNotice(notice);
    setShowNoticeDetail(true);
  };

  const handleCloseNoticeDetail = () => {
    setSelectedNotice(null);
    setShowNoticeDetail(false);
  };


  // 페이지 로드 시 저장된 로그인 정보 확인
  useEffect(() => {
    const savedUserInfo = sessionStorage.getItem('snowmeta_user');
    if (savedUserInfo) {
      try {
        const parsedUserInfo = JSON.parse(savedUserInfo);
        setUserInfo(parsedUserInfo);
        setIsLoggedIn(true);
      } catch (error) {
        sessionStorage.removeItem('snowmeta_user');
      }
    }
  }, []);

  // 공지사항 로드
  useEffect(() => {
    if (isLoggedIn) {
      loadNotices();
      loadAllServicesData();
    }
  }, [isLoggedIn]);

  // 모든 서비스 데이터 미리 로드
  const loadAllServicesData = async () => {
    try {
      const [generalServices, seasonCares, fullSeasonCares] = await Promise.all([
        getAllServices(),
        getSeasonCares(),
        getFullSeasonCares()
      ]);
      setAllServices({
        general: generalServices || [],
        season: seasonCares || [],
        fullSeason: fullSeasonCares || []
      });
    } catch (error) {
      console.error('서비스 데이터 로드 실패:', error);
    }
  };

  // 전화번호 정규화 함수 (하이픈 제거, 공백 제거)
  const normalizePhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/[-\s]/g, '');
  };

  // 이름 정규화 함수 (공백 제거)
  const normalizeName = (name) => {
    if (!name) return '';
    return name.replace(/\s/g, '');
  };

  // 실시간 검색 (검색어 변경 시 자동 검색)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const customerGroups = {};

    // 일반정비 검색
    allServices.general.forEach(service => {
      if (
        service.customer_name?.toLowerCase().includes(query) ||
        service.customer_phone?.toLowerCase().includes(query)
      ) {
        // 정규화된 이름과 전화번호로 고유 키 생성
        const normalizedName = normalizeName(service.customer_name);
        const normalizedPhone = normalizePhone(service.customer_phone);
        const key = `${normalizedName}_${normalizedPhone}`;

        if (!customerGroups[key]) {
          customerGroups[key] = {
            customer_name: service.customer_name,
            customer_phone: service.customer_phone,
            types: new Set()
          };
        }
        customerGroups[key].types.add('일반정비');
      }
    });

    // 시즌케어 검색
    allServices.season.forEach(service => {
      if (
        service.customer_name?.toLowerCase().includes(query) ||
        service.customer_phone?.toLowerCase().includes(query)
      ) {
        // 정규화된 이름과 전화번호로 고유 키 생성
        const normalizedName = normalizeName(service.customer_name);
        const normalizedPhone = normalizePhone(service.customer_phone);
        const key = `${normalizedName}_${normalizedPhone}`;

        if (!customerGroups[key]) {
          customerGroups[key] = {
            customer_name: service.customer_name,
            customer_phone: service.customer_phone,
            types: new Set()
          };
        }
        customerGroups[key].types.add('시즌케어');
      }
    });

    // 풀시즌케어 검색
    allServices.fullSeason.forEach(service => {
      if (
        service.customer_name?.toLowerCase().includes(query) ||
        service.customer_phone?.toLowerCase().includes(query)
      ) {
        // 정규화된 이름과 전화번호로 고유 키 생성
        const normalizedName = normalizeName(service.customer_name);
        const normalizedPhone = normalizePhone(service.customer_phone);
        const key = `${normalizedName}_${normalizedPhone}`;

        if (!customerGroups[key]) {
          customerGroups[key] = {
            customer_name: service.customer_name,
            customer_phone: service.customer_phone,
            types: new Set()
          };
        }
        customerGroups[key].types.add('풀시즌케어');
      }
    });

    // 결과 변환
    const results = Object.values(customerGroups).map(group => ({
      customer_name: group.customer_name,
      customer_phone: group.customer_phone,
      types: Array.from(group.types)
    }));

    setSearchResults(results);
  }, [searchQuery, allServices]);

  // 실시간 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);



  // 날짜와 시간 포맷팅
  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}:${seconds}`
    };
  };

  // 로그인되지 않은 경우 로그인 페이지 표시
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #000000 100%)',
      display: 'flex'
    }}>
      {/* Mobile & Tablet Header */}
      {(isMobile || isTablet) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: '#000',
          borderBottom: '1px solid #374151',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px'
        }}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            ☰
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              backgroundColor: '#fff',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: '#000', fontWeight: 'bold', fontSize: '14px' }}>S</span>
            </div>
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>
              {userInfo?.branchName || 'SnowMeta'}
            </span>
          </div>
        </div>
      )}

      {/* Mobile & Tablet Overlay */}
      {(isMobile || isTablet) && isSidebarOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1500
          }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside style={{
        width: isMobile ? '280px' : (isTablet ? '240px' : '280px'),
        backgroundColor: '#000',
        borderRight: '1px solid #374151',
        boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
        position: 'fixed',
        height: '100vh',
        left: (isMobile || isTablet) ? (isSidebarOpen ? 0 : '-280px') : 0,
        top: 0,
        zIndex: 1600,
        display: 'flex',
        flexDirection: 'column',
        transition: 'left 0.3s ease-in-out'
      }}>
        {/* Logo Section */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #374151'
        }}>
          <img
            src={logo}
            alt="SnowMeta"
            style={{
              width: '220px',
              height: 'auto',
              marginBottom: '0.75rem'
            }}
          />
          <div style={{ paddingLeft: '0.25rem' }}>
            <p style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: 0 }}>
              {userInfo?.branchName || '고객관리 시스템'}
            </p>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav style={{
          padding: '1rem',
          flex: 1,
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={() => handleCategoryChange('home')}
              style={{
                padding: '12px 16px',
                backgroundColor: activeCategory === 'home' ? '#374151' : 'transparent',
                color: activeCategory === 'home' ? '#fff' : '#9CA3AF',
                border: '1px solid #374151',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🏠 홈
            </button>
            <button
              onClick={() => handleCategoryChange('general')}
              style={{
                padding: '12px 16px',
                backgroundColor: activeCategory === 'general' ? '#374151' : 'transparent',
                color: activeCategory === 'general' ? '#fff' : '#9CA3AF',
                border: '1px solid #374151',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🔧 일반정비
            </button>
            <button
              onClick={() => handleCategoryChange('season')}
              style={{
                padding: '12px 16px',
                backgroundColor: activeCategory === 'season' ? '#374151' : 'transparent',
                color: activeCategory === 'season' ? '#fff' : '#9CA3AF',
                border: '1px solid #374151',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ⛷️ 시즌케어
            </button>
            <button
              onClick={() => handleCategoryChange('fullseason')}
              style={{
                padding: '12px 16px',
                backgroundColor: activeCategory === 'fullseason' ? '#374151' : 'transparent',
                color: activeCategory === 'fullseason' ? '#fff' : '#9CA3AF',
                border: '1px solid #374151',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ⛷️ 풀시즌케어
            </button>
            <button
              onClick={() => handleCategoryChange('promo')}
              style={{
                padding: '12px 16px',
                backgroundColor: activeCategory === 'promo' ? '#374151' : 'transparent',
                color: activeCategory === 'promo' ? '#fff' : '#9CA3AF',
                border: '1px solid #374151',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🏆 프로모션 선수
            </button>
            <button
              onClick={() => handleCategoryChange('schedule')}
              style={{
                padding: '12px 16px',
                backgroundColor: activeCategory === 'schedule' ? '#374151' : 'transparent',
                color: activeCategory === 'schedule' ? '#fff' : '#9CA3AF',
                border: '1px solid #374151',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📅 시합일정
            </button>
            <button
              onClick={() => handleCategoryChange('coupon')}
              style={{
                padding: '12px 16px',
                backgroundColor: activeCategory === 'coupon' ? '#374151' : 'transparent',
                color: activeCategory === 'coupon' ? '#fff' : '#9CA3AF',
                border: '1px solid #374151',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🎫 정비 쿠폰
            </button>
          </div>
        </nav>
        
        {/* Footer */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid #374151'
        }}>
          <div style={{
            color: '#D1D5DB',
            fontSize: '0.75rem',
            textAlign: 'center'
          }}>
            {/* 날짜와 시간 */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '600' }}>
                {formatDateTime(currentDateTime).date}
              </div>
              <div style={{ color: '#10B981', fontSize: '0.9rem', fontWeight: '700' }}>
                {formatDateTime(currentDateTime).time}
              </div>
            </div>

            <div style={{ color: '#6B7280' }}>Since 2021</div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                backgroundColor: '#10B981',
                borderRadius: '50%'
              }}></div>
              <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>System Online</span>
            </div>

            {/* 로그아웃 버튼 */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: '#DC2626',
                color: '#fff',
                border: '1px solid #DC2626',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#B91C1C';
                e.target.style.borderColor = '#B91C1C';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#DC2626';
                e.target.style.borderColor = '#DC2626';
              }}
            >
              🚪 로그아웃
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        marginLeft: (isMobile || isTablet) ? '0' : '280px',
        marginRight: '0',
        marginTop: (isMobile || isTablet) ? '60px' : '0',
        flex: 1,
        padding: (isMobile || isTablet) ? '1rem' : '1rem 1rem 1rem 2rem',
        minHeight: (isMobile || isTablet) ? 'calc(100vh - 60px)' : '100vh',
        transition: 'margin-left 0.3s ease-in-out',
        width: '100%',
        overflow: 'auto'
      }}>
        {activeCategory === 'home' && (
          <div style={{ padding: '0' }}>
            {/* 헤더 */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold', margin: '0' }}>
                  공지사항
                </h1>
                {userInfo?.isAdmin && (
                  <button
                    onClick={() => setShowSalesModal(true)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#10B981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    💰 매출
                  </button>
                )}
              </div>
              <p style={{ color: '#9CA3AF', fontSize: '1rem', margin: '0' }}>
                SnowMeta 고객관리 시스템 공지사항
              </p>
            </div>

            {/* 공지사항 추가 버튼 - 관리자만 */}
            {userInfo?.isAdmin && (
              <div style={{
                backgroundColor: '#1e293b',
                border: '1px solid #374151',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showNoticeForm ? '1rem' : '0' }}>
                  <h3 style={{ color: '#fff', fontSize: '1.125rem', fontWeight: '600', margin: '0' }}>
                    공지사항 관리 (관리자 전용)
                  </h3>
                  <button
                    onClick={() => setShowNoticeForm(!showNoticeForm)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: showNoticeForm ? '#6B7280' : '#10B981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {showNoticeForm ? '취소' : '📝 공지사항 작성'}
                  </button>
                </div>

              {showNoticeForm && (
                <div style={{
                  backgroundColor: '#111827',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  border: '1px solid #374151'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{
                        color: '#9CA3AF',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        display: 'block',
                        marginBottom: '0.5rem'
                      }}>제목</label>
                      <input
                        type="text"
                        value={newNotice.title}
                        onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                        placeholder="공지사항 제목을 입력하세요"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          backgroundColor: '#374151',
                          border: '1px solid #4B5563',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{
                        color: '#9CA3AF',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        display: 'block',
                        marginBottom: '0.5rem'
                      }}>내용</label>
                      <textarea
                        value={newNotice.content}
                        onChange={(e) => setNewNotice({...newNotice, content: e.target.value})}
                        placeholder="공지사항 내용을 입력하세요"
                        rows="4"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          backgroundColor: '#374151',
                          border: '1px solid #4B5563',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '0.875rem',
                          resize: 'vertical',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={newNotice.important}
                        onChange={(e) => setNewNotice({...newNotice, important: e.target.checked})}
                        id="important-notice"
                        style={{ marginRight: '0.5rem' }}
                      />
                      <label htmlFor="important-notice" style={{
                        color: '#9CA3AF',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}>중요 공지사항</label>
                    </div>

                    <button
                      onClick={handleAddNotice}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#3B82F6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        alignSelf: 'flex-start'
                      }}
                    >
                      공지사항 등록
                    </button>
                  </div>
                </div>
              )}
              </div>
            )}

            {/* 통합 검색창 */}
            <div style={{
              backgroundColor: '#1e293b',
              border: '1px solid #374151',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <h3 style={{ color: '#fff', fontSize: '1.125rem', fontWeight: '600', margin: '0 0 1rem' }}>
                🔍 고객 검색 (실시간)
              </h3>
              <div style={{ marginBottom: searchResults.length > 0 ? '1.5rem' : '0' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이름 또는 전화번호를 입력하세요..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#374151',
                    border: '2px solid #4B5563',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 검색 결과 */}
              {searchResults.length > 0 && (
                <div>
                  <div style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                    {searchResults.length}명의 고객
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                    {searchResults.map((result, index) => (
                      <div
                        key={`${result.customer_name}-${result.customer_phone}-${index}`}
                        style={{
                          backgroundColor: '#111827',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          padding: '1rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                              <span style={{ color: '#fff', fontSize: '1rem', fontWeight: '600' }}>
                                {result.customer_name}
                              </span>
                              <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                                {result.customer_phone}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {result.types.map((type, typeIndex) => (
                                <span
                                  key={typeIndex}
                                  onClick={() => handleServiceTypeClick(result.customer_name, result.customer_phone, type)}
                                  onDoubleClick={() => handleServiceTypeDoubleClick(result.customer_name, result.customer_phone, type)}
                                  style={{
                                    backgroundColor:
                                      type === '일반정비' ? '#10B981' :
                                      type === '시즌케어' ? '#3B82F6' :
                                      '#F59E0B',
                                    color: '#fff',
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.opacity = '0.8';
                                    e.target.style.transform = 'scale(1.05)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.opacity = '1';
                                    e.target.style.transform = 'scale(1)';
                                  }}
                                  title="클릭: 목록 보기 | 더블클릭: 상세정보"
                                >
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchQuery && searchResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
                  검색 결과가 없습니다.
                </div>
              )}
            </div>

            {/* 공지사항 목록 */}
            <div style={{
              backgroundColor: '#1e293b',
              border: '1px solid #374151',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h3 style={{ color: '#fff', fontSize: '1.125rem', fontWeight: '600', margin: '0 0 1.5rem' }}>
                공지사항 목록 ({notices.length}개)
              </h3>

              {notices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>
                  등록된 공지사항이 없습니다.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {notices
                    .sort((a, b) => {
                      // 중요 공지사항을 먼저 정렬하고, 그 다음은 최신 순으로 정렬
                      if (a.important && !b.important) return -1;
                      if (!a.important && b.important) return 1;
                      return new Date(b.date) - new Date(a.date);
                    })
                    .map((notice) => (
                    <div
                      key={notice.id}
                      style={{
                        backgroundColor: '#111827',
                        border: notice.important ? '1px solid #DC2626' : '1px solid #374151',
                        borderRadius: '6px',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minHeight: '48px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                        {notice.important && (
                          <div style={{
                            backgroundColor: '#DC2626',
                            color: '#fff',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: '600',
                            flexShrink: 0
                          }}>
                            중요
                          </div>
                        )}
                        
                        <h4 style={{
                          color: '#fff',
                          fontSize: '0.95rem',
                          fontWeight: '500',
                          margin: '0',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {notice.title}
                        </h4>
                        
                        <div style={{
                          color: '#6B7280',
                          fontSize: '0.7rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          flexShrink: 0
                        }}>
                          <span>{notice.author}</span>
                          <span>·</span>
                          <span>{notice.date}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.375rem', marginLeft: '1rem' }}>
                        <button
                          onClick={() => handleShowNoticeDetail(notice)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: '#3B82F6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          보기
                        </button>
                        {userInfo?.isAdmin && (
                          <button
                            onClick={() => handleDeleteNotice(notice.id)}
                            style={{
                              padding: '0.375rem 0.75rem',
                              backgroundColor: '#DC2626',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 공지사항 상세보기 모달 */}
            {showNoticeDetail && selectedNotice && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                padding: '20px'
              }}>
                <div style={{
                  backgroundColor: '#1F2937',
                  borderRadius: '12px',
                  maxWidth: '600px',
                  width: '100%',
                  maxHeight: '80vh',
                  overflow: 'auto',
                  position: 'relative',
                  border: '1px solid #374151'
                }}>
                  {/* 헤더 */}
                  <div style={{
                    backgroundColor: '#000',
                    borderBottom: '1px solid #374151',
                    padding: '24px',
                    borderTopLeftRadius: '12px',
                    borderTopRightRadius: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#fff',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{ fontSize: '16px' }}>📢</span>
                        </div>
                        <h2 style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: '#fff',
                          margin: 0
                        }}>공지사항 상세보기</h2>
                        {selectedNotice.important && (
                          <div style={{
                            backgroundColor: '#DC2626',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            중요
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleCloseNoticeDetail}
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#374151',
                          border: 'none',
                          borderRadius: '50%',
                          color: '#9CA3AF',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* 내용 */}
                  <div style={{ padding: '24px' }}>
                    {/* 제목 */}
                    <h3 style={{
                      color: '#fff',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      margin: '0 0 16px 0',
                      lineHeight: '1.3'
                    }}>
                      {selectedNotice.title}
                    </h3>

                    {/* 메타 정보 */}
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      marginBottom: '24px',
                      padding: '12px 16px',
                      backgroundColor: '#111827',
                      borderRadius: '8px',
                      border: '1px solid #374151'
                    }}>
                      <span style={{
                        color: '#9CA3AF',
                        fontSize: '14px'
                      }}>작성자: <span style={{ color: '#fff', fontWeight: '500' }}>{selectedNotice.author}</span></span>
                      <span style={{
                        color: '#9CA3AF',
                        fontSize: '14px'
                      }}>작성일: <span style={{ color: '#fff', fontWeight: '500' }}>{selectedNotice.date}</span></span>
                    </div>

                    {/* 내용 */}
                    <div style={{
                      backgroundColor: '#111827',
                      borderRadius: '8px',
                      padding: '20px',
                      border: '1px solid #374151'
                    }}>
                      <p style={{
                        color: '#D1D5DB',
                        fontSize: '16px',
                        lineHeight: '1.6',
                        margin: '0',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {selectedNotice.content}
                      </p>
                    </div>

                    {/* 닫기 버튼 */}
                    <div style={{
                      marginTop: '24px',
                      textAlign: 'center'
                    }}>
                      <button
                        onClick={handleCloseNoticeDetail}
                        style={{
                          padding: '12px 24px',
                          backgroundColor: '#374151',
                          color: '#fff',
                          border: '1px solid #4B5563',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        닫기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {activeCategory === 'general' && (
          <div style={{ padding: '0' }}>
            <SimpleCustomerList
              key={refreshList}
              onServiceAdded={handleCustomerAdded}
              selectedCustomerFilter={selectedCustomerFilter}
            />
          </div>
        )}

        {activeCategory === 'season' && (
          <div style={{ padding: '0' }}>
            <SeasonCare
              userInfo={userInfo}
              selectedCustomerFilter={selectedCustomerFilter}
            />
          </div>
        )}

        {activeCategory === 'fullseason' && (
          <div style={{ padding: '0' }}>
            <SeasonCare
              userInfo={userInfo}
              isFullSeason={true}
              selectedCustomerFilter={selectedCustomerFilter}
            />
          </div>
        )}

        {activeCategory === 'promo' && (
          <div style={{ padding: '0' }}>
            <PromoAthleteList />
          </div>
        )}

        {activeCategory === 'schedule' && (
          <div style={{ padding: '0' }}>
            <Schedule />
          </div>
        )}

        {activeCategory === 'coupon' && (
          <div style={{ padding: '0' }}>
            <CouponManagement userInfo={userInfo} />
          </div>
        )}

      </main>


      {/* 매출 통계 모달 */}
      {showSalesModal && (
        <SalesStatisticsModal
          onClose={() => setShowSalesModal(false)}
        />
      )}

      {/* Floating Messenger - 항상 표시 */}
      <FloatingMessenger userInfo={userInfo} />
    </div>
  );
}

export default App;
