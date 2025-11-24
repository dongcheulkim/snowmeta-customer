import React from 'react';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      gap: '16px'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: '#FEE2E2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px'
      }}>
        ⚠️
      </div>
      <div style={{
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        <h3 style={{
          color: '#DC2626',
          fontSize: '1rem',
          fontWeight: '600',
          margin: '0 0 8px 0'
        }}>
          오류가 발생했습니다
        </h3>
        <p style={{
          color: '#9CA3AF',
          fontSize: '0.875rem',
          margin: 0
        }}>
          {message || '데이터를 불러오는 중 문제가 발생했습니다.'}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3B82F6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2563EB'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3B82F6'}
        >
          다시 시도
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
