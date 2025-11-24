import React, { useState } from 'react';
import { login } from '../services/userService';
import logo from '../assets/logo.svg';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login(username, password);

      if (response.success) {
        const branchIcons = {
          '곤지암점': '🏔️',
          '대관령점': '⛷️',
          '비발디점': '🎿',
          '관리자': '👑'
        };

        onLogin({
          ...response.user,
          branchIcon: branchIcons[response.user.branchName] || '🏢',
          username: response.user.username
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #000000 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #374151',
        borderRadius: '16px',
        padding: '3rem',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src={logo}
            alt="SnowMeta"
            style={{
              width: '280px',
              height: 'auto',
              marginBottom: '1rem'
            }}
          />
          <p style={{
            color: '#9CA3AF',
            fontSize: '1rem'
          }}>
            고객 관리 시스템
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#DC2626',
            color: '#fff',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              color: '#9CA3AF',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'block',
              marginBottom: '0.5rem'
            }}>
              사용자명
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="사용자명을 입력하세요"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#374151',
                border: '1px solid #4B5563',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              color: '#9CA3AF',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'block',
              marginBottom: '0.5rem'
            }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#374151',
                border: '1px solid #4B5563',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: isLoading ? '#6B7280' : '#3B82F6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = '#2563EB')}
            onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = '#3B82F6')}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
