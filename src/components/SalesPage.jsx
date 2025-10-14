import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SalesPage() {
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

  if (!user) return <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>;

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", backgroundColor: '#f5f5f5', padding: '20px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          background: 'white', 
          padding: '25px 30px', 
          borderRadius: '10px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)', 
          marginBottom: '30px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div>
            <h1 style={{ color: '#16a085', fontSize: '28px', marginBottom: '10px' }}>LAS Book Store</h1>
            <p style={{ color: '#7f8c8d', fontSize: '14px' }}>LAS Book을 신청합니다.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => {
                console.log('대시보드로 이동');
                navigate('/dashboard');
              }} 
              style={{ 
                padding: '10px 20px', 
                background: '#16a085', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: 'pointer', 
                fontWeight: '500' 
              }}
            >
              대시보드
            </button>
            <button 
              onClick={() => {
                console.log('근무일지로 이동');
                navigate('/work-diary');
              }} 
              style={{ 
                padding: '10px 20px', 
                background: '#3498db', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: 'pointer', 
                fontWeight: '500' 
              }}
            >
              근무일지
            </button>
          </div>
        </div>

        <div style={{ background: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#16a085', fontSize: '24px', marginBottom: '20px' }}>지점명과 담당자 이름을 확인하세요</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            <div>
              <label style={{ display: 'block', color: '#2c3e50', fontWeight: '600', marginBottom: '8px' }}>지점명</label>
              <input 
                type="text" 
                value={user.branch}
                readOnly
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #ddd', 
                  borderRadius: '5px', 
                  backgroundColor: '#f8f9fa',
                  fontSize: '14px'
                }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#2c3e50', fontWeight: '600', marginBottom: '8px' }}>이름</label>
              <input 
                type="text" 
                value={user.name}
                readOnly
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #ddd', 
                  borderRadius: '5px', 
                  backgroundColor: '#f8f9fa',
                  fontSize: '14px'
                }} 
              />
            </div>
          </div>

          <div style={{ 
            background: '#e3f2fd', 
            padding: '30px', 
            borderRadius: '10px', 
            textAlign: 'center',
            border: '2px dashed #2196f3'
          }}>
            <h3 style={{ color: '#1565c0', fontSize: '20px', marginBottom: '15px' }}>📚 판매관리 기능</h3>
            <p style={{ color: '#1565c0', fontSize: '14px', marginBottom: '20px' }}>
              이전에 개발된 판매관리 페이지를 여기에 통합하세요.
            </p>
            <div style={{ 
              display: 'inline-block', 
              background: 'white', 
              padding: '20px 30px', 
              borderRadius: '10px',
              textAlign: 'left'
            }}>
              <p style={{ color: '#1565c0', fontSize: '14px', marginBottom: '10px', fontWeight: 'bold' }}>
                💡 기존 판매관리 페이지 파일 위치:
              </p>
              <ul style={{ color: '#1565c0', fontSize: '13px', marginLeft: '20px' }}>
                <li>public/sales.html 확인</li>
                <li>src/pages/sales.jsx 확인</li>
                <li>프로젝트 폴더에서 검색: *sales* 또는 *판매*</li>
              </ul>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button 
              onClick={() => navigate('/dashboard')} 
              style={{
                padding: '12px 30px',
                background: '#16a085',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              매장관리 시스템으로 가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}