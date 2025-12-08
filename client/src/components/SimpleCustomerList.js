import React, { useState, useEffect } from 'react';
import { getCustomers, createCustomer, deleteCustomer } from '../services/customerService';
import { getServices, deleteService, createService, updateService } from '../services/serviceService';
import ServiceFormModal from './ServiceFormModal';
import { useMediaQuery, BREAKPOINTS } from '../hooks/useMediaQuery';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const SimpleCustomerList = ({ onServiceAdded }) => {
  const isMobile = useMediaQuery(BREAKPOINTS.mobile);
  const isTablet = useMediaQuery(BREAKPOINTS.tablet);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);
  const [branchFilter, setBranchFilter] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 20 });
  const [allServices, setAllServices] = useState([]); // 전체 서비스 데이터 저장
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    customerMemo: '',
    services: [{
      serviceDescription: '',
      totalCost: ''
    }]
  });
  const [editingService, setEditingService] = useState(null);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [isEditingCustomerInfo, setIsEditingCustomerInfo] = useState(false);
  const [editedCustomerInfo, setEditedCustomerInfo] = useState({
    name: '',
    phone: '',
    memo: ''
  });
  const [editingServiceId, setEditingServiceId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [customersData, allServicesResponse] = await Promise.all([
        getCustomers(),
        getServices(1, 999999) // 전체 데이터 가져오기
      ]);
      setCustomers(customersData.data || customersData || []);

      // 전체 서비스 데이터 저장
      if (allServicesResponse.data) {
        setAllServices(allServicesResponse.data);
      } else {
        setAllServices(allServicesResponse || []);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setError(error.message || '데이터를 불러오는데 실패했습니다.');
      setCustomers([]);
      setAllServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleServiceUpdated = () => {
    fetchData();
    if (onServiceAdded) {
      onServiceAdded();
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();

    // 서비스가 하나도 없으면 경고
    if (!newCustomerData.services || newCustomerData.services.length === 0) {
      alert('최소 하나의 서비스를 추가해주세요.');
      return;
    }

    try {
      // 각 서비스를 개별적으로 생성 (createService 사용)
      for (const service of newCustomerData.services) {
        // 결제현황이 엠버서더이거나 totalCost가 엠버서더인 경우
        const isAmbassador = newCustomerData.paymentStatus === 'ambassador' || service.totalCost === '엠버서더';
        const totalCost = isAmbassador
          ? '엠버서더'
          : (parseInt(service.totalCost) || 0);        const serviceData = {
          customer_name: newCustomerData.name,
          customer_phone: newCustomerData.phone,
          service_description: service.serviceDescription || '-',
          total_cost: totalCost,
          service_date: newCustomerData.serviceDate || new Date().toISOString().split('T')[0],
          payment_status: isAmbassador ? 'paid' : (newCustomerData.paymentStatus || 'unpaid'),
          payment_location: newCustomerData.paymentLocation || '',
          notes: newCustomerData.notes || '',
          service_type: newCustomerData.serviceType || '일반정비',
          branch: newCustomerData.paymentLocation || '곤지암',
          customer_memo: newCustomerData.customerMemo || ''
        };        await createService(serviceData);
      }

      // 폼 초기화
      setNewCustomerData({
        name: '',
        phone: '',
        email: '',
        address: '',
        customerMemo: '',
        services: [{
          serviceDescription: '',
          totalCost: ''
        }]
      });
      setShowAddCustomerForm(false);

      // 데이터 새로고침
      await fetchData();

      // 세부정보 모달이 열려있으면 해당 고객 정보 업데이트
      if (showDetailModal && selectedCustomerForDetail) {
        const updatedServices = await getServices();
        const customerServices = (updatedServices.data || updatedServices).filter(
          s => s.customer_phone === selectedCustomerForDetail.customer_phone
        );

        // 고객 통계 재계산
        const totalServices = customerServices.length;
        const unpaidServices = customerServices.filter(
          s => s.payment_status === 'unpaid' || s.payment_status === '미결제'
        ).length;
        const totalAmount = customerServices.reduce((sum, s) => sum + (parseInt(s.total_cost) || 0), 0);

        setSelectedCustomerForDetail({
          customer_name: selectedCustomerForDetail.customer_name,
          customer_phone: selectedCustomerForDetail.customer_phone,
          customer_memo: customerServices[0]?.customer_memo || selectedCustomerForDetail.customer_memo || '',
          services: customerServices,
          totalServices,
          unpaidServices,
          totalAmount
        });
      }
    } catch (error) {      alert('고객 등록에 실패했습니다.');
    }
  };

  // 전체 서비스로 고객별 데이터 그룹화 (통계용)
  const allGroupedCustomers = allServices.reduce((acc, service) => {
    const key = `${service.customer_name}-${service.customer_phone}`;
    if (!acc[key]) {
      acc[key] = {
        customer_name: service.customer_name,
        customer_phone: service.customer_phone,
        customer_memo: service.customer_memo || '',
        services: [],
        totalServices: 0,
        unpaidServices: 0,
        totalAmount: 0,
        firstBranch: null // 최초 등록 지점
      };
    }
    acc[key].services.push(service);
    acc[key].totalServices += 1;
    acc[key].totalAmount += parseInt(service.total_cost) || 0;
    if (service.payment_status === 'unpaid' || service.payment_status === '미결제') {
      acc[key].unpaidServices += 1;
    }
    // 가장 최신 메모로 업데이트
    if (service.customer_memo) {
      acc[key].customer_memo = service.customer_memo;
    }
    return acc;
  }, {});

  // 각 고객의 최초 등록 지점 찾기 (가장 오래된 서비스의 지점)
  Object.values(allGroupedCustomers).forEach(customer => {
    if (customer.services.length > 0) {
      const sortedServices = [...customer.services].sort((a, b) => {
        const dateA = new Date(a.service_date || a.created_at);
        const dateB = new Date(b.service_date || b.created_at);
        return dateA - dateB;
      });
      customer.firstBranch = sortedServices[0].branch;
      customer.firstService = sortedServices[0]; // 1번째 서비스 저장
    }
  });

  const allCustomerList = Object.values(allGroupedCustomers);

  // 지점별 고객 수 계산
  const branchStats = allCustomerList.reduce((acc, customer) => {
    const branch = customer.firstBranch;
    if (branch) {
      acc[branch] = (acc[branch] || 0) + 1;
    }
    return acc;
  }, {});

  // 검색 및 미결제 필터링 (전체 고객 기준)
  let filteredAllCustomerList = allCustomerList.filter(customer => {
    // 지점 필터 적용
    if (branchFilter && customer.firstBranch !== branchFilter) {
      return false;
    }

    // 미결제 필터 적용
    if (showUnpaidOnly && customer.unpaidServices === 0) {
      return false;
    }

    // 검색 필터 적용
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.customer_name.toLowerCase().includes(searchLower) ||
      customer.customer_phone.toLowerCase().includes(searchLower)
    );
  });

  // 지점 필터가 활성화된 경우, 각 고객의 서비스를 1번째만 보여주도록 수정
  if (branchFilter) {
    filteredAllCustomerList = filteredAllCustomerList.map(customer => ({
      ...customer,
      services: customer.firstService ? [customer.firstService] : [],
      totalServices: 1,
      unpaidServices: customer.firstService && (customer.firstService.payment_status === 'unpaid' || customer.firstService.payment_status === '미결제') ? 1 : 0,
      totalAmount: parseInt(customer.firstService?.total_cost) || 0
    }));
  }

  // 페이지네이션 적용
  const customersPerPage = 20;
  const totalPages = Math.ceil(filteredAllCustomerList.length / customersPerPage);
  const startIndex = (currentPage - 1) * customersPerPage;
  const endIndex = startIndex + customersPerPage;
  const paginatedCustomerList = filteredAllCustomerList.slice(startIndex, endIndex);

  const handleDeleteCustomer = async (customer) => {
    if (window.confirm(`${customer.customer_name} 고객의 모든 서비스 기록을 삭제하시겠습니까?\n\n총 ${customer.totalServices}개의 서비스가 삭제됩니다.`)) {
      try {
        // 해당 고객의 모든 서비스 삭제
        for (const service of customer.services) {
          await deleteService(service.id);
        }
        fetchData();
      } catch (error) {        alert('삭제에 실패했습니다.');
      }
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteService(serviceId);
        fetchData();
      } catch (error) {        alert('삭제에 실패했습니다.');
      }
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setShowEditServiceModal(true);
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    try {
      const { updateService } = await import('../services/serviceService');

      // total_cost 처리: "엠버서더"면 그대로, 숫자면 정수로 변환
      const processedService = {
        ...editingService,
        total_cost: editingService.total_cost === '엠버서더'
          ? '엠버서더'
          : (parseInt(editingService.total_cost) || 0).toString()
      };

      await updateService(editingService.id, processedService);

      setShowEditServiceModal(false);
      setEditingService(null);

      // 데이터 새로고침 후 상세 모달 업데이트
      await fetchData();

      // 업데이트된 고객 정보 다시 가져오기
      const updatedServices = await getServices(1, 999999);
      const customerServices = (updatedServices.data || updatedServices).filter(
        s => s.customer_phone === selectedCustomerForDetail.customer_phone
      );

      // 고객 통계 재계산
      const totalServices = customerServices.length;
      const unpaidServices = customerServices.filter(
        s => s.payment_status === 'unpaid' || s.payment_status === '미결제'
      ).length;
      const totalAmount = customerServices.reduce((sum, s) => sum + (parseInt(s.total_cost) || 0), 0);

      setSelectedCustomerForDetail({
        customer_name: selectedCustomerForDetail.customer_name,
        customer_phone: selectedCustomerForDetail.customer_phone,
        customer_memo: customerServices[0]?.customer_memo || selectedCustomerForDetail.customer_memo || '',
        services: customerServices,
        totalServices,
        unpaidServices,
        totalAmount
      });

      alert('수정되었습니다.');
    } catch (error) {      alert('수정에 실패했습니다.');
    }
  };

  const handleSaveCustomerInfo = async () => {
    try {
      console.log('수정 시작 - 선택된 고객:', selectedCustomerForDetail);
      console.log('수정할 정보:', editedCustomerInfo);

      // 해당 고객의 모든 서비스 업데이트
      const updatePromises = selectedCustomerForDetail.services.map(service => {
        const updateData = {
          customer_name: editedCustomerInfo.name,
          customer_phone: editedCustomerInfo.phone,
          customer_memo: editedCustomerInfo.memo,
          service_description: service.service_description,
          total_cost: service.total_cost,
          service_date: service.service_date,
          payment_status: service.payment_status,
          branch: service.branch,
          notes: service.notes || null
        };
        console.log('업데이트할 서비스 ID:', service.id, '데이터:', updateData);
        return updateService(service.id, updateData);
      });

      const results = await Promise.all(updatePromises);
      console.log('업데이트 성공:', results);

      // 데이터 새로고침
      await fetchData();

      // 업데이트된 고객 정보 다시 가져오기
      const updatedServices = await getServices(1, 999999);
      const customerServices = (updatedServices.data || updatedServices).filter(
        s => s.customer_phone === editedCustomerInfo.phone
      );

      const totalServices = customerServices.length;
      const unpaidServices = customerServices.filter(
        s => s.payment_status === 'unpaid' || s.payment_status === '미결제'
      ).length;
      const totalAmount = customerServices.reduce((sum, s) => sum + (parseInt(s.total_cost) || 0), 0);

      setSelectedCustomerForDetail({
        customer_name: editedCustomerInfo.name,
        customer_phone: editedCustomerInfo.phone,
        customer_memo: editedCustomerInfo.memo,
        services: customerServices,
        totalServices,
        unpaidServices,
        totalAmount
      });

      setIsEditingCustomerInfo(false);
      alert('고객 정보가 수정되었습니다.');
    } catch (error) {
      console.error('고객 정보 수정 에러:', error);
      alert('고객 정보 수정에 실패했습니다: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: '#9CA3AF'
      }}>
        고객 목록을 불러오는 중...
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="일반정비 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{
            color: '#fff',
            fontSize: '2rem',
            fontWeight: 'bold',
            margin: '0 0 0.5rem'
          }}>
            🔧 일반정비 관리
          </h1>
          <p style={{
            color: '#9CA3AF',
            fontSize: '1rem',
            margin: '0'
          }}>
            고객별 일반정비 서비스 관리
          </p>
        </div>
      </div>

      {/* 검색 바 */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="고객명, 전화번호로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#374151',
              border: '1px solid #4B5563',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#9CA3AF',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Customer Grid */}
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #374151',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        {/* 지점별 필터 */}
        <div style={{
          backgroundColor: '#000',
          padding: '1.5rem',
          borderBottom: '1px solid #374151',
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* 전체 버튼 */}
          <div
            onClick={() => setBranchFilter(null)}
            style={{
              backgroundColor: '#1F2937',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #374151',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer'
            }}
          >
            <h3 style={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: '500', margin: '0' }}>
              전체
            </h3>
            <p style={{ color: '#3B82F6', fontSize: '1.25rem', fontWeight: 'bold', margin: '0' }}>
              {allCustomerList.length}
            </p>
          </div>

          {/* 지점별 버튼 */}
          {Object.entries(branchStats).sort(([a], [b]) => a.localeCompare(b)).map(([branch, count]) => (
            <div
              key={branch}
              onClick={() => setBranchFilter(branchFilter === branch ? null : branch)}
              style={{
                backgroundColor: branchFilter === branch ? '#1E3A5F' : '#1F2937',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: `1px solid ${branchFilter === branch ? '#3B82F6' : '#374151'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer'
              }}
            >
              <h3 style={{
                color: branchFilter === branch ? '#60A5FA' : '#9CA3AF',
                fontSize: '0.75rem',
                fontWeight: '500',
                margin: '0'
              }}>
                {branch}
              </h3>
              <p style={{
                color: branchFilter === branch ? '#60A5FA' : '#3B82F6',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                margin: '0'
              }}>
                {count}
              </p>
            </div>
          ))}

          {/* 미결제 버튼 */}
          <div
            onClick={() => setShowUnpaidOnly(!showUnpaidOnly)}
            style={{
              backgroundColor: showUnpaidOnly ? '#7C2D12' : '#1F2937',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: `1px solid ${showUnpaidOnly ? '#DC2626' : '#374151'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer'
            }}
          >
            <h3 style={{
              color: showUnpaidOnly ? '#FCA5A5' : '#9CA3AF',
              fontSize: '0.75rem',
              fontWeight: '500',
              margin: '0'
            }}>
              미결제
            </h3>
            <p style={{
              color: showUnpaidOnly ? '#FCA5A5' : '#DC2626',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              margin: '0'
            }}>
              {allCustomerList.filter(customer => customer.unpaidServices > 0).length}
            </p>
          </div>

          {/* 새 고객 등록 버튼 */}
          <button
            onClick={() => setShowAddCustomerForm(true)}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#10B981',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            ➕ 새 고객 등록
          </button>
        </div>

        {allCustomerList.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#9CA3AF'
          }}>
            등록된 고객이 없습니다.
          </div>
        ) : filteredAllCustomerList.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#9CA3AF'
          }}>
            검색 결과가 없습니다.
            <br />
            <span style={{ fontSize: '0.875rem', marginTop: '0.5rem', display: 'block' }}>
              다른 검색어를 시도해보세요.
            </span>
          </div>
        ) : (
          <div>
            {/* 테이블 헤더 */}
            {!isMobile && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 1fr 1fr',
                gap: '1rem',
                padding: '0.5rem 1.5rem',
                backgroundColor: '#000',
                borderBottom: '1px solid #374151',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#9CA3AF',
                alignItems: 'center'
              }}>
                <div>이름 / 전화번호</div>
                <div>최근정비날짜</div>
                <div>정비횟수</div>
                <div>총금액</div>
              </div>
            )}

            <div style={{
              display: 'grid',
              gap: '0'
            }}>
              {paginatedCustomerList.map((customer, index) => {
                // 최근 정비 날짜 계산
                const latestServiceDate = customer.services && customer.services.length > 0
                  ? customer.services
                      .filter(service => service.service_date)
                      .sort((a, b) => new Date(b.service_date) - new Date(a.service_date))[0]?.service_date
                  : null;

                return (
                  <div
                    key={`${customer.customer_name}-${customer.customer_phone}`}
                    onClick={isMobile ? () => {
                      setSelectedCustomerForDetail(customer);
                      setShowDetailModal(true);
                    } : undefined}
                    onDoubleClick={!isMobile ? () => {
                      setSelectedCustomerForDetail(customer);
                      setShowDetailModal(true);
                    } : undefined}
                    style={isMobile ? {
                      backgroundColor: '#111827',
                      borderBottom: index === paginatedCustomerList.length - 1 ? 'none' : '1px solid #374151',
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    } : {
                      backgroundColor: '#111827',
                      borderBottom: index === paginatedCustomerList.length - 1 ? 'none' : '1px solid #374151',
                      padding: '0.5rem 1.5rem',
                      display: 'grid',
                      gridTemplateColumns: '2fr 1.5fr 1fr 1fr',
                      gap: '1rem',
                      alignItems: 'center',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F2937'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#111827'}
                  >
                    {isMobile ? (
                      <div>
                        <div style={{
                          color: '#fff',
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          marginBottom: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span>{customer.customer_name}</span>
                          {customer.customer_memo && (
                            <span style={{
                              color: '#F59E0B',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              backgroundColor: '#374151',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}>
                              {customer.customer_memo}
                            </span>
                          )}
                        </div>
                        <div style={{ color: '#9CA3AF', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                          {customer.customer_phone}
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '0.5rem',
                          borderTop: '1px solid #374151'
                        }}>
                          <div>
                            <div style={{ color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                              최근정비
                            </div>
                            <div style={{ color: '#fff', fontWeight: '500', fontSize: '0.85rem' }}>
                              {latestServiceDate
                                ? new Date(latestServiceDate).toLocaleDateString()
                                : '-'
                              }
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                              횟수
                            </div>
                            <div style={{ color: '#3B82F6', fontWeight: '600', fontSize: '1.1rem' }}>
                              {customer.totalServices}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                              총금액
                            </div>
                            <div style={{ color: '#10B981', fontWeight: '600', fontSize: '1.1rem' }}>
                              {customer.totalAmount ? customer.totalAmount.toLocaleString() : '0'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div style={{
                            color: '#fff',
                            fontSize: '1rem',
                            fontWeight: '600',
                            marginBottom: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <span>{customer.customer_name}</span>
                            {customer.customer_memo && (
                              <span style={{
                                color: '#F59E0B',
                                fontSize: '0.65rem',
                                fontWeight: '500',
                                backgroundColor: '#374151',
                                padding: '1px 6px',
                                borderRadius: '3px'
                              }}>
                                {customer.customer_memo}
                              </span>
                            )}
                          </div>
                          <div style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                            {customer.customer_phone}
                          </div>
                        </div>

                        <div>
                          <div style={{ color: '#9CA3AF', fontWeight: '500', fontSize: '0.875rem' }}>
                            {latestServiceDate
                              ? new Date(latestServiceDate).toLocaleDateString()
                              : '-'
                            }
                          </div>
                        </div>

                        <div>
                          <div style={{ color: '#3B82F6', fontWeight: '600', fontSize: '1rem' }}>
                            {customer.totalServices}
                          </div>
                        </div>

                        <div>
                          <div style={{ color: '#10B981', fontWeight: '600', fontSize: '1rem' }}>
                            {customer.totalAmount ? customer.totalAmount.toLocaleString() : '0'}원
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddCustomerForm && (
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
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#1F2937',
            borderRadius: '12px',
            maxWidth: '450px',
            width: '100%',
            maxHeight: '85vh',
            overflow: 'auto',
            border: '1px solid #374151'
          }}>
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
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#fff',
                  margin: 0
                }}>
                  새 고객 등록
                </h2>
                <button
                  onClick={() => setShowAddCustomerForm(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#374151',
                    border: 'none',
                    borderRadius: '50%',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    fontSize: '20px'
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleAddCustomer} style={{ padding: '16px' }}>
              {/* 고객 정보 섹션 - 상세폼에서는 읽기전용으로만 표시 */}
              {showDetailModal && selectedCustomerForDetail ? (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{
                    color: '#E5E7EB',
                    fontSize: '15px',
                    fontWeight: '700',
                    margin: '0 0 0.75rem 0',
                    borderBottom: '1px solid #4A5568',
                    paddingBottom: '8px'
                  }}>고객 정보</h4>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#1A202C',
                    borderRadius: '8px',
                    border: '1px solid #374151'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#9CA3AF', fontSize: '12px' }}>고객명: </span>
                      <span style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>{newCustomerData.name}</span>
                    </div>
                    <div>
                      <span style={{ color: '#9CA3AF', fontSize: '12px' }}>전화번호: </span>
                      <span style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>{newCustomerData.phone}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{
                    color: '#E5E7EB',
                    fontSize: '15px',
                    fontWeight: '700',
                    margin: '0 0 0.75rem 0',
                    borderBottom: '1px solid #4A5568',
                    paddingBottom: '8px'
                  }}>고객 정보</h4>
                  <div style={{
                    display: 'grid',
                    gap: '0.5rem',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
                  }}>
                    <div>
                      <label style={{
                        color: '#E5E7EB',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'block',
                        marginBottom: '4px'
                      }}>고객명</label>
                      <input
                        type="text"
                        value={newCustomerData.name}
                        onChange={(e) => setNewCustomerData({...newCustomerData, name: e.target.value})}
                        required
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: '#2D3748',
                          border: '2px solid #4A5568',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                          transition: 'all 0.2s ease',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                        onBlur={(e) => e.target.style.borderColor = '#4A5568'}
                      />
                    </div>

                    <div>
                      <label style={{
                        color: '#E5E7EB',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'block',
                        marginBottom: '4px'
                      }}>전화번호</label>
                      <input
                        type="text"
                        value={newCustomerData.phone}
                        onChange={(e) => {
                          // 숫자만 추출
                          const numbers = e.target.value.replace(/[^0-9]/g, '');
                          // 자동 하이픈 추가
                          let formatted = numbers;
                          if (numbers.length > 3 && numbers.length <= 7) {
                            formatted = numbers.slice(0, 3) + '-' + numbers.slice(3);
                          } else if (numbers.length > 7) {
                            formatted = numbers.slice(0, 3) + '-' + numbers.slice(3, 7) + '-' + numbers.slice(7, 11);
                          }
                          setNewCustomerData({...newCustomerData, phone: formatted});
                        }}
                        required
                        placeholder="010-1234-5678"
                        maxLength="13"
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: '#2D3748',
                          border: '2px solid #4A5568',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                          transition: 'all 0.2s ease',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                        onBlur={(e) => e.target.style.borderColor = '#4A5568'}
                      />
                    </div>

                    <div>
                      <label style={{
                        color: '#E5E7EB',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'block',
                        marginBottom: '4px'
                      }}>메모</label>
                      <input
                        type="text"
                        value={newCustomerData.customerMemo || ''}
                        onChange={(e) => setNewCustomerData({...newCustomerData, customerMemo: e.target.value})}
                        placeholder="예: 25-26 엠버서더"
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: '#2D3748',
                          border: '2px solid #4A5568',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                          transition: 'all 0.2s ease',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                        onBlur={(e) => e.target.style.borderColor = '#4A5568'}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 서비스 정보 섹션 */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <h4 style={{
                    color: '#E5E7EB',
                    fontSize: '15px',
                    fontWeight: '700',
                    margin: '0',
                    borderBottom: '1px solid #4A5568',
                    paddingBottom: '8px',
                    flex: 1
                  }}>서비스 정보</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const newServices = [...(newCustomerData.services || []), {
                        serviceDescription: '',
                        totalCost: ''
                      }];
                      setNewCustomerData({...newCustomerData, services: newServices});
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#10B981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginLeft: '12px'
                    }}
                  >
                    + 서비스 추가
                  </button>
                </div>

                {/* 서비스 목록 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(newCustomerData.services || []).map((service, index) => (
                      <div
                        key={index}
                        style={{
                          backgroundColor: '#111827',
                          border: '1px solid #4A5568',
                          borderRadius: '8px',
                          padding: '0.75rem'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.75rem'
                        }}>
                          <h5 style={{
                            color: '#E5E7EB',
                            fontSize: '14px',
                            fontWeight: '600',
                            margin: 0
                          }}>#{index + 1}</h5>
                          <button
                            type="button"
                            onClick={() => {
                              const updatedServices = newCustomerData.services.filter((_, i) => i !== index);
                              setNewCustomerData({...newCustomerData, services: updatedServices});
                            }}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#DC2626',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            삭제
                          </button>
                        </div>

                        <div style={{
                          display: 'flex',
                          gap: '0.75rem',
                          alignItems: 'end'
                        }}>
                          <div style={{ flex: '2' }}>
                            <label style={{
                              color: '#E5E7EB',
                              fontSize: '13px',
                              fontWeight: '600',
                              display: 'block',
                              marginBottom: '6px'
                            }}>정비내역</label>
                            <input
                              type="text"
                              value={service.serviceDescription || ''}
                              onChange={(e) => {
                                const updatedServices = [...newCustomerData.services];
                                updatedServices[index] = {...service, serviceDescription: e.target.value};
                                setNewCustomerData({...newCustomerData, services: updatedServices});
                              }}
                              required
                              placeholder="예: fichser 165 -2 s w"
                              style={{
                                width: '100%',
                                padding: '10px',
                                backgroundColor: '#2D3748',
                                border: '2px solid #4A5568',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '13px',
                                boxSizing: 'border-box',
                                transition: 'all 0.2s ease',
                                outline: 'none'
                              }}
                              onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                              onBlur={(e) => e.target.style.borderColor = '#4A5568'}
                            />
                          </div>

                          <div style={{ flex: '1' }}>
                            <label style={{
                              color: '#E5E7EB',
                              fontSize: '13px',
                              fontWeight: '600',
                              display: 'block',
                              marginBottom: '6px'
                            }}>금액</label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="text"
                                value={newCustomerData.paymentStatus === 'ambassador' || newCustomerData.paymentStatus === 'coupon_free' ? '' : (service.totalCost || '')}
                                onChange={(e) => {
                                  if (newCustomerData.paymentStatus !== 'ambassador' && newCustomerData.paymentStatus !== 'coupon_free') {
                                    // 숫자만 추출
                                    const numbers = e.target.value.replace(/[^0-9]/g, '');
                                    const updatedServices = [...newCustomerData.services];
                                    updatedServices[index] = {...service, totalCost: numbers};
                                    setNewCustomerData({...newCustomerData, services: updatedServices});
                                  }
                                }}
                                required={newCustomerData.paymentStatus !== 'ambassador' && newCustomerData.paymentStatus !== 'coupon_free'}
                                disabled={newCustomerData.paymentStatus === 'ambassador' || newCustomerData.paymentStatus === 'coupon_free'}
                                placeholder={newCustomerData.paymentStatus === 'coupon_free' ? '0원' : ''}
                                style={{
                                  width: '100%',
                                  padding: '10px',
                                  backgroundColor: (newCustomerData.paymentStatus === 'ambassador' || newCustomerData.paymentStatus === 'coupon_free') ? '#1F2937' : '#2D3748',
                                  border: '2px solid #4A5568',
                                  borderRadius: '8px',
                                  color: (newCustomerData.paymentStatus === 'ambassador' || newCustomerData.paymentStatus === 'coupon_free') ? '#6B7280' : '#fff',
                                  fontSize: '13px',
                                  boxSizing: 'border-box',
                                  transition: 'all 0.2s ease',
                                  outline: 'none',
                                  cursor: (newCustomerData.paymentStatus === 'ambassador' || newCustomerData.paymentStatus === 'coupon_free') ? 'not-allowed' : 'text'
                                }}
                                onFocus={(e) => (newCustomerData.paymentStatus !== 'ambassador' && newCustomerData.paymentStatus !== 'coupon_free') && (e.target.style.borderColor = '#3B82F6')}
                                onBlur={(e) => e.target.style.borderColor = '#4A5568'}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* 공통 서비스 정보 - 항상 표시 */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  display: 'grid',
                  gap: '0.75rem',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
                }}>
                  <div>
                    <label style={{
                      color: '#E5E7EB',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'block',
                      marginBottom: '6px'
                    }}>날짜</label>
                    <input
                      type="date"
                      value={newCustomerData.serviceDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setNewCustomerData({...newCustomerData, serviceDate: e.target.value})}
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#2D3748',
                        border: '2px solid #4A5568',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#4A5568'}
                    />
                  </div>

                  <div>
                    <label style={{
                      color: '#E5E7EB',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'block',
                      marginBottom: '6px'
                    }}>결제현황</label>
                    <select
                      value={newCustomerData.paymentStatus || ''}
                      onChange={(e) => {
                        const value = e.target.value;

                        // 쿠폰 선택 시 자동으로 금액 적용
                        if (value === 'coupon_free') {
                          // 무료 쿠폰 - 0원 고정
                          const updatedServices = newCustomerData.services.map(service => ({
                            ...service,
                            totalCost: 0
                          }));
                          setNewCustomerData(prev => ({...prev, paymentStatus: value, services: updatedServices}));
                        } else if (value === 'coupon_discount') {
                          // 30% 할인 쿠폰 - 75,000원에서 30% 할인 = 52,500원 고정
                          const updatedServices = newCustomerData.services.map(service => ({
                            ...service,
                            totalCost: 52500
                          }));
                          setNewCustomerData(prev => ({...prev, paymentStatus: value, services: updatedServices}));
                        } else {
                          setNewCustomerData({...newCustomerData, paymentStatus: value});
                        }
                      }}
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#2D3748',
                        border: '2px solid #4A5568',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'5\' viewBox=\'0 0 4 5\'><path fill=\'%23fff\' d=\'M2 0L0 2h4zm0 5L0 3h4z\'/></svg>")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 16px center',
                        backgroundSize: '12px'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#4A5568'}
                    >
                      <option value="">선택하세요</option>
                      <option value="paid">결제완료</option>
                      <option value="unpaid">미결제</option>
                      <option value="coupon_free">1회 쿠폰</option>
                      <option value="coupon_discount">30% 할인 쿠폰</option>
                      <option value="ambassador">엠버서더</option>
                    </select>
                  </div>

                  <div>
                    <label style={{
                      color: '#E5E7EB',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'block',
                      marginBottom: '6px'
                    }}>결제지점</label>
                    <select
                      value={newCustomerData.paymentLocation || ''}
                      onChange={(e) => setNewCustomerData({...newCustomerData, paymentLocation: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#2D3748',
                        border: '2px solid #4A5568',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'5\' viewBox=\'0 0 4 5\'><path fill=\'%23fff\' d=\'M2 0L0 2h4zm0 5L0 3h4z\'/></svg>")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 16px center',
                        backgroundSize: '12px'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#4A5568'}
                    >
                      <option value="">선택하세요</option>
                      <option value="곤지암">곤지암</option>
                      <option value="대관령">대관령</option>
                      <option value="비발디">비발디</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label style={{
                    color: '#E5E7EB',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'block',
                    marginBottom: '6px'
                  }}>비고</label>
                  <textarea
                    value={newCustomerData.notes || ''}
                    onChange={(e) => setNewCustomerData({...newCustomerData, notes: e.target.value})}
                    rows="2"
                    placeholder="추가 메모사항이 있으면 입력하세요"
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#2D3748',
                      border: '2px solid #4A5568',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '13px',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#4A5568'}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '12px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowAddCustomerForm(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#4A5568',
                    color: '#E2E8F0',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#2D3748';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#4A5568';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#10B981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#059669';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#10B981';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 1px 3px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomerForDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: isMobile ? '0' : '20px',
          overflowY: 'auto'
        }}>
          <div style={{
            backgroundColor: '#1F2937',
            borderRadius: isMobile ? '0' : '12px',
            maxWidth: isMobile ? '100%' : '800px',
            width: '100%',
            height: isMobile ? '100vh' : 'auto',
            maxHeight: isMobile ? '100vh' : '90vh',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #374151'
          }}>
            <div style={{
              backgroundColor: '#000',
              borderBottom: '1px solid #374151',
              padding: isMobile ? '16px' : '24px',
              borderTopLeftRadius: isMobile ? '0' : '12px',
              borderTopRightRadius: isMobile ? '0' : '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '1rem' : '0'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  gap: isMobile ? '1rem' : '2rem',
                  flexDirection: isMobile ? 'column' : 'row',
                  width: isMobile ? '100%' : 'auto'
                }}>
                  <div>
                    {isEditingCustomerInfo ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                          type="text"
                          value={editedCustomerInfo.name}
                          onChange={(e) => setEditedCustomerInfo({...editedCustomerInfo, name: e.target.value})}
                          placeholder="고객명"
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#2D3748',
                            border: '2px solid #4A5568',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '16px',
                            fontWeight: 'bold'
                          }}
                        />
                        <input
                          type="text"
                          value={editedCustomerInfo.phone}
                          onChange={(e) => setEditedCustomerInfo({...editedCustomerInfo, phone: e.target.value})}
                          placeholder="전화번호"
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#2D3748',
                            border: '2px solid #4A5568',
                            borderRadius: '6px',
                            color: '#9CA3AF',
                            fontSize: '13px'
                          }}
                        />
                        <input
                          type="text"
                          value={editedCustomerInfo.memo}
                          onChange={(e) => setEditedCustomerInfo({...editedCustomerInfo, memo: e.target.value})}
                          placeholder="메모 (예: 25-26 엠버서더)"
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#2D3748',
                            border: '2px solid #4A5568',
                            borderRadius: '6px',
                            color: '#60A5FA',
                            fontSize: '12px'
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <h2 style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: '#fff',
                          margin: 0
                        }}>
                          {selectedCustomerForDetail.customer_name} 고객 정보
                        </h2>
                        <p style={{
                          color: '#9CA3AF',
                          fontSize: '13px',
                          margin: '4px 0 0 0'
                        }}>
                          {selectedCustomerForDetail.customer_phone}
                        </p>
                        {selectedCustomerForDetail.customer_memo && (
                          <p style={{
                            color: '#60A5FA',
                            fontSize: '12px',
                            margin: '4px 0 0 0',
                            fontWeight: '500'
                          }}>
                            {selectedCustomerForDetail.customer_memo}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '1.5rem',
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: isMobile ? 'space-around' : 'flex-start'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        color: '#3B82F6',
                        fontSize: isMobile ? '1.2rem' : '1rem',
                        fontWeight: 'bold'
                      }}>
                        {selectedCustomerForDetail.totalServices}
                      </div>
                      <div style={{ color: '#9CA3AF', fontSize: isMobile ? '0.7rem' : '0.65rem' }}>
                        총 서비스
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        color: selectedCustomerForDetail.unpaidServices > 0 ? '#DC2626' : '#10B981',
                        fontSize: isMobile ? '1.2rem' : '1rem',
                        fontWeight: 'bold'
                      }}>
                        {selectedCustomerForDetail.unpaidServices}
                      </div>
                      <div style={{ color: '#9CA3AF', fontSize: isMobile ? '0.7rem' : '0.65rem' }}>
                        미결제
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        color: '#10B981',
                        fontSize: isMobile ? '1.2rem' : '1rem',
                        fontWeight: 'bold'
                      }}>
                        {selectedCustomerForDetail.totalAmount.toLocaleString()}
                      </div>
                      <div style={{ color: '#9CA3AF', fontSize: isMobile ? '0.7rem' : '0.65rem' }}>
                        총 금액 (원)
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    width: isMobile ? '100%' : 'auto',
                    flexWrap: 'wrap'
                  }}>
                    {isEditingCustomerInfo ? (
                      <>
                        <button
                          onClick={handleSaveCustomerInfo}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#3B82F6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          💾 저장
                        </button>
                        <button
                          onClick={() => setIsEditingCustomerInfo(false)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#6B7280',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditedCustomerInfo({
                              name: selectedCustomerForDetail.customer_name,
                              phone: selectedCustomerForDetail.customer_phone,
                              memo: selectedCustomerForDetail.customer_memo || ''
                            });
                            setIsEditingCustomerInfo(true);
                          }}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#F59E0B',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          ✏️ 수정
                        </button>
                        <button
                          onClick={() => {
                            // 현재 고객 정보를 폼에 미리 채우기
                            setNewCustomerData({
                              ...newCustomerData,
                              name: selectedCustomerForDetail.customer_name,
                              phone: selectedCustomerForDetail.customer_phone,
                              services: [{
                                serviceDescription: '',
                                totalCost: ''
                              }]
                            });
                            setShowAddCustomerForm(true);
                          }}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#10B981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          ➕ 서비스 등록
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#374151',
                    border: 'none',
                    borderRadius: '50%',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    fontSize: '20px'
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{
              padding: isMobile ? '16px' : '24px',
              flex: 1,
              overflowY: 'auto'
            }}>

              {/* 서비스 목록 */}
              <h3 style={{
                color: '#fff',
                fontSize: isMobile ? '1rem' : '1.125rem',
                fontWeight: '600',
                margin: '0 0 1rem 0'
              }}>
                서비스 이력
              </h3>

              <div style={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {/* 테이블 헤더 - 모바일에서는 숨김 */}
                {!isMobile && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '0.5fr 2.5fr 1fr 1.2fr 0.8fr 1fr 1.3fr',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#000',
                    borderBottom: '1px solid #374151',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#9CA3AF'
                  }}>
                    <div>회차</div>
                    <div>정비내역</div>
                    <div style={{ paddingLeft: '0.5rem' }}>금액</div>
                    <div style={{ paddingLeft: '0.5rem' }}>날짜</div>
                    <div>지점</div>
                    <div>결제현황</div>
                    <div>비고</div>
                  </div>
                )}

                {/* 테이블 바디 */}
                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                  {selectedCustomerForDetail.services
                    .sort((a, b) => new Date(b.service_date) - new Date(a.service_date))
                    .map((service, index) => (
                    <div
                      key={service.id}
                      onClick={isMobile ? () => {
                        setEditingService(service);
                        setShowEditServiceModal(true);
                      } : undefined}
                      onDoubleClick={!isMobile ? () => {
                        setEditingService(service);
                        setShowEditServiceModal(true);
                      } : undefined}
                      style={isMobile ? {
                        padding: '1rem',
                        borderBottom: index === selectedCustomerForDetail.services.length - 1 ? 'none' : '1px solid #374151',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      } : {
                        display: 'grid',
                        gridTemplateColumns: '0.5fr 2.5fr 1fr 1.2fr 0.8fr 1fr 1.3fr',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        borderBottom: index === selectedCustomerForDetail.services.length - 1 ? 'none' : '1px solid #374151',
                        fontSize: '0.75rem',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F2937'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {isMobile ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ color: '#3B82F6', fontWeight: '600', fontSize: '0.9rem' }}>
                              #{selectedCustomerForDetail.services.length - index}
                            </div>
                            <div style={{
                              backgroundColor: service.total_cost === '엠버서더' ? '#8B5CF6' :
                                service.payment_status === 'unpaid' || service.payment_status === '미결제' ? '#DC2626' :
                                service.payment_status === 'coupon_free' ? '#065F46' :
                                service.payment_status === 'coupon_discount' ? '#7C2D12' : '#10B981',
                              color: '#fff',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              {service.total_cost === '엠버서더' ? '엠버서더' :
                                service.payment_status === 'unpaid' || service.payment_status === '미결제' ? '미결제' :
                                service.payment_status === 'coupon_free' ? '1회 쿠폰' :
                                service.payment_status === 'coupon_discount' ? '30% 할인 쿠폰' : '결제완료'}
                            </div>
                          </div>
                          <div style={{ color: '#fff', fontWeight: '500', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                            {service.service_description || '정비 서비스'}
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.5rem',
                            fontSize: '0.8rem',
                            color: '#9CA3AF'
                          }}>
                            <div>
                              <span style={{ color: '#6B7280' }}>금액: </span>
                              <span style={{ color: '#fff', fontWeight: '500' }}>
                                {service.total_cost === '엠버서더' ? '엠버서더' : (
                                  service.total_cost !== null && service.total_cost !== undefined && service.total_cost !== ''
                                    ? `${parseInt(service.total_cost).toLocaleString()}원`
                                    : '-'
                                )}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: '#6B7280' }}>날짜: </span>
                              <span style={{ color: '#fff' }}>
                                {service.service_date ? new Date(service.service_date).toLocaleDateString() : '-'}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: '#6B7280' }}>지점: </span>
                              <span>{service.branch || service.payment_location || '-'}</span>
                            </div>
                            {service.notes && (
                              <div>
                                <span style={{ color: '#6B7280' }}>비고: </span>
                                <span>{service.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ color: '#3B82F6', fontWeight: '600', fontSize: '0.8rem' }}>
                            {selectedCustomerForDetail.services.length - index}
                          </div>

                          <div>
                            <div style={{ color: '#fff', fontWeight: '500', marginBottom: '0.25rem' }}>
                              {service.service_description || '정비 서비스'}
                            </div>
                          </div>

                          <div style={{
                            color: service.total_cost !== null && service.total_cost !== undefined && service.total_cost !== '' ? '#fff' : '#9CA3AF',
                            fontWeight: '500'
                          }}>
                            {service.total_cost === '엠버서더' ? '-' : (
                              service.total_cost !== null && service.total_cost !== undefined && service.total_cost !== ''
                                ? `${parseInt(service.total_cost).toLocaleString()}원`
                                : '-'
                            )}
                          </div>

                          <div style={{ color: '#9CA3AF' }}>
                            {service.service_date ? new Date(service.service_date).toLocaleDateString() : '-'}
                          </div>

                          <div style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                            {service.branch || service.payment_location || '-'}
                          </div>

                          <div>
                            <div style={{
                              backgroundColor: service.total_cost === '엠버서더' ? '#8B5CF6' :
                                service.payment_status === 'unpaid' || service.payment_status === '미결제' ? '#DC2626' :
                                service.payment_status === 'coupon_free' ? '#065F46' :
                                service.payment_status === 'coupon_discount' ? '#7C2D12' : '#10B981',
                              color: '#fff',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: '600',
                              display: 'inline-block'
                            }}>
                              {service.total_cost === '엠버서더' ? '엠버서더' :
                                service.payment_status === 'unpaid' || service.payment_status === '미결제' ? '미결제' :
                                service.payment_status === 'coupon_free' ? '1회 쿠폰' :
                                service.payment_status === 'coupon_discount' ? '30% 할인 쿠폰' : '결제완료'}
                            </div>
                          </div>

                          <div style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>
                            {service.notes || '-'}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Form Modal */}
      <ServiceFormModal
        customer={selectedCustomer}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCustomer(null);
        }}
        onServiceUpdated={handleServiceUpdated}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #374151',
          borderRadius: '12px',
          padding: '1rem 1.5rem',
          marginTop: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>
              전체 <span style={{ color: '#fff', fontWeight: '600' }}>{filteredAllCustomerList.length}</span>건 중{' '}
              <span style={{ color: '#fff', fontWeight: '600' }}>
                {startIndex + 1}
              </span>
              -
              <span style={{ color: '#fff', fontWeight: '600' }}>
                {Math.min(endIndex, filteredAllCustomerList.length)}
              </span>
              건 표시
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #374151',
                  backgroundColor: 'transparent',
                  color: '#9CA3AF',
                  fontSize: '0.875rem',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                처음
              </button>
              <button
                onClick={() => setCurrentPage(prev => prev - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #374151',
                  backgroundColor: 'transparent',
                  color: '#9CA3AF',
                  fontSize: '0.875rem',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                이전
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {[...Array(totalPages)].map((_, idx) => {
                  const page = idx + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid ' + (currentPage === page ? '#fff' : '#374151'),
                          backgroundColor: currentPage === page ? '#fff' : 'transparent',
                          color: currentPage === page ? '#000' : '#9CA3AF',
                          fontSize: '0.875rem',
                          fontWeight: currentPage === page ? '700' : '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} style={{ color: '#6B7280', padding: '0 0.25rem' }}>...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #374151',
                  backgroundColor: 'transparent',
                  color: '#9CA3AF',
                  fontSize: '0.875rem',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                다음
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #374151',
                  backgroundColor: 'transparent',
                  color: '#9CA3AF',
                  fontSize: '0.875rem',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                마지막
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 서비스 수정 모달 */}
      {showEditServiceModal && editingService && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid #374151'
          }}>
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
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#fff',
                  margin: 0
                }}>
                  정비내역 수정
                </h2>
                <button
                  onClick={() => {
                    setShowEditServiceModal(false);
                    setEditingService(null);
                  }}
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#374151',
                    border: 'none',
                    borderRadius: '50%',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    fontSize: '20px'
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateService} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  color: '#E5E7EB',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'block',
                  marginBottom: '6px'
                }}>정비내역</label>
                <input
                  type="text"
                  value={editingService.service_description || ''}
                  onChange={(e) => setEditingService({...editingService, service_description: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2D3748',
                    border: '2px solid #4A5568',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  color: '#E5E7EB',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'block',
                  marginBottom: '6px'
                }}>금액</label>
                <input
                  type="text"
                  value={
                    editingService.total_cost === '엠버서더'
                      ? ''
                      : (editingService.total_cost ? parseInt(editingService.total_cost).toLocaleString() : '')
                  }
                  onChange={(e) => {
                    const numbers = e.target.value.replace(/[^0-9]/g, '');
                    setEditingService({...editingService, total_cost: numbers ? parseInt(numbers) : 0});
                  }}
                  disabled={editingService.payment_status === 'ambassador'}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: editingService.payment_status === 'ambassador' ? '#1A202C' : '#2D3748',
                    border: '2px solid #4A5568',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    opacity: editingService.payment_status === 'ambassador' ? 0.5 : 1
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  color: '#E5E7EB',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'block',
                  marginBottom: '6px'
                }}>날짜</label>
                <input
                  type="date"
                  value={editingService.service_date || ''}
                  onChange={(e) => setEditingService({...editingService, service_date: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2D3748',
                    border: '2px solid #4A5568',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  color: '#E5E7EB',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'block',
                  marginBottom: '6px'
                }}>지점</label>
                <select
                  value={editingService.branch || editingService.payment_location || ''}
                  onChange={(e) => setEditingService({...editingService, branch: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2D3748',
                    border: '2px solid #4A5568',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">선택하세요</option>
                  <option value="곤지암">곤지암</option>
                  <option value="대관령">대관령</option>
                  <option value="비발디">비발디</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  color: '#E5E7EB',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'block',
                  marginBottom: '6px'
                }}>결제현황</label>
                <select
                  value={
                    editingService.payment_status === 'paid' || editingService.payment_status === '결제완료'
                      ? 'paid'
                      : editingService.payment_status === 'ambassador'
                      ? 'ambassador'
                      : 'unpaid'
                  }
                  onChange={(e) => {
                    if (e.target.value === 'ambassador') {
                      setEditingService({...editingService, payment_status: 'ambassador', total_cost: '엠버서더'});
                    } else {
                      setEditingService({...editingService, payment_status: e.target.value});
                    }
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2D3748',
                    border: '2px solid #4A5568',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">선택하세요</option>
                  <option value="paid">결제완료</option>
                  <option value="unpaid">미결제</option>
                  <option value="ambassador">엠버서더</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  color: '#E5E7EB',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'block',
                  marginBottom: '6px'
                }}>비고</label>
                <textarea
                  value={editingService.notes || ''}
                  onChange={(e) => setEditingService({...editingService, notes: e.target.value})}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2D3748',
                    border: '2px solid #4A5568',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}>
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('정말 삭제하시겠습니까?')) {
                      try {
                        await deleteService(editingService.id);
                        setShowEditServiceModal(false);
                        setEditingService(null);

                        // 데이터 새로고침
                        const response = await getServices(1, 10000);
                        const updatedServices = response.data || [];

                        // 현재 상세 팝업의 고객 정보 업데이트
                        if (selectedCustomerForDetail) {
                          const customerKey = `${selectedCustomerForDetail.customer_name}-${selectedCustomerForDetail.customer_phone}`;
                          const updatedGrouped = updatedServices.reduce((acc, service) => {
                            const key = `${service.customer_name}-${service.customer_phone}`;
                            if (!acc[key]) {
                              acc[key] = {
                                customer_name: service.customer_name,
                                customer_phone: service.customer_phone,
                                customer_memo: service.customer_memo || '',
                                services: [],
                                totalServices: 0,
                                unpaidServices: 0,
                                totalAmount: 0
                              };
                            }
                            acc[key].services.push(service);
                            acc[key].totalServices += 1;
                            acc[key].totalAmount += parseInt(service.total_cost) || 0;
                            if (service.payment_status === 'unpaid' || service.payment_status === '미결제') {
                              acc[key].unpaidServices += 1;
                            }
                            if (service.customer_memo) {
                              acc[key].customer_memo = service.customer_memo;
                            }
                            return acc;
                          }, {});

                          const updatedCustomer = updatedGrouped[customerKey];
                          if (updatedCustomer) {
                            setSelectedCustomerForDetail(updatedCustomer);
                          } else {
                            // 모든 서비스가 삭제되면 상세 팝업 닫기
                            setShowDetailModal(false);
                            setSelectedCustomerForDetail(null);
                          }
                        }

                        fetchData();
                      } catch (error) {                        alert('삭제에 실패했습니다.');
                      }
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#DC2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  삭제
                </button>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditServiceModal(false);
                      setEditingService(null);
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#374151',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#3B82F6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    수정
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleCustomerList;