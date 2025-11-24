import React, { useState, useEffect } from 'react';
import { getAllPromoAthleteRecords, createPromoAthlete, updatePromoAthlete, deletePromoAthlete } from '../services/promoAthleteService';

const PromoAthleteList = () => {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState(null);

  const [newAthleteData, setNewAthleteData] = useState({
    name: '',
    phone: '',
    bootSize: '',
    branch: '곤지암',
    athlete_memo: '',
    services: [{
      equipment: '',
      serviceDescription: ''
    }]
  });

  useEffect(() => {
    fetchAthletes();
  }, []);

  const fetchAthletes = async () => {
    try {
      setLoading(true);
      const data = await getAllPromoAthleteRecords();

      // 전화번호를 기준으로 선수의 서비스 이력 그룹화
      const groupedByPhone = (data || []).reduce((acc, record) => {
        const phone = record.phone;
        if (!acc[phone]) {
          acc[phone] = {
            name: record.name,
            phone: record.phone,
            bootSize: record.boot_size,
            branch: record.branch || '곤지암',
            notes: record.notes || '', // 선수 공통메모
            services: []
          };
        }
        // 선수 공통메모는 모든 레코드가 동일하므로 첫 번째 값 사용
        if (!acc[phone].notes && record.notes) {
          acc[phone].notes = record.notes;
        }
        acc[phone].services.push({
          id: record.id,
          serviceDate: record.created_at,
          equipment: record.ski_brand || '', // ski_brand에 장비 정보가 저장됨
          maintenanceHistory: record.athlete_memo,
          notes: record.notes,
          created_at: record.created_at
        });
        return acc;
      }, {});

      // 배열로 변환하고 최근 서비스를 기준으로 정렬
      const athleteList = Object.values(groupedByPhone).map(athlete => {
        // 서비스 이력을 날짜 순으로 정렬 (최근이 먼저)
        athlete.services.sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));
        return {
          ...athlete,
          totalServices: athlete.services.length,
          lastServiceDate: athlete.services[0]?.serviceDate
        };
      });

      setAthletes(athleteList);
    } catch (error) {      setAthletes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAthlete = async (e) => {
    e.preventDefault();
    try {
      // 각 서비스(장비)를 개별 레코드로 등록
      for (const service of newAthleteData.services) {
        if (service.equipment || service.serviceDescription) {
          await createPromoAthlete({
            name: newAthleteData.name,
            phone: newAthleteData.phone,
            bootSize: newAthleteData.bootSize,
            branch: newAthleteData.branch,
            ski_brand: service.equipment, // 장비 정보를 ski_brand에 저장
            athlete_memo: service.serviceDescription,
            notes: newAthleteData.athlete_memo // 선수 공통메모
          });
        }
      }

      // 서비스가 하나도 없으면 기본 정보만 등록
      if (newAthleteData.services.length === 0 || !newAthleteData.services.some(s => s.equipment || s.serviceDescription)) {
        await createPromoAthlete({
          name: newAthleteData.name,
          phone: newAthleteData.phone,
          bootSize: newAthleteData.bootSize,
          branch: newAthleteData.branch,
          notes: newAthleteData.athlete_memo // 선수 공통메모
        });
      }

      setNewAthleteData({
        name: '',
        phone: '',
        bootSize: '',
        branch: '곤지암',
        athlete_memo: '',
        services: [{ equipment: '', serviceDescription: '' }]
      });
      setShowAddForm(false);

      // 데이터 새로고침
      await fetchAthletes();

      // 상세정보 모달이 열려있으면 해당 선수 정보 업데이트
      if (showDetailModal && selectedAthlete) {
        const allData = await getAllPromoAthleteRecords();

        // 같은 전화번호를 가진 모든 서비스 이력 가져오기
        const athleteServices = allData.filter(
          record => record.phone === selectedAthlete.phone
        );

        if (athleteServices.length > 0) {
          const services = athleteServices.map(record => {
            return {
              id: record.id,
              serviceDate: record.created_at,
              equipment: record.ski_brand || '',
              maintenanceHistory: record.athlete_memo,
              notes: record.notes,
              created_at: record.created_at
            };
          });

          services.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          setSelectedAthlete({
            name: athleteServices[0].name,
            phone: athleteServices[0].phone,
            bootSize: athleteServices[0].boot_size,
            notes: athleteServices[0].notes,
            services: services,
            totalServices: services.length,
            lastServiceDate: services[0]?.serviceDate
          });
        }
      }
    } catch (error) {      alert('선수 등록에 실패했습니다.');
    }
  };

  const handleDeleteAthlete = async (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await deletePromoAthlete(id);
        fetchAthletes();
      } catch (error) {
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const handleUpdateAthlete = async (e) => {
    e.preventDefault();
    try {
      if (editingAthlete.isBasicInfoEdit) {
        // 기본 정보 수정: 해당 전화번호의 모든 레코드를 업데이트
        const allData = await getAllPromoAthleteRecords();
        const athleteRecords = allData.filter(record => record.phone === selectedAthlete.phone);

        // 모든 레코드의 선수 공통메모(notes) 업데이트, 각 서비스 작업내용(athlete_memo)은 보존
        for (const record of athleteRecords) {
          await updatePromoAthlete(record.id, {
            name: editingAthlete.name,
            phone: editingAthlete.phone,
            bootSize: editingAthlete.bootSize,
            branch: editingAthlete.branch,
            ski_brand: record.ski_brand, // 기존 장비 정보 보존
            athlete_memo: record.athlete_memo, // 각 서비스의 작업내용 보존
            notes: editingAthlete.notes // 선수 공통메모 업데이트
          });
        }
      } else if (editingAthlete.isServiceEdit) {
        // 서비스 이력 수정: 개별 레코드만 업데이트
        await updatePromoAthlete(editingAthlete.id, {
          name: editingAthlete.name,
          phone: editingAthlete.phone,
          bootSize: editingAthlete.bootSize,
          ski_brand: editingAthlete.equipment,
          athlete_memo: editingAthlete.maintenanceHistory
        });
      } else if (editingAthlete.isAddingService) {
        // 서비스 추가: 새로운 서비스 레코드 생성
        await createPromoAthlete({
          name: editingAthlete.name,
          phone: editingAthlete.phone,
          bootSize: editingAthlete.bootSize,
          branch: editingAthlete.branch || selectedAthlete.branch,
          ski_brand: editingAthlete.equipment,
          athlete_memo: editingAthlete.maintenanceHistory
        });
      }

      setShowEditModal(false);
      setEditingAthlete(null);
      await fetchAthletes();

      // 상세 모달 업데이트
      if (showDetailModal && selectedAthlete) {
        const allData = await getAllPromoAthleteRecords();
        const athleteServices = allData.filter(
          record => record.phone === selectedAthlete.phone
        );

        if (athleteServices.length > 0) {
          const services = athleteServices.map(record => {
            return {
              id: record.id,
              serviceDate: record.created_at,
              equipment: record.ski_brand || '',
              maintenanceHistory: record.athlete_memo,
              notes: record.notes,
              created_at: record.created_at
            };
          });
          services.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          setSelectedAthlete({
            name: athleteServices[0].name,
            phone: athleteServices[0].phone,
            bootSize: athleteServices[0].boot_size,
            notes: athleteServices[0].notes,
            services: services,
            totalServices: services.length,
            lastServiceDate: services[0]?.serviceDate
          });
        }
      }

      alert(editingAthlete.isAddingService ? '서비스가 추가되었습니다' : '수정되었습니다');
    } catch (error) {      alert('작업에 실패했습니다.');
    }
  };

  const filteredAthletes = athletes.filter(athlete => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      athlete.name?.toLowerCase().includes(searchLower) ||
      athlete.phone?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: '#9CA3AF'
      }}>
        선수 목록을 불러오는 중..
      </div>
    );
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
            스키 프로모션 선수 관리
          </h1>
          <p style={{
            color: '#9CA3AF',
            fontSize: '1rem',
            margin: '0'
          }}>
            프로모션 선수 정보 관리
          </p>
        </div>
      </div>

      {/* 검색창 */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="선수명, 전화번호로 검색.."
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
              ×
            </button>
          )}
        </div>
      </div>

      {/* Athletes Grid */}
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #374151',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div style={{
          backgroundColor: '#000',
          padding: '1.5rem',
          borderBottom: '1px solid #374151'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h3 style={{
                color: '#fff',
                fontSize: '1.125rem',
                fontWeight: '600',
                margin: '0'
              }}>
                선수 목록
                {searchTerm && (
                  <span style={{color: '#9CA3AF', fontSize: '0.875rem', marginLeft: '0.5rem'}}>
                    "{searchTerm}" 검색 결과
                  </span>
                )}
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {athletes.length}
                </div>
                <div style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>
                  총 선수 수
                </div>
              </div>
              <button
                onClick={() => setShowAddForm(true)}
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
                ➕ 선수 등록
              </button>
            </div>
          </div>
        </div>

        {athletes.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#9CA3AF'
          }}>
            등록된 선수가 없습니다.
          </div>
        ) : filteredAthletes.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#9CA3AF'
          }}>
            검색 결과가 없습니다.
          </div>
        ) : (
          <div>
            {/* 테이블 헤더 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr',
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
              <div>부츠사이즈</div>
              <div>등록된 장비</div>
            </div>

            <div style={{
              display: 'grid',
              gap: '0'
            }}>
              {filteredAthletes.map((athlete, index) => (
                <div
                  key={athlete.phone}
                  onDoubleClick={() => {
                    setSelectedAthlete(athlete);
                    setShowDetailModal(true);
                  }}
                  style={{
                    backgroundColor: '#111827',
                    borderBottom: index === filteredAthletes.length - 1 ? 'none' : '1px solid #374151',
                    padding: '0.5rem 1.5rem',
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr',
                    gap: '1rem',
                    alignItems: 'center',
                    fontSize: '0.875rem',
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
                      <span>{athlete.name}</span>
                      {athlete.notes && (
                        <span style={{
                          color: '#F59E0B',
                          fontSize: '0.65rem',
                          fontWeight: '500',
                          backgroundColor: '#374151',
                          padding: '1px 6px',
                          borderRadius: '3px'
                        }}>
                          {athlete.notes}
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                      {athlete.phone}
                    </div>
                  </div>

                  <div style={{ color: '#3B82F6', fontWeight: '600' }}>
                    {athlete.bootSize || '-'}
                  </div>

                  <div style={{ color: '#10B981', fontWeight: '600' }}>
                    {athlete.totalServices}회
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Athlete Modal */}
      {showAddForm && (
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
            maxWidth: '500px',
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
                  새 선수 등록
                </h2>
                <button
                  onClick={() => setShowAddForm(false)}
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

            <form onSubmit={handleAddAthlete} style={{ padding: '16px' }}>
              {/* 선수 정보 섹션 */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{
                  color: '#E5E7EB',
                  fontSize: '15px',
                  fontWeight: '700',
                  margin: '0 0 0.75rem 0',
                  borderBottom: '1px solid #4A5568',
                  paddingBottom: '8px'
                }}>선수 정보</h4>
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
                    }}>선수명</label>
                    <input
                      type="text"
                      value={newAthleteData.name}
                      onChange={(e) => setNewAthleteData({...newAthleteData, name: e.target.value})}
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
                      value={newAthleteData.phone}
                      onChange={(e) => {
                        const numbers = e.target.value.replace(/[^0-9]/g, '');
                        let formatted = numbers;
                        if (numbers.length > 3 && numbers.length <= 7) {
                          formatted = numbers.slice(0, 3) + '-' + numbers.slice(3);
                        } else if (numbers.length > 7) {
                          formatted = numbers.slice(0, 3) + '-' + numbers.slice(3, 7) + '-' + numbers.slice(7, 11);
                        }
                        setNewAthleteData({...newAthleteData, phone: formatted});
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
                    }}>부츠사이즈</label>
                    <input
                      type="text"
                      value={newAthleteData.bootSize}
                      onChange={(e) => setNewAthleteData({...newAthleteData, bootSize: e.target.value})}
                      placeholder="예: 265mm"
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
                    }}>관리지점</label>
                    <select
                      value={newAthleteData.branch}
                      onChange={(e) => setNewAthleteData({...newAthleteData, branch: e.target.value})}
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
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#4A5568'}
                    >
                      <option value="곤지암">곤지암</option>
                      <option value="대관령">대관령</option>
                      <option value="비발디">비발디</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{
                      color: '#E5E7EB',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'block',
                      marginBottom: '4px'
                    }}>선수 메모</label>
                    <input
                      type="text"
                      value={newAthleteData.athlete_memo}
                      onChange={(e) => setNewAthleteData({...newAthleteData, athlete_memo: e.target.value})}
                      placeholder="선수에 대한 메모 (예: VIP, 신규 선수 등)"
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
                    margin: 0,
                    borderBottom: '1px solid #4A5568',
                    paddingBottom: '8px',
                    flex: 1
                  }}>서비스 이력</h4>
                  {newAthleteData.services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewAthleteData({
                          ...newAthleteData,
                          services: newAthleteData.services.slice(0, -1)
                        });
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#DC2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        marginLeft: '8px'
                      }}
                    >
                      - 제거
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setNewAthleteData({
                        ...newAthleteData,
                        services: [...newAthleteData.services, { equipment: '', serviceDescription: '' }]
                      });
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#10B981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginLeft: '8px'
                    }}
                  >
                    + 추가
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {newAthleteData.services.map((service, index) => (
                    <div key={index} style={{
                      backgroundColor: '#2D3748',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #4A5568'
                    }}>
                      <label style={{
                        color: '#9CA3AF',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'block',
                        marginBottom: '4px'
                      }}>서비스 항목 {index + 1}</label>

                      <div style={{ marginBottom: '0.5rem' }}>
                        <label style={{
                          color: '#9CA3AF',
                          fontSize: '11px',
                          fontWeight: '600',
                          display: 'block',
                          marginBottom: '4px'
                        }}>장비</label>
                        <input
                          type="text"
                          value={service.equipment}
                          onChange={(e) => {
                            const updatedServices = [...newAthleteData.services];
                            updatedServices[index].equipment = e.target.value;
                            setNewAthleteData({...newAthleteData, services: updatedServices});
                          }}
                          placeholder="장비명을 입력하세요"
                          style={{
                            width: '100%',
                            padding: '8px',
                            backgroundColor: '#1F2937',
                            border: '1px solid #4A5568',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '12px',
                            boxSizing: 'border-box',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                          onBlur={(e) => e.target.style.borderColor = '#4A5568'}
                        />
                      </div>

                      <div style={{ marginBottom: '0.5rem' }}>
                        <label style={{
                          color: '#9CA3AF',
                          fontSize: '11px',
                          fontWeight: '600',
                          display: 'block',
                          marginBottom: '4px'
                        }}>작업내용</label>
                        <textarea
                          value={service.serviceDescription}
                          onChange={(e) => {
                            const updatedServices = [...newAthleteData.services];
                            updatedServices[index].serviceDescription = e.target.value;
                            setNewAthleteData({...newAthleteData, services: updatedServices});
                          }}
                          placeholder="서비스 내용을 입력하세요"
                          rows="2"
                          required
                          style={{
                            width: '100%',
                            padding: '8px',
                            backgroundColor: '#1F2937',
                            border: '1px solid #4A5568',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '12px',
                            boxSizing: 'border-box',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                          onBlur={(e) => e.target.style.borderColor = '#4A5568'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '1rem'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewAthleteData({
                      name: '',
                      phone: '',
                      bootSize: '',
                      services: [{ serviceDescription: '' }]
                    });
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
                    backgroundColor: '#10B981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAthlete && (
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
                <div>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#fff',
                    margin: 0
                  }}>
                    {selectedAthlete.name} 선수 정보
                  </h2>
                  <p style={{
                    color: '#9CA3AF',
                    fontSize: '13px',
                    margin: '4px 0 0 0'
                  }}>
                    {selectedAthlete.phone}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      setEditingAthlete({
                        name: selectedAthlete.name,
                        phone: selectedAthlete.phone,
                        bootSize: selectedAthlete.bootSize,
                        branch: selectedAthlete.branch,
                        equipment: '',
                        maintenanceHistory: '',
                        notes: '',
                        isAddingService: true
                      });
                      setShowEditModal(true);
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
                    ➕ 서비스 추가
                  </button>
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
            </div>

            <div style={{ padding: '24px' }}>
              {/* 선수 기본 정보 */}
              <div style={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    기본 정보
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setEditingAthlete({
                          ...selectedAthlete,
                          notes: selectedAthlete.notes || '',
                          isBasicInfoEdit: true
                        });
                        setShowEditModal(true);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#3B82F6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      수정
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm(`${selectedAthlete.name} 선수의 모든 데이터를 삭제하시겠습니까?`)) {
                          try {
                            // 해당 선수의 모든 서비스 삭제
                            for (const service of selectedAthlete.services) {
                              await deletePromoAthlete(service.id);
                            }

                            await fetchAthletes();
                            setShowDetailModal(false);
                          } catch (error) {
                            alert('삭제에 실패했습니다.');
                          }
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#DC2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '0.25rem' }}>선수명</div>
                    <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '600' }}>
                      {selectedAthlete.name}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '0.25rem' }}>전화번호</div>
                    <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '600' }}>
                      {selectedAthlete.phone}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '0.25rem' }}>부츠사이즈</div>
                    <div style={{ color: '#3B82F6', fontSize: '0.9rem', fontWeight: '600' }}>
                      {selectedAthlete.bootSize || '-'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '0.25rem' }}>관리지점</div>
                    <div style={{ color: '#10B981', fontSize: '0.9rem', fontWeight: '600' }}>
                      {selectedAthlete.branch || '곤지암'}
                    </div>
                  </div>
                  {selectedAthlete.notes && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '0.25rem' }}>선수메모</div>
                      <div style={{
                        color: '#F59E0B',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        backgroundColor: '#374151',
                        padding: '6px 10px',
                        borderRadius: '6px'
                      }}>
                        {selectedAthlete.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 장비 목록 */}
              {selectedAthlete.equipments && selectedAthlete.equipments.length > 0 && (
                <div style={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '600',
                    margin: '0 0 1rem 0'
                  }}>
                    장비 목록 ({selectedAthlete.equipments.length}개)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedAthlete.equipments.map((eq, index) => (
                      <div key={index} style={{
                        backgroundColor: '#1F2937',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #374151'
                      }}>
                        <div style={{
                          color: '#10B981',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          marginBottom: eq.maintenance ? '0.5rem' : 0
                        }}>
                          {eq.category}
                        </div>
                        {eq.maintenance && (
                          <div style={{
                            color: '#E5E7EB',
                            fontSize: '0.875rem',
                            paddingTop: '0.5rem',
                            borderTop: '1px solid #374151'
                          }}>
                            {eq.maintenance}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 서비스 이력 리스트 */}
              <div style={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '1rem'
              }}>
                <h3 style={{
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  margin: '0 0 1rem 0'
                }}>
                  서비스 이력 ({selectedAthlete.totalServices}회)
                </h3>
                {selectedAthlete.services && selectedAthlete.services.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedAthlete.services.map((service, index) => (
                      <div
                        key={service.id}
                        onDoubleClick={() => {
                          setEditingAthlete({
                            ...service,
                            name: selectedAthlete.name,
                            phone: selectedAthlete.phone,
                            bootSize: selectedAthlete.bootSize,
                            isServiceEdit: true
                          });
                          setShowEditModal(true);
                        }}
                        style={{
                          backgroundColor: '#1F2937',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #374151',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1F2937'}
                      >
                        <div style={{
                          color: '#E5E7EB',
                          fontSize: '0.875rem',
                          lineHeight: '1.4',
                          marginBottom: '3px'
                        }}>
                          <strong>장비:</strong> {service.equipment || '-'}
                        </div>
                        <div style={{
                          color: '#E5E7EB',
                          fontSize: '0.875rem',
                          lineHeight: '1.4'
                        }}>
                          <strong>작업내용:</strong> {service.maintenanceHistory || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: '#1F2937',
                    padding: '1rem',
                    borderRadius: '6px',
                    color: '#9CA3AF',
                    fontSize: '0.875rem',
                    textAlign: 'center'
                  }}>
                    서비스 이력이 없습니다.
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingAthlete && (
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
          zIndex: 1100
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
                  {editingAthlete.isBasicInfoEdit ? '기본 정보 수정' : editingAthlete.isServiceEdit ? '서비스 이력 수정' : '서비스 추가'}
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAthlete(null);
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

            <form onSubmit={handleUpdateAthlete} style={{ padding: '24px' }}>
              {editingAthlete.isBasicInfoEdit && (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      color: '#E5E7EB',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'block',
                      marginBottom: '6px'
                    }}>선수명</label>
                    <input
                      type="text"
                      value={editingAthlete.name || ''}
                      onChange={(e) => setEditingAthlete({...editingAthlete, name: e.target.value})}
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
                    }}>전화번호</label>
                    <input
                      type="text"
                      value={editingAthlete.phone || ''}
                      onChange={(e) => {
                        const numbers = e.target.value.replace(/[^0-9]/g, '');
                        let formatted = numbers;
                        if (numbers.length > 3 && numbers.length <= 7) {
                          formatted = numbers.slice(0, 3) + '-' + numbers.slice(3);
                        } else if (numbers.length > 7) {
                          formatted = numbers.slice(0, 3) + '-' + numbers.slice(3, 7) + '-' + numbers.slice(7, 11);
                        }
                        setEditingAthlete({...editingAthlete, phone: formatted});
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
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      color: '#E5E7EB',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'block',
                      marginBottom: '6px'
                    }}>부츠사이즈</label>
                    <input
                      type="text"
                      value={editingAthlete.bootSize || ''}
                      onChange={(e) => setEditingAthlete({...editingAthlete, bootSize: e.target.value})}
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
                    }}>관리지점</label>
                    <select
                      value={editingAthlete.branch || '곤지암'}
                      onChange={(e) => setEditingAthlete({...editingAthlete, branch: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#2D3748',
                        border: '2px solid #4A5568',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        cursor: 'pointer'
                      }}
                    >
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
                    }}>선수메모</label>
                    <textarea
                      value={editingAthlete.notes || ''}
                      onChange={(e) => setEditingAthlete({...editingAthlete, notes: e.target.value})}
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
                      placeholder="선수에 대한 메모를 입력하세요"
                    />
                  </div>
                </>
              )}

              {(editingAthlete.isServiceEdit || editingAthlete.isAddingService) && (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      color: '#E5E7EB',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'block',
                      marginBottom: '6px'
                    }}>장비</label>
                    <input
                      type="text"
                      value={editingAthlete.equipment || ''}
                      onChange={(e) => setEditingAthlete({...editingAthlete, equipment: e.target.value})}
                      placeholder="장비명을 입력하세요"
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
                    }}>작업내용</label>
                    <textarea
                      value={editingAthlete.maintenanceHistory || ''}
                      onChange={(e) => setEditingAthlete({...editingAthlete, maintenanceHistory: e.target.value})}
                      rows="4"
                      required
                      placeholder="서비스 내용을 입력하세요"
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
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </>
              )}

              <div style={{
                display: 'flex',
                justifyContent: editingAthlete.isServiceEdit ? 'space-between' : 'flex-end',
                gap: '0.75rem'
              }}>
                {editingAthlete.isServiceEdit && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm('이 서비스 이력을 삭제하시겠습니까?')) {
                        try {
                          await deletePromoAthlete(editingAthlete.id);
                          await fetchAthletes();

                          // 상세정보 모달 업데이트
                          const allData = await getAllPromoAthleteRecords();
                          const athleteServices = allData.filter(
                            record => record.phone === selectedAthlete.phone
                          );

                          if (athleteServices.length > 0) {
                            const services = athleteServices.map(record => {
                              const equipment = [record.ski_brand, record.ski_model, record.ski_length]
                                .filter(Boolean)
                                .join(' ') || '';

                              return {
                                id: record.id,
                                serviceDate: record.created_at,
                                equipment: equipment,
                                maintenanceHistory: record.athlete_memo,
                                notes: record.notes,
                                created_at: record.created_at
                              };
                            });
                            services.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                            setSelectedAthlete({
                              name: athleteServices[0].name,
                              phone: athleteServices[0].phone,
                              bootSize: athleteServices[0].boot_size,
                              services: services,
                              totalServices: services.length,
                              lastServiceDate: services[0]?.serviceDate
                            });
                          } else {
                            setShowDetailModal(false);
                          }

                          setShowEditModal(false);
                          setEditingAthlete(null);
                        } catch (error) {                          alert('삭제에 실패했습니다.');
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
                )}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingAthlete(null);
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
                      backgroundColor: editingAthlete.isAddingService ? '#10B981' : '#3B82F6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {editingAthlete.isAddingService ? '추가' : '수정'}
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

export default PromoAthleteList;
