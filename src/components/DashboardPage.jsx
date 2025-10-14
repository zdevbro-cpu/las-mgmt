import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = sessionStorage.getItem('las_current_user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userStr));
  }, [navigate]);

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      sessionStorage.removeItem('las_current_user');
      navigate('/login');
    }
  };

  if (!user) return <div>로딩 중...</div>;

  return (
    <div style={{
      fontFamily: "'Noto Sans KR', sans-serif",
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '40px'
    }}>
      <div style={{
        maxWidth: '450px',
        margin: '0 auto',
        background: 'white',
        padding: '60px 40px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        <svg width="80" height="80" viewBox="0 0 100 100" style={{ margin: '0 auto 20px' }}>
          <path fill="#16a085" d="M20,30 L50,20 L80,30 L80,70 L50,80 L20,70 Z M30,40 L50,35 L70,40 L70,60 L50,65 L30,60 Z"/>
          <path fill="#1abc9c" d="M30,40 L50,35 L70,40 L70,50 L50,55 L30,50 Z"/>
        </svg>
        <h1 style={{ color: '#16a085', fontSize: '36px', marginBottom: '10px', fontWeight: 'bold' }}>LAS 근무관리시스템</h1>
        <p style={{ color: '#16a085', fontSize: '14px', marginBottom: '30px' }}>LAS 매장관리 시스템에 오신것을 환영합니다.</p>
        
        <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '15px', marginBottom: '30px' }}>
          <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#2c3e50', fontWeight: '600' }}>🏢 지점명</span>
            <span style={{ color: '#16a085', fontWeight: '500' }}>{user.branch}</span>
          </div>
          <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#2c3e50', fontWeight: '600' }}>👤 이름</span>
            <span style={{ color: '#16a085', fontWeight: '500' }}>{user.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#2c3e50', fontWeight: '600' }}>📋 구분</span>
            <span style={{ color: '#16a085', fontWeight: '500' }}>{user.userType}</span>
          </div>
        </div>

        {/* ⭐ 버튼 수정: 근무일지/판매관리/승인관리 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px' }}>
          <button onClick={() => navigate('/work-diary')} style={{
            padding: '15px', backgroundColor: '#16a085', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.3s'
          }}>
            근무일지
          </button>
          
          <button onClick={() => navigate('/sales')} style={{
            padding: '15px', backgroundColor: '#16a085', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.3s'
          }}>
            판매관리
          </button>

          {(user.userType === '관리자' || user.userType === '점장') && (
            <button onClick={() => navigate('/admin')} style={{
              padding: '15px', backgroundColor: '#16a085', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.3s'
            }}>
              승인관리
            </button>
          )}
        </div>

        <button onClick={handleLogout} style={{
          width: '100%', padding: '12px', backgroundColor: 'white', color: '#e74c3c', border: '2px solid #e74c3c', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.3s'
        }}>
          나가기
        </button>
      </div>
    </div>
  );
}