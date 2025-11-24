import React from 'react';

const LoadingSpinner = ({ message = '로딩 중...' }) => {
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
        border: '4px solid #374151',
        borderTop: '4px solid #3B82F6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{
        color: '#9CA3AF',
        fontSize: '0.875rem',
        margin: 0
      }}>{message}</p>
    </div>
  );
};

export default LoadingSpinner;
