import React, { useState, useEffect } from 'react';
import { useMediaQuery, BREAKPOINTS } from '../hooks/useMediaQuery';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from '../services/scheduleService';

const Schedule = () => {
  const isMobile = useMediaQuery(BREAKPOINTS.mobile);
  const isTablet = useMediaQuery(BREAKPOINTS.tablet);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [allSchedulesPage, setAllSchedulesPage] = useState(1);
  const [monthSchedulesPage, setMonthSchedulesPage] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    event_type: 'competition',
    start_date: '',
    end_date: '',
    location: '',
    status: 'scheduled'
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await getSchedules();
      setSchedules(data || []);
    } catch (error) {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Supabase 테이블 컬럼명에 맞게 데이터 변환
      const submitData = {
        title: formData.title,
        start_date: formData.start_date,
        end_date: formData.end_date || formData.start_date,
        location: formData.location,
        description: formData.description || null
      };

      if (selectedSchedule) {
        await updateSchedule(selectedSchedule.id, submitData);
      } else {
        await createSchedule(submitData);
      }

      setShowModal(false);
      setSelectedSchedule(null);
      resetForm();
      loadSchedules();
    } catch (error) {
      alert('저장에 실패했습니다.');
    }
  };

  const handleEdit = (schedule) => {
    setSelectedSchedule(schedule);
    const startDate = schedule.start_date ? schedule.start_date.split('T')[0] : '';
    const endDate = schedule.end_date ? schedule.end_date.split('T')[0] : startDate;
    setFormData({
      title: schedule.title || '',
      event_type: schedule.event_type || 'competition',
      start_date: startDate,
      end_date: endDate,
      location: schedule.location || '',
      status: schedule.status || 'scheduled',
      notes: schedule.memo || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteSchedule(id);
        loadSchedules();
      } catch (error) {
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      event_type: 'competition',
      start_date: '',
      end_date: '',
      location: '',
      status: 'scheduled'
    });
  };

  const handleNewSchedule = () => {
    setSelectedSchedule(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      title: '',
      event_type: 'competition',
      start_date: today,
      end_date: today,
      location: '',
      status: 'scheduled'
    });
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return '#3B82F6';
      case 'in_progress': return '#F59E0B';
      case 'completed': return '#10B981';
      case 'cancelled': return '#DC2626';
      default: return '#9CA3AF';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled': return '예정';
      case 'in_progress': return '진행중';
      case 'completed': return '완료';
      case 'cancelled': return '취소';
      default: return '알수없음';
    }
  };

  const getEventTypeColor = (eventType) => {
    switch (eventType) {
      case 'competition': return '#DC2626';
      case 'training': return '#3B82F6';
      case 'meeting': return '#8B5CF6';
      case 'event': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getEventTypeText = (eventType) => {
    switch (eventType) {
      case 'competition': return '대회';
      case 'training': return '훈련';
      case 'meeting': return '회의';
      case 'event': return '이벤트';
      default: return '기타';
    }
  };

  // 캘린더 관련 함수
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getSchedulesForDate = (date) => {
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.start_date);
      scheduleDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);

      return scheduleDate.getTime() === checkDate.getTime();
    });
  };

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
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
        일정을 불러오는 중..
      </div>
    );
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        marginBottom: '2rem',
        gap: isMobile ? '1rem' : '0'
      }}>
        <div>
          <h1 style={{
            color: '#fff',
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: 'bold',
            margin: '0 0 0.5rem'
          }}>
            스키 시합일정 관리
          </h1>
          <p style={{
            color: '#9CA3AF',
            fontSize: isMobile ? '0.875rem' : '1rem',
            margin: '0'
          }}>
            대회, 훈련, 이벤트 일정 관리
          </p>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: '1rem',
          width: isMobile ? '100%' : 'auto'
        }}>
          <div style={{ position: 'relative', width: isMobile ? '100%' : 'auto' }}>
            <input
              type="text"
              placeholder={isMobile ? "검색.." : "제목, 장소, 주최자, 참가자로 검색.."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: isMobile ? '100%' : '300px',
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
          <button
            onClick={handleNewSchedule}
            style={{
              padding: '12px 24px',
              backgroundColor: '#10B981',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ➕ 일정 등록
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #374151',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '2rem'
      }}>
        {/* Calendar Header */}
        <div style={{
          backgroundColor: '#000',
          padding: isMobile ? '1rem' : '1.5rem',
          borderBottom: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={() => changeMonth(-1)}
            style={{
              padding: isMobile ? '6px 10px' : '8px 16px',
              backgroundColor: '#374151',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px'
            }}
          >
            {isMobile ? '◀' : '◀ 이전달'}
          </button>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.5rem' : '1rem'
          }}>
            <h3 style={{
              color: '#fff',
              fontSize: isMobile ? '1rem' : '1.25rem',
              fontWeight: 'bold',
              margin: '0'
            }}>
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </h3>
            <button
              onClick={goToToday}
              style={{
                padding: isMobile ? '4px 8px' : '6px 12px',
                backgroundColor: '#3B82F6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: isMobile ? '11px' : '12px',
                fontWeight: '600'
              }}
            >
              오늘
            </button>
          </div>
          <button
            onClick={() => changeMonth(1)}
            style={{
              padding: isMobile ? '6px 10px' : '8px 16px',
              backgroundColor: '#374151',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px'
            }}
          >
            {isMobile ? '▶' : '다음달 ▶'}
          </button>
        </div>

        {/* Calendar Grid */}
        <div style={{ padding: isMobile ? '0.75rem' : '1.5rem' }}>
          {/* Day Headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: isMobile ? '4px' : '8px',
            marginBottom: isMobile ? '4px' : '8px'
          }}>
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  color: index === 0 ? '#DC2626' : index === 6 ? '#3B82F6' : '#9CA3AF',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  fontWeight: '600',
                  padding: isMobile ? '4px' : '8px'
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: isMobile ? '4px' : '8px'
          }}>
            {(() => {
              const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
              const days = [];
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              // Empty cells before first day
              for (let i = 0; i < startingDayOfWeek; i++) {
                days.push(
                  <div
                    key={`empty-${i}`}
                    style={{
                      minHeight: isMobile ? '60px' : '100px',
                      backgroundColor: '#111827',
                      borderRadius: isMobile ? '4px' : '8px',
                      border: '1px solid #374151'
                    }}
                  />
                );
              }

              // Days in month
              for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const dateSchedules = getSchedulesForDate(date);
                const isToday = date.getTime() === today.getTime();
                const dayOfWeek = date.getDay();

                days.push(
                  <div
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    style={{
                      minHeight: isMobile ? '60px' : '100px',
                      backgroundColor: isToday ? '#1e3a5f' : '#111827',
                      borderRadius: isMobile ? '4px' : '8px',
                      border: isToday ? '2px solid #3B82F6' : '1px solid #374151',
                      padding: isMobile ? '4px' : '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isToday) e.currentTarget.style.backgroundColor = '#1e293b';
                    }}
                    onMouseLeave={(e) => {
                      if (!isToday) e.currentTarget.style.backgroundColor = '#111827';
                    }}
                  >
                    <div style={{
                      color: dayOfWeek === 0 ? '#DC2626' : dayOfWeek === 6 ? '#3B82F6' : '#fff',
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      fontWeight: isToday ? 'bold' : '600',
                      marginBottom: isMobile ? '2px' : '4px'
                    }}>
                      {day}
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: isMobile ? '1px' : '2px',
                      maxHeight: isMobile ? '50px' : '80px',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      paddingRight: '2px'
                    }}>
                      {dateSchedules.map((schedule, index) => (
                        <div
                          key={schedule.id}
                          style={{
                            backgroundColor: getEventTypeColor(schedule.event_type),
                            color: '#fff',
                            fontSize: isMobile ? '0.55rem' : '0.65rem',
                            padding: isMobile ? '1px 3px' : '2px 4px',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                          title={schedule.title}
                        >
                          {schedule.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return days;
            })()}
          </div>
        </div>
      </div>

      {/* Schedules Lists */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* ?�체 ?�정 */}
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
            <h3 style={{
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
              margin: '0'
            }}>
              전체 일정 ({schedules.length}개)
            </h3>
          </div>

        {schedules.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#9CA3AF'
          }}>
            등록된 일정이 없습니다.
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '100px 1.5fr 1fr auto',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#000',
              borderBottom: '1px solid #374151',
              fontSize: '0.7rem',
              fontWeight: '600',
              color: '#9CA3AF'
            }}>
              <div>날짜</div>
              <div>일정명</div>
              <div>장소</div>
              <div style={{ textAlign: 'center' }}>작업</div>
            </div>

            {/* Table Body */}
            <div style={{
              display: 'grid',
              gap: '0',
              maxHeight: '180px',
              overflowY: 'auto'
            }}>
              {schedules
                .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
                .map((schedule, index) => (
                  <div
                    key={schedule.id}
                    style={{
                      backgroundColor: '#111827',
                      borderBottom: '1px solid #374151',
                      padding: '0.6rem 1rem',
                      display: 'grid',
                      gridTemplateColumns: '100px 1.5fr 1fr auto',
                      gap: '0.5rem',
                      alignItems: 'center',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div>
                      <div style={{
                        color: '#fff',
                        fontWeight: '600',
                        fontSize: '0.8rem'
                      }}>
                        {new Date(schedule.start_date).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div style={{
                        color: '#9CA3AF',
                        fontSize: '0.7rem'
                      }}>
                        {new Date(schedule.start_date).toLocaleDateString('ko-KR', {
                          year: 'numeric'
                        }).split('.')[0]}년
                      </div>
                    </div>

                    <div>
                      <div style={{
                        color: '#fff',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        marginBottom: '0.15rem'
                      }}>
                        {schedule.title}
                      </div>
                      <div style={{
                        display: 'inline-block',
                        backgroundColor: getEventTypeColor(schedule.event_type),
                        color: '#fff',
                        padding: '1px 4px',
                        borderRadius: '2px',
                        fontSize: '0.6rem',
                        fontWeight: '600'
                      }}>
                        {getEventTypeText(schedule.event_type)}
                      </div>
                    </div>

                    <div style={{
                      color: '#9CA3AF',
                      fontSize: '0.8rem'
                    }}>
                      {schedule.location || '-'}
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '0.3rem',
                      justifyContent: 'center'
                    }}>
                      <button
                        onClick={() => handleEdit(schedule)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#3B82F6',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '0.7rem',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#DC2626',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '0.7rem',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
        </div>

        {/* 이번 달 일정 */}
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
            <h3 style={{
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
              margin: '0'
            }}>
              이번 달 일정 ({schedules.filter(s => {
                const scheduleDate = new Date(s.start_date);
                return scheduleDate.getMonth() === currentDate.getMonth() &&
                       scheduleDate.getFullYear() === currentDate.getFullYear();
              }).length}개)
            </h3>
          </div>

          {schedules.filter(s => {
            const scheduleDate = new Date(s.start_date);
            return scheduleDate.getMonth() === currentDate.getMonth() &&
                   scheduleDate.getFullYear() === currentDate.getFullYear();
          }).length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#9CA3AF'
            }}>
              이번 달 일정이 없습니다.
            </div>
          ) : (
            <div>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '100px 1.5fr 1fr auto',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#000',
                borderBottom: '1px solid #374151',
                fontSize: '0.7rem',
                fontWeight: '600',
                color: '#9CA3AF'
              }}>
                <div>날짜</div>
                <div>일정명</div>
                <div>장소</div>
                <div style={{ textAlign: 'center' }}>작업</div>
              </div>

              {/* Table Body */}
              <div style={{
                display: 'grid',
                gap: '0',
                maxHeight: '180px',
                overflowY: 'auto'
              }}>
                {schedules
                  .filter(s => {
                    const scheduleDate = new Date(s.start_date);
                    return scheduleDate.getMonth() === currentDate.getMonth() &&
                           scheduleDate.getFullYear() === currentDate.getFullYear();
                  })
                  .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
                  .map((schedule, index) => (
                    <div
                      key={schedule.id}
                      style={{
                        backgroundColor: '#111827',
                        borderBottom: '1px solid #374151',
                        padding: '0.6rem 1rem',
                        display: 'grid',
                        gridTemplateColumns: '100px 1.5fr 1fr auto',
                        gap: '0.5rem',
                        alignItems: 'center',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div>
                        <div style={{
                          color: '#fff',
                          fontWeight: '600',
                          fontSize: '0.8rem'
                        }}>
                          {new Date(schedule.start_date).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div style={{
                          color: '#9CA3AF',
                          fontSize: '0.7rem'
                        }}>
                          {new Date(schedule.start_date).toLocaleDateString('ko-KR', {
                            year: 'numeric'
                          }).split('.')[0]}년
                        </div>
                      </div>

                      <div>
                        <div style={{
                          color: '#fff',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          marginBottom: '0.15rem'
                        }}>
                          {schedule.title}
                        </div>
                        <div style={{
                          display: 'inline-block',
                          backgroundColor: getEventTypeColor(schedule.event_type),
                          color: '#fff',
                          padding: '1px 4px',
                          borderRadius: '2px',
                          fontSize: '0.6rem',
                          fontWeight: '600'
                        }}>
                          {getEventTypeText(schedule.event_type)}
                        </div>
                      </div>

                      <div style={{
                        color: '#9CA3AF',
                        fontSize: '0.8rem'
                      }}>
                        {schedule.location || '-'}
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '0.3rem',
                        justifyContent: 'center'
                      }}>
                        <button
                          onClick={() => handleEdit(schedule)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#3B82F6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            fontSize: '0.7rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#DC2626',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            fontSize: '0.7rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
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
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#fff',
                  margin: 0
                }}>
                  {selectedSchedule ? '일정 수정' : '새 일정 등록'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
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
              <div style={{
                display: 'grid',
                gap: '1rem',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
              }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    color: '#9CA3AF',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '8px'
                  }}>제목</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
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
                  }}>날짜</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value, end_date: e.target.value})}
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

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    color: '#9CA3AF',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '8px'
                  }}>장소</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
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
                  {selectedSchedule ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ScheduleCard 컴포넌트
const ScheduleCard = ({
  schedule,
  onEdit,
  onDelete,
  getStatusColor,
  getStatusText,
  getEventTypeColor,
  getEventTypeText,
  isPast = false
}) => (
  <div
    style={{
      backgroundColor: '#111827',
      border: '1px solid #374151',
      borderRadius: '8px',
      padding: '1.5rem',
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: '1rem',
      alignItems: 'start',
      opacity: isPast ? 0.7 : 1
    }}
  >
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '0.75rem'
      }}>
        <h4 style={{
          color: '#fff',
          fontSize: '1.125rem',
          fontWeight: '600',
          margin: '0'
        }}>
          {schedule.title}
        </h4>
        <div style={{
          backgroundColor: getEventTypeColor(schedule.event_type),
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          {getEventTypeText(schedule.event_type)}
        </div>
        <div style={{
          backgroundColor: getStatusColor(schedule.status),
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          {getStatusText(schedule.status)}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.75rem',
        color: '#9CA3AF',
        fontSize: '0.875rem'
      }}>
        <div>시작: {schedule.start_date ? new Date(schedule.start_date).toLocaleDateString() : '-'}</div>
        <div>종료: {schedule.end_date ? new Date(schedule.end_date).toLocaleDateString() : '-'}</div>
        <div>장소: {schedule.location || '-'}</div>
        <div>주최: {schedule.organizer || '-'}</div>
        {schedule.participants && (
          <div style={{ gridColumn: '1 / -1' }}>참가자: {schedule.participants}</div>
        )}
      </div>

      {schedule.description && (
        <div style={{
          marginTop: '0.75rem',
          color: '#D1D5DB',
          fontSize: '0.875rem'
        }}>
          {schedule.description}
        </div>
      )}
    </div>

    <div style={{
      display: 'flex',
      gap: '0.5rem'
    }}>
      <button
        onClick={() => onEdit(schedule)}
        style={{
          padding: '8px 12px',
          backgroundColor: '#3B82F6',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500',
          cursor: 'pointer'
        }}
      >
        수정
      </button>
      <button
        onClick={() => onDelete(schedule.id)}
        style={{
          padding: '8px 12px',
          backgroundColor: '#DC2626',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500',
          cursor: 'pointer'
        }}
      >
        삭제
      </button>
    </div>
  </div>
);

export default Schedule;
