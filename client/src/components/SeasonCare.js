import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getSeasonCares, createSeasonCare, updateSeasonCare, deleteSeasonCare } from '../services/seasonCareService';
import { getFullSeasonCares, createFullSeasonCare, updateFullSeasonCare, deleteFullSeasonCare } from '../services/fullSeasonCareService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

// 숫자 입력 필드의 화살표 제거 스타일
const numberInputStyle = `
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
`;

const SeasonCare = ({ userInfo, isFullSeason = false }) => {
  const [seasonCareList, setSeasonCareList] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCustomerEditModal, setShowCustomerEditModal] = useState(false);
  const [customerEditData, setCustomerEditData] = useState(null);
  const [showServiceEditModal, setShowServiceEditModal] = useState(false);
  const [serviceEditData, setServiceEditData] = useState(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_memo: '',
    service_description: '',
    service_date: new Date().toISOString().split('T')[0],
    total_cost: '',
    payment_status: '',
    payment_location: '',
    season_count: '',
    branch: '',
    notes: '',
    items: [{
      equipment_name: ''
    }]
  });

  useEffect(() => {
    loadSeasonCareList();
  }, []);

  // 시즌케어 리스트를 계약별로 그룹화하는 함수
  const groupByContract = (list) => {
    // 전화번호 + contract_number 조합으로 그룹화
    const contractGroups = {};

    list.forEach(item => {
      const phone = item.customer_phone;
      const contractNum = item.contract_number || 1; // contract_number가 없으면 1로 처리
      const key = `${phone}_${contractNum}`; // 전화번호_계약번호 조합 키

      if (!contractGroups[key]) {
        contractGroups[key] = [];
      }
      contractGroups[key].push(item);
    });

    const contracts = [];

    // 각 계약 그룹을 처리
    Object.values(contractGroups).forEach(group => {
      // 날짜 순으로 정렬 (오래된 것부터)
      const sortedGroup = [...group].sort((a, b) =>
        new Date(a.created_at || a.service_date) - new Date(b.created_at || b.service_date)
      );

      // season_count가 있는 첫 번째 항목 찾기, 없으면 첫 번째 항목 사용
      const contractItem = sortedGroup.find(item => item.season_count) || sortedGroup[0];

      if (contractItem) {
        const contract = {
          contractId: contractItem.id,
          customer_name: contractItem.customer_name,
          customer_phone: contractItem.customer_phone,
          customer_memo: contractItem.customer_memo,
          paymentStatus: contractItem.payment_status,
          contractDate: new Date(contractItem.created_at || contractItem.service_date),
          contractNumber: contractItem.contract_number || 1, // 계약번호 추가
          services: sortedGroup, // 전체 서비스 포함
          totalServices: sortedGroup.length,
          unpaidServices: sortedGroup.filter(s => s.payment_status === 'unpaid').length,
          lastServiceDate: sortedGroup[sortedGroup.length - 1].service_date,
          seasonCount: contractItem.season_count || null,
          seasonPrice: contractItem.total_cost || null,
          paymentLocation: contractItem.payment_location || null
        };
        contracts.push(contract);
      }
    });

    // 남은횟수 계산
    contracts.forEach(contract => {
      if (contract.seasonCount) {
        let totalCount = 0;
        if (contract.seasonCount === '5+왁') {
          totalCount = 6; // 5회 + 왁싱 1회
        } else if (contract.seasonCount === '10+1') {
          totalCount = 11; // 10회 + 보너스 1회
        }
        contract.remainingCount = totalCount - contract.totalServices;
        if (contract.remainingCount < 0) contract.remainingCount = 0;
      } else {
        contract.remainingCount = null;
      }
    });

    // 최근 서비스 날짜 순으로 정렬 (최근이 먼저)
    return contracts.sort((a, b) =>
      new Date(b.lastServiceDate) - new Date(a.lastServiceDate)
    );
  };

  const loadSeasonCareList = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = isFullSeason ? await getFullSeasonCares() : await getSeasonCares();
      console.log('=== API 응답 ===', response);
      console.log('=== 응답 길이 ===', response?.length);
      setSeasonCareList(response || []);

      // 그룹화 처리
      const grouped = groupByContract(response || []);
      console.log('=== 그룹화 결과 ===', grouped);
      console.log('=== 그룹화 길이 ===', grouped?.length);
      setCustomerList(grouped);
    } catch (error) {
      console.error('=== 에러 ===', error);
      setError(error.message || `${isFullSeason ? '풀시즌케어' : '시즌케어'} 데이터를 불러오는데 실패했습니다.`);
      setSeasonCareList([]);
      setCustomerList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 중복 제출 방지
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const customerName = formData.customer_name;
      const customerPhone = formData.customer_phone;
      const wasAddingService = isAddingService;

      // 데이터 가공
      let submitData = { ...formData };

      // 서비스 추가 시 날짜 처리
      if (isAddingService) {
        // 날짜가 없으면 오늘 날짜로 설정
        if (!submitData.service_date) {
          submitData.service_date = new Date().toISOString().split('T')[0];
        }
      }

      console.log('=== 시즌케어 등록/수정 ===');
      console.log('isAddingService:', isAddingService);
      console.log('selectedItem:', selectedItem);
      console.log('submitData.contract_number:', submitData.contract_number);

      if (selectedItem) {
        // 수정 모드: 기존처럼 하나의 레코드만 업데이트
        // items 배열을 service_description으로 변환
        if (submitData.items && submitData.items.length > 0) {
          submitData.service_description = submitData.items
            .map(item => item.equipment_name)
            .filter(name => name)
            .join(', ');
        }

        const cleanData = {
          customer_name: submitData.customer_name,
          customer_phone: submitData.customer_phone,
          customer_memo: submitData.customer_memo || null,
          service_date: submitData.service_date,
          service_description: submitData.service_description || null,
          total_cost: submitData.total_cost || null,
          payment_status: submitData.payment_status || 'unpaid',
          branch: userInfo?.isAdmin ? (submitData.branch || userInfo?.branchName) : userInfo?.branchName,
          notes: submitData.notes || null,
          season_count: submitData.season_count || null,
          payment_location: userInfo?.isAdmin ? (submitData.payment_location || userInfo?.branchName) : userInfo?.branchName,
          contract_number: submitData.contract_number || undefined
        };

        console.log('UPDATE 실행');
        console.log('cleanData:', cleanData);
        if (isFullSeason) {
          await updateFullSeasonCare(selectedItem.id, cleanData);
        } else {
          await updateSeasonCare(selectedItem.id, cleanData);
        }
      } else {
        // 신규 등록 모드: 각 정비내역을 개별 레코드로 생성
        console.log('CREATE 실행');

        // items 배열에서 빈 값 제거
        const validItems = (submitData.items || [])
          .map(item => item.equipment_name)
          .filter(name => name && name.trim());

        if (validItems.length === 0) {
          alert('최소 1개의 정비내역을 입력해주세요.');
          setIsSubmitting(false);
          return;
        }

        if (isFullSeason) {
          // 풀시즌케어: contract_number 없이 각 정비내역마다 개별 레코드 생성
          for (const equipmentName of validItems) {
            const cleanData = {
              customer_name: submitData.customer_name,
              customer_phone: submitData.customer_phone,
              customer_memo: submitData.customer_memo || null,
              service_date: submitData.service_date,
              service_description: equipmentName,
              payment_status: submitData.payment_status || 'unpaid',
              payment_location: userInfo?.isAdmin ? (submitData.payment_location || userInfo?.branchName) : userInfo?.branchName,
              notes: submitData.notes || null
            };

            console.log('풀시즌케어 정비내역 생성:', equipmentName, cleanData);
            await createFullSeasonCare(cleanData);
          }
        } else {
          // 시즌케어: 계약 번호 관리
          let contractNumber = submitData.contract_number;

          if (!contractNumber) {
            // "새 시즌케어"로 등록 - 최신 계약 번호 + 1
            const { data: existingContracts } = await supabase
              .from('season_care')
              .select('contract_number')
              .eq('customer_phone', submitData.customer_phone)
              .order('contract_number', { ascending: false })
              .limit(1);

            const latestContractNumber = existingContracts && existingContracts.length > 0
              ? existingContracts[0].contract_number
              : 0;

            contractNumber = latestContractNumber + 1;
            console.log('새 계약 번호:', contractNumber);
          } else {
            // "서비스 추가"로 등록 - 기존 계약의 시즌케어 정보 복사
            console.log('기존 계약에 서비스 추가 - 시즌케어 정보 복사');

            const { data: existingServices } = await supabase
              .from('season_care')
              .select('season_count, total_cost, payment_location')
              .eq('customer_phone', submitData.customer_phone)
              .eq('contract_number', contractNumber)
              .not('season_count', 'is', null)
              .limit(1);

            if (existingServices && existingServices.length > 0) {
              const existingService = existingServices[0];
              submitData.season_count = existingService.season_count;
              submitData.total_cost = existingService.total_cost;
              submitData.payment_location = existingService.payment_location;
              console.log('시즌케어 정보 복사:', submitData.season_count, submitData.total_cost, submitData.payment_location);
            }
          }

          // 각 정비내역마다 개별 레코드 생성
          for (const equipmentName of validItems) {
            const cleanData = {
              customer_name: submitData.customer_name,
              customer_phone: submitData.customer_phone,
              customer_memo: submitData.customer_memo || null,
              service_date: submitData.service_date,
              service_description: equipmentName, // 각 정비내역을 개별로 저장
              total_cost: submitData.total_cost || null,
              payment_status: submitData.payment_status || 'unpaid',
              branch: userInfo?.isAdmin ? (submitData.branch || userInfo?.branchName) : userInfo?.branchName,
              notes: submitData.notes || null,
              season_count: submitData.season_count || null,
              payment_location: userInfo?.isAdmin ? (submitData.payment_location || userInfo?.branchName) : userInfo?.branchName,
              contract_number: contractNumber
            };

            console.log('정비내역 생성:', equipmentName, cleanData);
            await createSeasonCare(cleanData);
          }
        }
      }

      setShowModal(false);
      setSelectedItem(null);
      setIsAddingService(false);
      resetForm();

      // 목록 새로고침
      await loadSeasonCareList();

      // 서비스 추가 모드였다면 상세 팝업을 업데이트된 데이터로 유지
      if (wasAddingService && selectedCustomer) {
        // 약간의 지연 후 최신 데이터 가져오기 (DB 반영 시간 고려)
        setTimeout(async () => {
          try {
            const updatedList = isFullSeason ? await getFullSeasonCares() : await getSeasonCares();
            const contracts = groupByContract(updatedList);

            // 현재 선택된 계약 찾기 (전화번호와 계약번호로 찾기)
            const updatedContract = contracts.find(c =>
              c.customer_phone === selectedCustomer.customer_phone &&
              (!isFullSeason ? c.contractNumber === selectedCustomer.contractNumber : true)
            );

            if (updatedContract) {
              setSelectedCustomer(updatedContract);
              setShowDetailModal(true);
            }
          } catch (error) {
            console.error('상세 정보 업데이트 실패:', error);
          }
        }, 300);
      }
    } catch (error) {      alert('저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      customer_name: item.customer_name || '',
      customer_phone: item.customer_phone || '',
      equipment_type: item.equipment_type || '',
      equipment_brand: item.equipment_brand || '',
      equipment_model: item.equipment_model || '',
      service_type: item.service_type || '',
      service_description: item.service_description || '',
      service_date: item.service_date ? item.service_date.split('T')[0] : '',
      price: item.price || '',
      status: item.status || 'pending',
      notes: item.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        if (isFullSeason) {
          await deleteFullSeasonCare(id);
        } else {
          await deleteSeasonCare(id);
        }
        await loadSeasonCareList();

        // 상세 모달이 열려있으면 해당 계약 정보 업데이트
        if (selectedCustomer && showDetailModal) {
          const updatedList = await getSeasonCares();
          const contracts = groupByContract(updatedList);

          // 현재 선택된 계약 찾기
          const updatedContract = contracts.find(c =>
            c.contractId === selectedCustomer.contractId ||
            c.customer_phone === selectedCustomer.customer_phone
          );

          if (updatedContract) {
            setSelectedCustomer(updatedContract);
          } else {
            // 모든 서비스가 삭제되면 모달 닫기
            setShowDetailModal(false);
            setSelectedCustomer(null);
          }
        }
      } catch (error) {        alert('삭제에 실패했습니다.');
      }
    }
  };

  const handleDeleteCustomer = async (customer) => {
    if (window.confirm(`${customer.customer_name} 고객의 모든 서비스 기록을 삭제하시겠습니까?\n\n총 ${customer.totalServices}개의 서비스가 삭제됩니다.`)) {
      try {
        // 해당 고객의 모든 서비스 삭제
        for (const service of customer.services) {
          if (isFullSeason) {
            await deleteFullSeasonCare(service.id);
          } else {
            await deleteSeasonCare(service.id);
          }
        }
        loadSeasonCareList();
      } catch (error) {        alert('삭제에 실패했습니다.');
      }
    }
  };

  const handleCustomerEdit = async (e) => {
    e.preventDefault();
    try {
      const oldCustomerName = selectedCustomer.customer_name;
      const oldCustomerPhone = selectedCustomer.customer_phone;

      // 해당 고객의 첫 번째 서비스(시즌케어 정보가 있는 것) 찾기
      const firstService = customerEditData.services.find(s => s.season_count);

      if (firstService) {
        // 첫 번째 서비스만 시즌케어 정보 업데이트
        await updateSeasonCare(firstService.id, {
          ...firstService,
          customer_name: customerEditData.customer_name,
          customer_phone: customerEditData.customer_phone,
          customer_memo: customerEditData.customer_memo,
          season_count: customerEditData.seasonCount,
          total_cost: customerEditData.seasonPrice,
          payment_status: customerEditData.paymentStatus,
          payment_location: customerEditData.paymentLocation
        });
      }

      // 나머지 서비스들은 고객 정보만 업데이트
      for (const service of customerEditData.services) {
        if (service.id !== firstService?.id) {
          await updateSeasonCare(service.id, {
            ...service,
            customer_name: customerEditData.customer_name,
            customer_phone: customerEditData.customer_phone,
            customer_memo: customerEditData.customer_memo
          });
        }
      }
      setShowCustomerEditModal(false);
      setCustomerEditData(null);

      // 최신 데이터로 상세 팝업 업데이트
      const updatedList = await getSeasonCares();
      const contracts = groupByContract(updatedList);

      // 현재 선택된 계약 찾기 (contractId 또는 전화번호로 찾기)
      const updatedContract = contracts.find(c =>
        c.contractId === selectedCustomer.contractId ||
        c.customer_phone === selectedCustomer.customer_phone
      );
      if (updatedContract) {
        setSelectedCustomer(updatedContract);
      }

      await loadSeasonCareList();
      alert('고객 정보가 수정되었습니다.');
    } catch (error) {      alert('수정에 실패했습니다.');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_phone: '',
      customer_memo: '',
      service_description: '',
      service_date: new Date().toISOString().split('T')[0],
      total_cost: '',
      payment_status: '',
      payment_location: '',
      season_count: '',
      branch: '',
      notes: '',
      items: [{
        equipment_name: ''
      }]
    });
  };

  const handleNewItem = () => {
    setSelectedItem(null);
    setIsAddingService(false);
    resetForm();
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'in_progress': return '#3B82F6';
      case 'completed': return '#10B981';
      case 'picked_up': return '#6B7280';
      default: return '#9CA3AF';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'in_progress': return '작업중';
      case 'completed': return '완료';
      case 'picked_up': return '픽업완료';
      default: return '알 수 없음';
    }
  };

  // 검색 및 필터링 (고객 기준)
  const filteredCustomerList = customerList.filter(customer => {
    // 완료 필터 적용
    if (showCompletedOnly && customer.remainingCount !== 0) {
      return false;
    }

    // 지점 필터 적용
    if (selectedBranchFilter && customer.paymentLocation !== selectedBranchFilter) {
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

  // 페이지네이션 계산
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredCustomerList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = filteredCustomerList.slice(startIndex, endIndex);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
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
        시즌케어 목록을 불러오는 중...
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="시즌케어 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadSeasonCareList} />;
  }

  return (
    <div style={{ padding: '0' }}>
      <style>{numberInputStyle}</style>
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
            {isFullSeason ? '⛷️ 풀시즌케어 관리' : '⛷️ 시즌케어 관리'}
          </h1>
          <p style={{
            color: '#9CA3AF',
            fontSize: '1rem',
            margin: '0'
          }}>
            스키/보드 장비 시즌케어 서비스 관리
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

      {/* Season Care List */}
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #374151',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div style={{
          backgroundColor: '#000',
          padding: '1rem',
          borderBottom: '1px solid #374151'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <h3 style={{
                color: '#fff',
                fontSize: '1.125rem',
                fontWeight: '600',
                margin: '0'
              }}>
                고객 목록
                {(searchTerm || showCompletedOnly) && (
                  <span style={{color: '#9CA3AF', fontSize: '0.875rem', marginLeft: '0.5rem'}}>
                    {searchTerm && `"${searchTerm}" 검색`}
                    {searchTerm && showCompletedOnly && ' + '}
                    {showCompletedOnly && '완료 필터'}
                    {' 결과'}
                  </span>
                )}
              </h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {customerList.length}
                  </div>
                  <div style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>
                    총 계약 수
                  </div>
                </div>

                {/* 지점별 결제지점 통계 */}
                {(() => {
                  const branchStats = {
                    '곤지암': 0,
                    '대관령': 0,
                    '비발디': 0
                  };

                  customerList.forEach(contract => {
                    const paymentLocation = contract.paymentLocation || '곤지암';
                    if (branchStats.hasOwnProperty(paymentLocation)) {
                      branchStats[paymentLocation]++;
                    }
                  });

                  return (
                    <>
                      <button
                        onClick={() => {
                          setSelectedBranchFilter(selectedBranchFilter === '곤지암' ? null : '곤지암');
                          setCurrentPage(1);
                        }}
                        style={{
                          textAlign: 'center',
                          padding: '4px 12px',
                          backgroundColor: selectedBranchFilter === '곤지암' ? '#10B981' : 'transparent',
                          border: selectedBranchFilter === '곤지암' ? '2px solid #10B981' : '2px solid #374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ color: selectedBranchFilter === '곤지암' ? '#fff' : '#10B981', fontSize: '0.9rem', fontWeight: 'bold' }}>
                          {branchStats['곤지암']}
                        </div>
                        <div style={{ color: selectedBranchFilter === '곤지암' ? '#E5E7EB' : '#9CA3AF', fontSize: '0.65rem' }}>
                          곤지암점
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBranchFilter(selectedBranchFilter === '대관령' ? null : '대관령');
                          setCurrentPage(1);
                        }}
                        style={{
                          textAlign: 'center',
                          padding: '4px 12px',
                          backgroundColor: selectedBranchFilter === '대관령' ? '#3B82F6' : 'transparent',
                          border: selectedBranchFilter === '대관령' ? '2px solid #3B82F6' : '2px solid #374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ color: selectedBranchFilter === '대관령' ? '#fff' : '#3B82F6', fontSize: '0.9rem', fontWeight: 'bold' }}>
                          {branchStats['대관령']}
                        </div>
                        <div style={{ color: selectedBranchFilter === '대관령' ? '#E5E7EB' : '#9CA3AF', fontSize: '0.65rem' }}>
                          대관령점
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBranchFilter(selectedBranchFilter === '비발디' ? null : '비발디');
                          setCurrentPage(1);
                        }}
                        style={{
                          textAlign: 'center',
                          padding: '4px 12px',
                          backgroundColor: selectedBranchFilter === '비발디' ? '#F59E0B' : 'transparent',
                          border: selectedBranchFilter === '비발디' ? '2px solid #F59E0B' : '2px solid #374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ color: selectedBranchFilter === '비발디' ? '#fff' : '#F59E0B', fontSize: '0.9rem', fontWeight: 'bold' }}>
                          {branchStats['비발디']}
                        </div>
                        <div style={{ color: selectedBranchFilter === '비발디' ? '#E5E7EB' : '#9CA3AF', fontSize: '0.65rem' }}>
                          비발디점
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setShowUnpaidOnly(!showUnpaidOnly);
                          setCurrentPage(1);
                        }}
                        style={{
                          textAlign: 'center',
                          padding: '4px 12px',
                          backgroundColor: showUnpaidOnly ? '#DC2626' : 'transparent',
                          border: showUnpaidOnly ? '2px solid #DC2626' : '2px solid #374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ color: showUnpaidOnly ? '#fff' : '#DC2626', fontSize: '0.9rem', fontWeight: 'bold' }}>
                          {customerList.filter(c => c.unpaidServices > 0).length}
                        </div>
                        <div style={{ color: showUnpaidOnly ? '#E5E7EB' : '#9CA3AF', fontSize: '0.65rem' }}>
                          미결제
                        </div>
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button
                onClick={() => setShowCompletedOnly(!showCompletedOnly)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: showCompletedOnly ? '#10B981' : '#374151',
                  color: '#fff',
                  border: '1px solid #4B5563',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                완료
              </button>
              <button
                onClick={handleNewItem}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10B981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ➕ 새 시즌케어
              </button>
            </div>
          </div>
        </div>

        {customerList.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#9CA3AF'
          }}>
            등록된 고객이 없습니다.
          </div>
        ) : currentCustomers.length === 0 ? (
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
            <div style={{
              display: 'grid',
              gridTemplateColumns: isFullSeason ? '2fr 1.2fr' : '2fr 0.6fr 1.2fr 1fr 0.8fr',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#000',
              borderBottom: '1px solid #374151',
              fontSize: '0.7rem',
              fontWeight: '600',
              color: '#9CA3AF'
            }}>
              <div>고객정보</div>
              {!isFullSeason && <div>계약번호</div>}
              <div>최근 정비일</div>
              {!isFullSeason && <div>시즌케어횟수</div>}
              {!isFullSeason && <div>남은횟수</div>}
            </div>

            <div style={{
              display: 'grid',
              gap: '0'
            }}>
              {currentCustomers.map((customer, index) => (
                <div
                  key={`contract-${customer.contractId}`}
                  onDoubleClick={() => {
                    setSelectedCustomer(customer);
                    setShowDetailModal(true);
                  }}
                  style={{
                    backgroundColor: '#111827',
                    borderBottom: index === currentCustomers.length - 1 ? 'none' : '1px solid #374151',
                    padding: '0.5rem 1rem',
                    display: 'grid',
                    gridTemplateColumns: isFullSeason ? '2fr 1.2fr' : '2fr 0.6fr 1.2fr 1fr 0.8fr',
                    gap: '0.5rem',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F2937'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#111827'}
                >
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

                  {!isFullSeason && (
                    <div style={{
                      color: '#10B981',
                      fontWeight: '600',
                      fontSize: '1rem'
                    }}>
                      {customer.contractNumber}
                    </div>
                  )}

                  <div>
                    <div style={{ color: '#9CA3AF', fontWeight: '500', fontSize: '0.875rem' }}>
                      {customer.lastServiceDate
                        ? new Date(customer.lastServiceDate).toLocaleDateString()
                        : '-'
                      }
                    </div>
                  </div>

                  {!isFullSeason && (
                    <div>
                      <div style={{ color: '#3B82F6', fontWeight: '600', fontSize: '0.9rem' }}>
                        {customer.seasonCount || '-'}
                      </div>
                    </div>
                  )}

                  {!isFullSeason && (
                    <div>
                      <div style={{
                        color: customer.remainingCount === 0 ? '#DC2626' : '#10B981',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                      }}>
                        {customer.remainingCount !== null ? (customer.remainingCount === 0 ? '완료' : customer.remainingCount) : '-'}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1.5rem',
            gap: '0.5rem'
          }}>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px',
                backgroundColor: currentPage === 1 ? '#374151' : '#4B5563',
                color: currentPage === 1 ? '#6B7280' : '#fff',
                border: '1px solid #374151',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              이전
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: currentPage === page ? '#3B82F6' : '#374151',
                  color: '#fff',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  minWidth: '40px'
                }}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 12px',
                backgroundColor: currentPage === totalPages ? '#374151' : '#4B5563',
                color: currentPage === totalPages ? '#6B7280' : '#fff',
                border: '1px solid #374151',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              다음
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
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
            maxWidth: '600px',
            width: '100%',
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
                  {selectedItem ? '시즌케어 수정' : '새 시즌케어 등록'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setIsAddingService(false);
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

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              {/* 기본 정보 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{
                  color: '#E5E7EB',
                  fontSize: '15px',
                  fontWeight: '700',
                  margin: '0 0 1rem 0',
                  borderBottom: '1px solid #4A5568',
                  paddingBottom: '8px'
                }}>기본 정보</h4>
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
                    }}>고객명</label>
                    <input
                      type="text"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                      required
                      disabled={isAddingService}
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
                    }}>전화번호</label>
                    <input
                      type="text"
                      value={formData.customer_phone}
                      onChange={(e) => {
                        const numbers = e.target.value.replace(/[^0-9]/g, '');
                        let formatted = numbers;
                        if (numbers.length > 3 && numbers.length <= 7) {
                          formatted = numbers.slice(0, 3) + '-' + numbers.slice(3);
                        } else if (numbers.length > 7) {
                          formatted = numbers.slice(0, 3) + '-' + numbers.slice(3, 7) + '-' + numbers.slice(7, 11);
                        }
                        setFormData({...formData, customer_phone: formatted});
                      }}
                      required
                      disabled={isAddingService}
                      placeholder="010-1234-5678"
                      maxLength="13"
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
                </div>

                {!isAddingService && (
                <div style={{
                  display: 'grid',
                  gap: '0.75rem',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  marginTop: '0.75rem'
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
                      value={formData.service_date}
                      onChange={(e) => setFormData({...formData, service_date: e.target.value})}
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

                  {!isFullSeason && (
                    <div>
                      <label style={{
                        color: '#E5E7EB',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'block',
                        marginBottom: '6px'
                      }}>시즌케어 횟수</label>
                      <select
                        value={formData.season_count || ''}
                        onChange={(e) => {
                          const selectedValue = e.target.value;
                          let price = formData.total_cost;

                          if (selectedValue === '5+왁') {
                            price = '380000';
                          } else if (selectedValue === '10+1') {
                            price = '750000';
                          }

                          setFormData({...formData, season_count: selectedValue, total_cost: price});
                        }}
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
                      >
                        <option value="">선택하세요</option>
                        <option value="5+왁">5+왁</option>
                        <option value="10+1">10+1</option>
                      </select>
                    </div>
                  )}

                  {!isFullSeason && (
                    <div>
                      <label style={{
                        color: '#E5E7EB',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'block',
                        marginBottom: '6px'
                      }}>결제금액</label>
                      <input
                        type="number"
                        value={formData.total_cost}
                        onChange={(e) => setFormData({...formData, total_cost: e.target.value})}
                        placeholder="0"
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
                  )}

                  <div>
                    <label style={{
                      color: '#E5E7EB',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'block',
                      marginBottom: '6px'
                    }}>결제지점</label>
                    {userInfo?.isAdmin ? (
                      <select
                        value={formData.payment_location || userInfo?.branchName || ''}
                        onChange={(e) => setFormData({...formData, payment_location: e.target.value})}
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
                      >
                        <option value="">선택하세요</option>
                        <option value="곤지암">곤지암</option>
                        <option value="대관령">대관령</option>
                        <option value="비발디">비발디</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={userInfo?.branchName || ''}
                        disabled
                        style={{
                          width: '100%',
                          padding: '10px',
                          backgroundColor: '#1F2937',
                          border: '2px solid #374151',
                          borderRadius: '8px',
                          color: '#9CA3AF',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                          cursor: 'not-allowed'
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <label style={{
                      color: '#E5E7EB',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'block',
                      marginBottom: '6px'
                    }}>고객 메모</label>
                    <input
                      type="text"
                      value={formData.customer_memo}
                      onChange={(e) => setFormData({...formData, customer_memo: e.target.value})}
                      placeholder="고객 메모 (선택사항)"
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
                </div>
                )}
              </div>

              {/* 정비내역 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{
                  color: '#E5E7EB',
                  fontSize: '15px',
                  fontWeight: '700',
                  margin: '0 0 1rem 0',
                  borderBottom: '1px solid #4A5568',
                  paddingBottom: '8px'
                }}>정비내역</h4>

                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                  }}>
                    <label style={{
                      color: '#E5E7EB',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>정비내역 (총 {(formData.items || []).length}개)</label>
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = [...(formData.items || []), {
                          equipment_name: ''
                        }];
                        setFormData({...formData, items: newItems});
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#10B981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      + 정비내역 추가
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(formData.items || []).map((item, index) => (
                      <div key={index} style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: '0.5rem',
                        alignItems: 'center',
                        backgroundColor: '#111827',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #374151'
                      }}>
                        <input
                          type="text"
                          value={item.equipment_name}
                          onChange={(e) => {
                            const updatedItems = [...formData.items];
                            updatedItems[index] = {equipment_name: e.target.value};
                            setFormData({...formData, items: updatedItems});
                          }}
                          required
                          placeholder="정비내역 (왁싱, 튜닝 등)"
                          style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: '#2D3748',
                            border: '2px solid #4A5568',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                          onBlur={(e) => e.target.style.borderColor = '#4A5568'}
                        />

                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updatedItems = formData.items.filter((_, i) => i !== index);
                              setFormData({...formData, items: updatedItems});
                            }}
                            style={{
                              padding: '10px 12px',
                              backgroundColor: '#DC2626',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gap: '0.75rem',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  marginTop: '0.75rem'
                }}>
                  {!isAddingService && (
                  <div>
                    <label style={{
                      color: '#E5E7EB',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'block',
                      marginBottom: '6px'
                    }}>결제현황</label>
                    <select
                      value={formData.payment_status || ''}
                      onChange={(e) => setFormData({...formData, payment_status: e.target.value})}
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
                    >
                      <option value="">선택하세요</option>
                      <option value="paid">결제완료</option>
                      <option value="unpaid">미결제</option>
                    </select>
                  </div>
                  )}

                  {isAddingService && (
                  <div>
                    <label style={{
                      color: '#E5E7EB',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'block',
                      marginBottom: '6px'
                    }}>서비스 날짜</label>
                    <input
                      type="date"
                      value={formData.service_date}
                      onChange={(e) => setFormData({...formData, service_date: e.target.value})}
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
                  )}

                  <div>
                    <label style={{
                      color: '#E5E7EB',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'block',
                      marginBottom: '6px'
                    }}>지점</label>
                    {userInfo?.isAdmin ? (
                      <select
                        value={formData.branch || userInfo?.branchName || ''}
                        onChange={(e) => setFormData({...formData, branch: e.target.value})}
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
                      >
                        <option value="">선택하세요</option>
                        <option value="곤지암">곤지암</option>
                        <option value="대관령">대관령</option>
                        <option value="비발디">비발디</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={userInfo?.branchName || ''}
                        disabled
                        style={{
                          width: '100%',
                          padding: '10px',
                          backgroundColor: '#1F2937',
                          border: '2px solid #4A5568',
                          borderRadius: '8px',
                          color: '#9CA3AF',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                          cursor: 'not-allowed'
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* 추가 정보 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{
                  color: '#E5E7EB',
                  fontSize: '15px',
                  fontWeight: '700',
                  margin: '0 0 1rem 0',
                  borderBottom: '1px solid #4A5568',
                  paddingBottom: '8px'
                }}>추가 정보</h4>
                <div>
                  <label style={{
                    color: '#E5E7EB',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'block',
                    marginBottom: '6px'
                  }}>메모</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="3"
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
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#4A5568'}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '24px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#374151',
                    color: '#9CA3AF',
                    border: '1px solid #4B5563',
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
                  disabled={isSubmitting}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: isSubmitting ? '#6B7280' : '#10B981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.6 : 1
                  }}
                >
                  {isSubmitting ? '처리중...' : (selectedItem ? '수정' : '등록')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomer && (
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
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#1F2937',
            borderRadius: '12px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid #374151'
          }}>
            <div style={{
              backgroundColor: '#000',
              borderBottom: '1px solid #374151',
              padding: '24px',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div style={{ flex: 1 }}>
                <h2 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#fff',
                  margin: 0
                }}>
                  {selectedCustomer.customer_name} 고객 정보
                </h2>
                <p style={{
                  color: '#9CA3AF',
                  fontSize: '13px',
                  margin: '4px 0 0 0'
                }}>
                  {selectedCustomer.customer_phone}
                </p>
                {selectedCustomer.customer_memo && (
                  <p style={{
                    color: '#60A5FA',
                    fontSize: '12px',
                    margin: '4px 0 0 0',
                    fontWeight: '500'
                  }}>
                    {selectedCustomer.customer_memo}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    color: '#3B82F6',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}>
                    {selectedCustomer.totalServices}
                  </div>
                  <div style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>
                    총 서비스
                  </div>
                </div>
                {!isFullSeason && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      color: selectedCustomer.seasonCount ? '#10B981' : '#9CA3AF',
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}>
                      {selectedCustomer.seasonCount || '-'}
                    </div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>
                      시즌케어횟수
                    </div>
                  </div>
                )}
                {!isFullSeason && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      color: selectedCustomer.remainingCount === 0 ? '#DC2626' : (selectedCustomer.remainingCount !== null ? '#F59E0B' : '#9CA3AF'),
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}>
                      {selectedCustomer.remainingCount !== null ? (selectedCustomer.remainingCount === 0 ? '완료' : selectedCustomer.remainingCount) : '-'}
                    </div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>
                      남은횟수
                    </div>
                  </div>
                )}
                {!isFullSeason && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      color: selectedCustomer.seasonPrice ? '#10B981' : '#9CA3AF',
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}>
                      {selectedCustomer.seasonPrice ? `${parseInt(selectedCustomer.seasonPrice).toLocaleString()}원` : '-'}
                    </div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>
                      결제금액
                    </div>
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    color: selectedCustomer.paymentStatus === 'paid' ? '#10B981' : selectedCustomer.paymentStatus === 'unpaid' ? '#DC2626' : '#9CA3AF',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}>
                    {selectedCustomer.paymentStatus === 'paid' ? '결제완료' : selectedCustomer.paymentStatus === 'unpaid' ? '미결제' : '-'}
                  </div>
                  <div style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>
                    결제현황
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    color: selectedCustomer.paymentLocation ? '#3B82F6' : '#9CA3AF',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}>
                    {selectedCustomer.paymentLocation || '-'}
                  </div>
                  <div style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>
                    결제지점
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                <button
                  onClick={() => {
                    setCustomerEditData(selectedCustomer);
                    setShowCustomerEditModal(true);
                  }}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#10B981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  수정
                </button>
                {userInfo?.isAdmin && (
                  <button
                    onClick={() => {
                      if (window.confirm(`${selectedCustomer.customer_name} 고객의 모든 서비스 기록을 삭제하시겠습니까?\n\n총 ${selectedCustomer.totalServices}개의 서비스가 삭제됩니다.`)) {
                        handleDeleteCustomer(selectedCustomer);
                        setShowDetailModal(false);
                      }
                    }}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#DC2626',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    삭제
                  </button>
                )}
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
                  fontSize: '20px',
                  marginLeft: '1rem'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 style={{
                  color: '#fff',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  margin: 0
                }}>
                  서비스 이력
                </h3>
                {selectedCustomer.remainingCount !== 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('서비스 추가 버튼 클릭');
                      console.log('selectedCustomer:', selectedCustomer);
                      resetForm();
                      setSelectedItem(null); // 기존 선택 항목 초기화

                      // 기존 계약의 지점 정보 가져오기
                      const existingBranch = selectedCustomer.services?.[0]?.branch || '';

                      setFormData({
                        customer_name: selectedCustomer.customer_name,
                        customer_phone: selectedCustomer.customer_phone,
                        customer_memo: selectedCustomer.customer_memo || '',
                        contract_number: selectedCustomer.contractNumber, // 기존 계약 번호 포함
                        equipment_type: '',
                        equipment_brand: '',
                        equipment_model: '',
                        service_type: '',
                        service_description: '',
                        service_date: new Date().toISOString().split('T')[0],
                        price: '',
                        status: 'pending',
                        notes: '',
                        payment_status: 'paid',
                        payment_location: selectedCustomer.paymentLocation || '',
                        total_cost: '',
                        branch: existingBranch, // 기존 계약의 지점으로 설정
                        total_count: '',
                        items: [{ equipment_name: '', count: '' }]
                      });
                      console.log('isAddingService를 true로 설정');
                      setIsAddingService(true);
                      console.log('showModal을 true로 설정');
                      setShowModal(true);
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3B82F6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    + 서비스 추가
                  </button>
                )}
              </div>

              <div style={{
                backgroundColor: '#111827',
                borderRadius: '8px',
                border: '1px solid #374151',
                overflow: 'hidden'
              }}>
                {/* 테이블 헤더 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '0.5fr 2.5fr 1.2fr 0.8fr 1.5fr',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#000',
                  borderBottom: '1px solid #374151',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  color: '#9CA3AF'
                }}>
                  <div style={{ paddingLeft: '0.5rem' }}>No</div>
                  <div>정비내역</div>
                  <div>날짜</div>
                  <div>지점</div>
                  <div>메모</div>
                </div>

                {/* 테이블 바디 */}
                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                  {selectedCustomer.services
                    .sort((a, b) => new Date(b.service_date) - new Date(a.service_date))
                    .map((service, index) => (
                    <div
                      key={service.id}
                      onDoubleClick={() => {
                        setServiceEditData(service);
                        setShowServiceEditModal(true);
                      }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '0.5fr 2.5fr 1.2fr 0.8fr 1.5fr',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        borderBottom: index === selectedCustomer.services.length - 1 ? 'none' : '1px solid #374151',
                        fontSize: '0.75rem',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F2937'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{
                        color: '#9CA3AF',
                        fontSize: '0.75rem',
                        paddingLeft: '0.5rem'
                      }}>
                        {selectedCustomer.services.length - index}
                      </div>

                      <div style={{ color: '#E5E7EB', fontSize: '0.8rem' }}>
                        {service.service_description || '-'}
                      </div>

                      <div style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                        {service.service_date ? new Date(service.service_date).toLocaleDateString() : '-'}
                      </div>

                      <div style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                        {service.payment_location || service.branch || '-'}
                      </div>

                      <div style={{
                        color: '#9CA3AF',
                        fontSize: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {service.notes || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Edit Modal - 고객정보 수정 (이름, 전화번호) */}
      {showCustomerEditModal && customerEditData && (
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
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#1F2937',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
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
                  고객정보 수정
                </h2>
                <button
                  onClick={() => {
                    setShowCustomerEditModal(false);
                    setCustomerEditData(null);
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

            <form onSubmit={handleCustomerEdit} style={{ padding: '24px' }}>
              <div style={{
                display: 'grid',
                gap: '1rem',
                gridTemplateColumns: '1fr'
              }}>
                <div>
                  <label style={{
                    color: '#E5E7EB',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'block',
                    marginBottom: '6px'
                  }}>고객명</label>
                  <input
                    type="text"
                    value={customerEditData.customer_name || ''}
                    onChange={(e) => setCustomerEditData({...customerEditData, customer_name: e.target.value})}
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

                <div>
                  <label style={{
                    color: '#E5E7EB',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'block',
                    marginBottom: '6px'
                  }}>전화번호</label>
                  <input
                    type="text"
                    value={customerEditData.customer_phone || ''}
                    onChange={(e) => {
                      const numbers = e.target.value.replace(/[^0-9]/g, '');
                      let formatted = numbers;
                      if (numbers.length > 3 && numbers.length <= 7) {
                        formatted = numbers.slice(0, 3) + '-' + numbers.slice(3);
                      } else if (numbers.length > 7) {
                        formatted = numbers.slice(0, 3) + '-' + numbers.slice(3, 7) + '-' + numbers.slice(7, 11);
                      }
                      setCustomerEditData({...customerEditData, customer_phone: formatted});
                    }}
                    required
                    placeholder="010-1234-5678"
                    maxLength="13"
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

                <div>
                  <label style={{
                    color: '#E5E7EB',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'block',
                    marginBottom: '6px'
                  }}>고객 메모</label>
                  <input
                    type="text"
                    value={customerEditData.customer_memo || ''}
                    onChange={(e) => setCustomerEditData({...customerEditData, customer_memo: e.target.value})}
                    placeholder="고객 메모 (선택사항)"
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

                <div>
                  <label style={{
                    color: '#E5E7EB',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'block',
                    marginBottom: '6px'
                  }}>시즌케어 횟수</label>
                  <select
                    value={customerEditData.seasonCount || ''}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      let price = customerEditData.seasonPrice;
                      if (selectedValue === '5+왁') {
                        price = '375000';
                      } else if (selectedValue === '10+1') {
                        price = '750000';
                      }
                      setCustomerEditData({...customerEditData, seasonCount: selectedValue, seasonPrice: price});
                    }}
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
                    <option value="5+왁">5+왁</option>
                    <option value="10+1">10+1</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    color: '#E5E7EB',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'block',
                    marginBottom: '6px'
                  }}>결제금액</label>
                  <input
                    type="number"
                    value={customerEditData.seasonPrice || ''}
                    onChange={(e) => setCustomerEditData({...customerEditData, seasonPrice: e.target.value})}
                    placeholder="금액 입력"
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

                <div>
                  <label style={{
                    color: '#E5E7EB',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'block',
                    marginBottom: '6px'
                  }}>결제현황</label>
                  <select
                    value={customerEditData.paymentStatus || ''}
                    onChange={(e) => {
                      setCustomerEditData({
                        ...customerEditData,
                        paymentStatus: e.target.value
                      });
                    }}
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
                    value={customerEditData.paymentLocation || ''}
                    onChange={(e) => {
                      setCustomerEditData({
                        ...customerEditData,
                        paymentLocation: e.target.value
                      });
                    }}
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
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '24px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomerEditModal(false);
                    setCustomerEditData(null);
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#374151',
                    color: '#9CA3AF',
                    border: '1px solid #4B5563',
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
                    padding: '12px 24px',
                    backgroundColor: '#10B981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Edit Modal - 서비스 이력 수정 (날짜, 정비내역, 메모) */}
      {showServiceEditModal && serviceEditData && (
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
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#1F2937',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
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
                  서비스 이력 수정
                </h2>
                <button
                  onClick={() => setShowServiceEditModal(false)}
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

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {                const updated = await updateSeasonCare(serviceEditData.id, serviceEditData);                setShowServiceEditModal(false);
                setServiceEditData(null);

                // 최신 데이터로 상세 팝업 업데이트
                const updatedList = await getSeasonCares();
                const contracts = groupByContract(updatedList);

                // 현재 선택된 계약 찾기
                const updatedContract = contracts.find(c => c.contractId === selectedCustomer.contractId);
                if (updatedContract) {
                  setSelectedCustomer(updatedContract);
                }

                await loadSeasonCareList();
              } catch (error) {                alert('수정에 실패했습니다. 오류: ' + (error.message || error));
              }
            }} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  color: '#E5E7EB',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'block',
                  marginBottom: '6px'
                }}>날짜</label>
                <input
                  type="date"
                  value={serviceEditData.service_date ? serviceEditData.service_date.split('T')[0] : ''}
                  onChange={(e) => setServiceEditData({...serviceEditData, service_date: e.target.value})}
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

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  color: '#E5E7EB',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'block',
                  marginBottom: '6px'
                }}>정비내역</label>
                <textarea
                  value={serviceEditData.service_description || ''}
                  onChange={(e) => setServiceEditData({...serviceEditData, service_description: e.target.value})}
                  placeholder="정비내역 입력 (예: 로시뇽 170 풀튜닝)"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2D3748',
                    border: '2px solid #4A5568',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13px',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  color: '#E5E7EB',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'block',
                  marginBottom: '6px'
                }}>메모</label>
                <textarea
                  value={serviceEditData.notes || ''}
                  onChange={(e) => setServiceEditData({...serviceEditData, notes: e.target.value})}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2D3748',
                    border: '2px solid #4A5568',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13px',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
                marginTop: '24px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    // 현재 계약의 서비스 개수 확인
                    const contractServicesCount = selectedCustomer.services.length;

                    if (contractServicesCount <= 1) {
                      alert('계약에 최소 1개의 서비스 이력이 필요합니다.\n전체 계약을 삭제하려면 상세폼의 "삭제" 버튼을 사용하세요.');
                      return;
                    }

                    if (window.confirm('이 서비스 이력을 삭제하시겠습니까?')) {
                      handleDelete(serviceEditData.id);
                      setShowServiceEditModal(false);
                      setServiceEditData(null);
                    }
                  }}
                  style={{
                    padding: '12px 24px',
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
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowServiceEditModal(false);
                      setServiceEditData(null);
                    }}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#374151',
                      color: '#9CA3AF',
                      border: '1px solid #4B5563',
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
                      padding: '12px 24px',
                      backgroundColor: '#10B981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    저장
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

export default SeasonCare;