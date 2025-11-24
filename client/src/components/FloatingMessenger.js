import React, { useState, useEffect, useRef } from 'react';
import { getMessages, createMessage } from '../services/messageService';
import { useMediaQuery, BREAKPOINTS } from '../hooks/useMediaQuery';

const FloatingMessenger = ({ userInfo }) => {
  const isMobile = useMediaQuery(BREAKPOINTS.mobile);
  const isTablet = useMediaQuery(BREAKPOINTS.tablet);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const [lastReadTime, setLastReadTime] = useState(Date.now());
  const [searchTerm, setSearchTerm] = useState('');

  // 지점별 색상 매핑
  const getBranchStyle = (branch) => {
    const styles = {
      '관리자': { color: '#dc3545' },
      '곤지암': { color: '#28a745' },
      '대관령': { color: '#007bff' },
      '비발디': { color: '#ffc107' }
    };
    return styles[branch] || { color: '#6c757d' };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 메시지 로드
  useEffect(() => {
    loadMessages();
    // 3초마다 새 메시지 확인
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const allMessages = await getMessages();
      const messagesWithOwnership = allMessages.map(msg => ({
        ...msg,
        isOwn: msg.sender === userInfo?.branchName
      }));
      setMessages(messagesWithOwnership);

      // 읽지 않은 메시지 카운트 계산
      if (!isOpen) {
        const unread = messagesWithOwnership.filter(msg =>
          new Date(msg.timestamp).getTime() > lastReadTime && !msg.isOwn
        ).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      // 메시지 로드 실패 시 무시
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const messageData = {
        sender: userInfo?.branchName || '관리자',
        sender_icon: userInfo?.branchIcon || '👑',
        message: newMessage.trim(),
        branch: userInfo?.branchName || '관리자'
      };

      await createMessage(messageData);
      setNewMessage('');
      await loadMessages();
    } catch (error) {
      alert('메시지 전송에 실패했습니다.');
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
    setLastReadTime(Date.now());
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
  };

  // 검색 필터링
  const filteredMessages = messages.filter(msg =>
    searchTerm === '' ||
    (msg.content && msg.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (msg.sender && msg.sender.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      {/* 플로팅 버튼 */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.backgroundColor = '#0056b3';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = '#007bff';
          }}
        >
          💬
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: '#dc3545',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '2px solid white'
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* 메신저 팝업 */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: isMobile ? '0' : '20px',
          right: isMobile ? '0' : '20px',
          left: isMobile ? '0' : 'auto',
          bottom: isMobile ? '0' : 'auto',
          width: isMobile ? '100%' : (isTablet ? '400px' : '500px'),
          height: isMobile ? '100%' : '700px',
          backgroundColor: 'white',
          borderRadius: isMobile ? '0' : '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* 헤더 */}
          <div style={{
            padding: isMobile ? '16px' : '20px',
            backgroundColor: '#007bff',
            color: 'white',
            borderTopLeftRadius: isMobile ? '0' : '12px',
            borderTopRightRadius: isMobile ? '0' : '12px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: 'bold' }}>지점 메신저</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: isMobile ? '11px' : '12px', opacity: 0.9 }}>
                  {userInfo?.branchName || '관리자'}
                </p>
              </div>
              <button
                onClick={handleClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                ✕
              </button>
            </div>
            {/* 검색창 */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="메시지 검색..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'rgba(255,255,255,0.9)'
              }}
            />
          </div>

          {/* 메시지 영역 */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '12px' : '20px',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            flexDirection: 'column-reverse'
          }}>
            {filteredMessages.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#6c757d',
                padding: '50px 0',
                fontSize: '14px'
              }}>
                {searchTerm ? (
                  <p>'{searchTerm}' 검색 결과가 없습니다.</p>
                ) : (
                  <>
                    <p>아직 메시지가 없습니다.</p>
                    <p style={{ fontSize: '12px', marginTop: '8px' }}>첫 메시지를 보내보세요! 💬</p>
                  </>
                )}
              </div>
            ) : (
              filteredMessages.slice().reverse().map((msg) => {
                const branchStyle = getBranchStyle(msg.branch || msg.sender);
                return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.isOwn ? 'flex-end' : 'flex-start',
                    marginTop: '16px'
                  }}
                >
                  <div style={{
                    maxWidth: isMobile ? '85%' : '70%',
                    display: 'flex',
                    flexDirection: msg.isOwn ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: isMobile ? '6px' : '8px'
                  }}>
                    <div style={{
                      width: isMobile ? '32px' : '36px',
                      height: isMobile ? '32px' : '36px',
                      borderRadius: '50%',
                      backgroundColor: branchStyle.color,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMobile ? '12px' : '14px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      {(msg.sender || '?')[0]}
                    </div>
                    <div style={{
                      backgroundColor: msg.isOwn ? branchStyle.color : 'white',
                      color: msg.isOwn ? 'white' : '#333',
                      padding: isMobile ? '10px 14px' : '12px 16px',
                      borderRadius: isMobile ? '12px' : '16px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      wordBreak: 'break-word',
                      border: msg.isOwn ? 'none' : `2px solid ${branchStyle.color}`
                    }}>
                      <div style={{
                        fontSize: '12px',
                        opacity: msg.isOwn ? 0.95 : 1,
                        marginBottom: '6px',
                        fontWeight: 'bold',
                        color: msg.isOwn ? 'white' : branchStyle.color
                      }}>
                        {msg.sender}
                      </div>
                      <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                        {msg.content}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        opacity: 0.7,
                        marginTop: '4px'
                      }}>
                        {new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: isMobile ? '12px' : '16px',
              backgroundColor: 'white',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              gap: isMobile ? '6px' : '8px'
            }}
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isMobile ? "메시지..." : "메시지를 입력하세요..."}
              style={{
                flex: 1,
                padding: isMobile ? '10px 14px' : '12px 16px',
                border: '1px solid #ced4da',
                borderRadius: isMobile ? '20px' : '24px',
                fontSize: isMobile ? '13px' : '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#ced4da'}
            />
            <button
              type="submit"
              style={{
                padding: isMobile ? '10px 18px' : '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: isMobile ? '20px' : '24px',
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
            >
              전송
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default FloatingMessenger;
