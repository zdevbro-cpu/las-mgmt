import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HeroPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('las_users') || '[]');
    
    if (users.length === 0) {
      console.log('🔧 초기 테스트 계정 생성 중...');
      
      const testUsers = [
        {
          email: 'admin@test.com',
          password: '1234',
          name: '시스템관리자',
          branch: '본사',
          phone: '010-0000-0000',
          userType: '관리자',
          status: 'approved',
          createdAt: new Date().toISOString(),
          approvedAt: new Date().toISOString()
        },
        {
          email: 'manager@test.com',
          password: '1234',
          name: '김점장',
          branch: '강남점',
          phone: '010-1111-1111',
          userType: '점장',
          status: 'approved',
          createdAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          approver: 'admin@test.com'
        },
        {
          email: 'owner@test.com',
          password: '1234',
          name: '이점주',
          branch: '강남점',
          phone: '010-2222-2222',
          userType: '점주',
          status: 'approved',
          createdAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          approver: 'manager@test.com'
        }
      ];
      
      localStorage.setItem('las_users', JSON.stringify(testUsers));
      console.log('✅ 테스트 계정 생성 완료!');
    }

    const currentUser = sessionStorage.getItem('las_current_user');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      if (user.userType === '관리자' || user.userType === '점장') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  return (
    <div style={{
      fontFamily: "'Noto Sans KR', sans-serif",
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px'
    }}>
      <div style={{
        background: 'white',
        padding: '60px 40px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '450px',
        width: '100%',
        textAlign: 'center'
      }}>
        <svg width="80" height="80" viewBox="0 0 100 100" style={{ margin: '0 auto 20px' }}>
          <path fill="#16a085" d="M20,30 L50,20 L80,30 L80,70 L50,80 L20,70 Z M30,40 L50,35 L70,40 L70,60 L50,65 L30,60 Z"/>
          <path fill="#1abc9c" d="M30,40 L50,35 L70,40 L70,50 L50,55 L30,50 Z"/>
        </svg>
        
        <h1 style={{
          color: '#16a085',
          fontSize: '36px',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          LAS 근무관리시스템
        </h1>
        
        <p style={{
          color: '#16a085',
          fontSize: '14px',
          marginBottom: '30px'
        }}>
          LAS 매장관리 시스템에 오신것을 환영합니다.
        </p>

        <div style={{
          background: '#e3f2fd',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '30px',
          textAlign: 'left'
        }}>
          <h3 style={{ color: '#1565c0', fontSize: '16px', marginBottom: '10px' }}>
            🔐 테스트 계정
          </h3>
          <div style={{ fontSize: '13px', color: '#1565c0' }}>
            <div style={{ marginBottom: '5px' }}>
              <strong>관리자:</strong> admin@test.com / 1234
            </div>
            <div style={{ marginBottom: '5px' }}>
              <strong>점장:</strong> manager@test.com / 1234
            </div>
            <div>
              <strong>점주:</strong> owner@test.com / 1234
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '15px',
              backgroundColor: '#16a085',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '18px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 5px 15px rgba(22, 160, 133, 0.3)'
            }}
          >
            로그인
          </button>
          
          <button
            onClick={() => navigate('/signup')}
            style={{
              padding: '15px',
              backgroundColor: 'white',
              color: '#16a085',
              border: '2px solid #16a085',
              borderRadius: '10px',
              fontSize: '18px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}