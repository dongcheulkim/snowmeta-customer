import React, { useState, useEffect } from 'react';
import { getCoupons, createCoupon, issueCoupon, useCoupon, updateCoupon, deleteCoupon } from '../services/couponService';

const CouponManagement = ({ userInfo }) => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnusedOnly, setShowUnusedOnly] = useState(false);
  const [couponTypeFilter, setCouponTypeFilter] = useState('all'); // 'all', 'free', 'discount'
  const [statusFilter, setStatusFilter] = useState(null); // null, 'unissued', 'issued', 'used'
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [showUseCouponModal, setShowUseCouponModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [newCouponNumber, setNewCouponNumber] = useState('');
  const [newCouponType, setNewCouponType] = useState('free'); // 'free' or 'discount'
  const [useCouponData, setUseCouponData] = useState({
    customer_name: '',
    customer_phone: '',
    service_description: '',
    service_date: new Date().toISOString().split('T')[0],
    total_cost: '',
    payment_status: 'paid',
    notes: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const data = await getCoupons();
      setCoupons(data || []);
    } catch (error) {
      console.error('쿠폰 로드 실패:', error);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    if (!newCouponNumber.trim()) {
      alert('쿠폰 번호를 입력하세요');
      return;
    }

    try {
      await createCoupon({
        coupon_number: newCouponNumber.trim(),
        coupon_type: newCouponType
      });
      setNewCouponNumber('');
      setNewCouponType('free');
      setShowAddCouponModal(false);
      fetchCoupons();
      alert('쿠폰이 등록되었습니다');
    } catch (error) {
      alert('쿠폰 등록 실패: ' + error.message);
    }
  };

  const handleUseCoupon = async (e) => {
    e.preventDefault();
    if (!selectedCoupon) return;

    try {
      await useCoupon(selectedCoupon.id, {
        ...useCouponData,
        branch: userInfo?.branchName || '관리자'
      });
      setShowUseCouponModal(false);
      setSelectedCoupon(null);
      setUseCouponData({
        customer_name: '',
        customer_phone: '',
        service_description: '',
        service_date: new Date().toISOString().split('T')[0],
        total_cost: '',
        payment_status: 'paid',
        notes: ''
      });
      fetchCoupons();
      alert('쿠폰이 사용 처리되었습니다');
    } catch (error) {
      alert('쿠폰 사용 실패: ' + error.message);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await deleteCoupon(id);
      fetchCoupons();
    } catch (error) {
      alert('삭제 실패: ' + error.message);
    }
  };

  // 필터링
  const filteredCoupons = coupons.filter(coupon => {
    if (showUnusedOnly && coupon.status !== 'unused') return false;
    if (couponTypeFilter !== 'all' && coupon.coupon_type !== couponTypeFilter) return false;

    // 상태 필터 적용
    if (statusFilter === 'unissued' && (coupon.status !== 'unused' || coupon.issued_to_customer)) return false;
    if (statusFilter === 'issued' && (coupon.status !== 'unused' || !coupon.issued_to_customer)) return false;
    if (statusFilter === 'used' && coupon.status !== 'used') return false;

    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      coupon.coupon_number.toLowerCase().includes(searchLower) ||
      (coupon.customer_name && coupon.customer_name.toLowerCase().includes(searchLower)) ||
      (coupon.customer_phone && coupon.customer_phone.toLowerCase().includes(searchLower))
    );
  });

  const freeCouponsCount = coupons.filter(c => c.coupon_type === 'free').length;
  const discountCouponsCount = coupons.filter(c => c.coupon_type === 'discount').length;
  const unissuedCount = coupons.filter(c => c.status === 'unused' && !c.issued_to_customer).length;
  const issuedCount = coupons.filter(c => c.status === 'unused' && c.issued_to_customer).length;
  const usedCount = coupons.filter(c => c.status === 'used').length;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: '#9CA3AF'
      }}>
        로딩 중...
      </div>
    );
  }

  return (
    <div style={{ padding: '0', width: '100%', maxWidth: 'none', overflow: 'visible' }}>
      {/* Header */}
      <div style={{
        marginBottom: '2rem',
        width: '100%'
      }}>
        <h1 style={{
          color: '#fff',
          fontSize: '2rem',
          fontWeight: 'bold',
          margin: '0 0 0.5rem'
        }}>
          정비 쿠폰
        </h1>
        <p style={{
          color: '#9CA3AF',
          fontSize: '1rem',
          margin: '0'
        }}>
          SnowMeta 고객별 정비 쿠폰 관리
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <div
          onClick={() => {
            setStatusFilter(null);
            setCouponTypeFilter('all');
          }}
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
          <h3 style={{
            color: '#9CA3AF',
            fontSize: '0.75rem',
            fontWeight: '500',
            margin: '0'
          }}>
            전체
          </h3>
          <p style={{
            color: '#3B82F6',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            margin: '0'
          }}>
            {coupons.length}
          </p>
        </div>

        <div
          onClick={() => {
            setCouponTypeFilter(couponTypeFilter === 'free' ? 'all' : 'free');
            setStatusFilter(null);
          }}
          style={{
            backgroundColor: couponTypeFilter === 'free' ? '#065F46' : '#1F2937',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: couponTypeFilter === 'free' ? '1px solid #10B981' : '1px solid #374151',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer'
          }}
        >
          <h3 style={{
            color: couponTypeFilter === 'free' ? '#6EE7B7' : '#9CA3AF',
            fontSize: '0.75rem',
            fontWeight: '500',
            margin: '0'
          }}>
            무료 1회
          </h3>
          <p style={{
            color: couponTypeFilter === 'free' ? '#6EE7B7' : '#fff',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            margin: '0'
          }}>
            {freeCouponsCount}
          </p>
        </div>

        <div
          onClick={() => {
            setCouponTypeFilter(couponTypeFilter === 'discount' ? 'all' : 'discount');
            setStatusFilter(null);
          }}
          style={{
            backgroundColor: couponTypeFilter === 'discount' ? '#7C2D12' : '#1F2937',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: couponTypeFilter === 'discount' ? '1px solid #DC2626' : '1px solid #374151',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer'
          }}
        >
          <h3 style={{
            color: couponTypeFilter === 'discount' ? '#FCA5A5' : '#9CA3AF',
            fontSize: '0.75rem',
            fontWeight: '500',
            margin: '0'
          }}>
            30% 할인
          </h3>
          <p style={{
            color: couponTypeFilter === 'discount' ? '#FCA5A5' : '#fff',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            margin: '0'
          }}>
            {discountCouponsCount}
          </p>
        </div>

        <button
          onClick={() => setStatusFilter(statusFilter === 'unissued' ? null : 'unissued')}
          style={{
            backgroundColor: statusFilter === 'unissued' ? '#FBBF24' : '#1F2937',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: statusFilter === 'unissued' ? '2px solid #FBBF24' : '2px solid #374151',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <h3 style={{
            color: statusFilter === 'unissued' ? '#fff' : '#9CA3AF',
            fontSize: '0.75rem',
            fontWeight: '500',
            margin: '0'
          }}>
            미지급
          </h3>
          <p style={{
            color: statusFilter === 'unissued' ? '#fff' : '#FBBF24',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            margin: '0'
          }}>
            {unissuedCount}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'issued' ? null : 'issued')}
          style={{
            backgroundColor: statusFilter === 'issued' ? '#10B981' : '#1F2937',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: statusFilter === 'issued' ? '2px solid #10B981' : '2px solid #374151',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <h3 style={{
            color: statusFilter === 'issued' ? '#fff' : '#9CA3AF',
            fontSize: '0.75rem',
            fontWeight: '500',
            margin: '0'
          }}>
            지급완료
          </h3>
          <p style={{
            color: statusFilter === 'issued' ? '#fff' : '#10B981',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            margin: '0'
          }}>
            {issuedCount}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'used' ? null : 'used')}
          style={{
            backgroundColor: statusFilter === 'used' ? '#DC2626' : '#1F2937',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: statusFilter === 'used' ? '2px solid #DC2626' : '2px solid #374151',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <h3 style={{
            color: statusFilter === 'used' ? '#fff' : '#9CA3AF',
            fontSize: '0.75rem',
            fontWeight: '500',
            margin: '0'
          }}>
            사용완료
          </h3>
          <p style={{
            color: statusFilter === 'used' ? '#fff' : '#DC2626',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            margin: '0'
          }}>
            {usedCount}
          </p>
        </button>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="쿠폰번호, 고객명, 전화번호로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '300px',
            padding: '12px 16px',
            backgroundColor: '#374151',
            border: '1px solid #4B5563',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px'
          }}
        />

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setCouponTypeFilter('all');
              setStatusFilter(null);
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: couponTypeFilter === 'all' ? '#3B82F6' : '#374151',
              color: '#fff',
              border: '1px solid #4B5563',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            전체
          </button>

          <button
            onClick={() => setShowUnusedOnly(!showUnusedOnly)}
            style={{
              padding: '12px 24px',
              backgroundColor: showUnusedOnly ? '#DC2626' : '#374151',
              color: '#fff',
              border: '1px solid #4B5563',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            미사용
          </button>

          {userInfo?.isAdmin && (
            <button
              onClick={() => setShowAddCouponModal(true)}
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
              ➕ 쿠폰 등록
            </button>
          )}
        </div>
      </div>

      {/* Coupon List */}
      <div style={{
        backgroundColor: '#1F2937',
        borderRadius: '12px',
        border: '1px solid #374151',
        overflowX: 'auto',
        width: '100%'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '70px 110px 180px 120px 130px 110px 100px 110px 180px',
          gap: '0.75rem',
          padding: '1rem',
          backgroundColor: '#111827',
          borderBottom: '1px solid #374151',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#9CA3AF',
          minWidth: '1200px'
        }}>
          <div>상태</div>
          <div>타입</div>
          <div>쿠폰번호</div>
          <div>고객명</div>
          <div>전화번호</div>
          <div>사용일</div>
          <div>지점</div>
          <div>상태</div>
          <div style={{ textAlign: 'center' }}>작업</div>
        </div>

        {/* Table Body */}
        {filteredCoupons.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#9CA3AF'
          }}>
            {searchTerm || showUnusedOnly ? '검색 결과가 없습니다.' : '등록된 쿠폰이 없습니다.'}
          </div>
        ) : (
          <div style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
            {filteredCoupons.map((coupon) => (
              <div
                key={coupon.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '70px 110px 180px 120px 130px 110px 100px 110px 180px',
                  gap: '0.75rem',
                  padding: '1rem',
                  borderBottom: '1px solid #374151',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  minWidth: '1200px'
                }}
              >
                <div style={{ fontSize: '1.5rem', textAlign: 'center' }}>
                  {coupon.status === 'used' ? '✅' : coupon.issued_to_customer ? '☑️' : '📄'}
                </div>
                <div>
                  {coupon.coupon_type === 'discount' ? (
                    <span style={{
                      backgroundColor: '#7C2D12',
                      color: '#FCA5A5',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      30% 할인
                    </span>
                  ) : (
                    <span style={{
                      backgroundColor: '#065F46',
                      color: '#6EE7B7',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      무료 1회
                    </span>
                  )}
                </div>
                <div style={{ color: '#60A5FA', fontWeight: '600' }}>
                  {coupon.coupon_number}
                </div>
                <div style={{ color: '#fff' }}>
                  {coupon.customer_name || '-'}
                </div>
                <div style={{ color: '#9CA3AF' }}>
                  {coupon.customer_phone || '-'}
                </div>
                <div style={{ color: '#9CA3AF' }}>
                  {coupon.used_at ? new Date(coupon.used_at).toLocaleDateString('ko-KR') : '-'}
                </div>
                <div style={{ color: '#9CA3AF' }}>
                  {coupon.branch || '-'}
                </div>
                <div>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: coupon.status === 'used' ? '#DC2626' : coupon.issued_to_customer ? '#10B981' : '#FBBF24',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {coupon.status === 'used' ? '사용완료' : coupon.issued_to_customer ? '지급완료' : '미지급'}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  justifyContent: 'center'
                }}>
                  {userInfo?.isAdmin && coupon.status === 'unused' && !coupon.issued_to_customer && (
                    <button
                      onClick={async () => {
                        if (window.confirm('이 쿠폰을 지급 처리하시겠습니까?')) {
                          try {
                            await issueCoupon(coupon.id);
                            fetchCoupons();
                            alert('쿠폰이 지급되었습니다');
                          } catch (error) {
                            alert('쿠폰 지급 실패: ' + error.message);
                          }
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#FBBF24',
                        color: '#000',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      지급
                    </button>
                  )}
                  {coupon.status === 'unused' && coupon.issued_to_customer && (
                    <button
                      onClick={() => {
                        setSelectedCoupon(coupon);
                        setUseCouponData({
                          customer_name: '',
                          customer_phone: '',
                          service_description: '',
                          service_date: new Date().toISOString().split('T')[0],
                          total_cost: '',
                          payment_status: 'paid',
                          notes: ''
                        });
                        setShowUseCouponModal(true);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#3B82F6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      사용
                    </button>
                  )}
                  {userInfo?.isAdmin && (
                    <button
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#DC2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
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

      {/* Add Coupon Modal */}
      {showAddCouponModal && (
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
            maxWidth: '500px',
            width: '100%',
            border: '1px solid #374151'
          }}>
            <div style={{
              backgroundColor: '#111827',
              borderBottom: '1px solid #374151',
              padding: '24px',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#fff',
                margin: 0
              }}>
                쿠폰 등록
              </h2>
            </div>

            <form onSubmit={handleAddCoupon} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  color: '#9CA3AF',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  쿠폰 타입
                </label>
                <select
                  value={newCouponType}
                  onChange={(e) => setNewCouponType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#374151',
                    border: '1px solid #4B5563',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="free">무료 1회 쿠폰</option>
                  <option value="discount">30% 할인 쿠폰</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  color: '#9CA3AF',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  쿠폰 번호
                </label>
                <input
                  type="text"
                  value={newCouponNumber}
                  onChange={(e) => setNewCouponNumber(e.target.value)}
                  required
                  placeholder="쿠폰 번호 입력"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#374151',
                    border: '1px solid #4B5563',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCouponModal(false);
                    setNewCouponNumber('');
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
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Use Coupon Modal */}
      {showUseCouponModal && selectedCoupon && (
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
              backgroundColor: '#111827',
              borderBottom: '1px solid #374151',
              padding: '24px',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#fff',
                margin: '0 0 8px 0'
              }}>
                쿠폰 사용
              </h2>
              <p style={{
                color: '#9CA3AF',
                fontSize: '14px',
                margin: 0
              }}>
                쿠폰번호: <span style={{ color: '#60A5FA', fontWeight: '600' }}>{selectedCoupon.coupon_number}</span>
              </p>
            </div>

            <form onSubmit={handleUseCoupon} style={{ padding: '24px' }}>
              <div style={{
                display: 'grid',
                gap: '1rem',
                gridTemplateColumns: 'repeat(2, 1fr)'
              }}>
                <div>
                  <label style={{
                    color: '#9CA3AF',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    고객명 *
                  </label>
                  <input
                    type="text"
                    value={useCouponData.customer_name}
                    onChange={(e) => setUseCouponData({...useCouponData, customer_name: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#374151',
                      border: '1px solid #4B5563',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    color: '#9CA3AF',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    전화번호 *
                  </label>
                  <input
                    type="tel"
                    value={useCouponData.customer_phone}
                    onChange={(e) => setUseCouponData({...useCouponData, customer_phone: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#374151',
                      border: '1px solid #4B5563',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    color: '#9CA3AF',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    사용 지점 *
                  </label>
                  <input
                    type="text"
                    value={userInfo?.branchName || '관리자'}
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#374151',
                      border: '1px solid #4B5563',
                      borderRadius: '6px',
                      color: '#9CA3AF',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
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
                  onClick={() => {
                    setShowUseCouponModal(false);
                    setSelectedCoupon(null);
                    setUseCouponData({
                      customer_name: '',
                      customer_phone: '',
                      service_description: '',
                      service_date: new Date().toISOString().split('T')[0],
                      total_cost: '',
                      payment_status: 'paid',
                      notes: ''
                    });
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
                  사용 처리
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManagement;
