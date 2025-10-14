import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = sessionStorage.getItem('las_current_user');
    if (user) {
      const userData = JSON.parse(user);
      if (userData.userType === '관리자' || userData.userType === '점장') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

const handleLogin = (e) => {
  e.preventDefault();
  
  console.log('🔐 로그인 시도:', email);
  
  const users = JSON.parse(localStorage.getItem('las_users') || '[]');
  console.log('📋 전체 사용자 수:', users.length);
  
  if (users.length === 0) {
    alert('⚠️ 등록된 사용자가 없습니다.\n\n메인 페이지로 돌아가서 테스트 계정을 생성하세요.');
    navigate('/');
    return;
  }
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    const emailExists = users.find(u => u.email === email);
    if (emailExists) {
      alert('❌ 비밀번호가 일치하지 않습니다.\n\n다시 확인해주세요.');
    } else {
      alert('❌ 등록되지 않은 이메일입니다.\n\n회원가입을 먼저 진행해주세요.');
    }
    return;
  }

  if (user.status === 'pending') {
    alert('⏳ 계정 승인 대기 중입니다.\n\n승인 완료 후 로그인이 가능합니다.');
    return;
  }

  if (user.status === 'rejected') {
    alert('❌ 계정 승인이 거부되었습니다.\n\n거부 사유: ' + (user.rejectReason || '별도 안내 예정'));
    return;
  }

  const currentUser = {
    email: user.email,
    name: user.name,
    branch: user.branch,
    phone: user.phone,
    userType: user.userType,
    loginTime: new Date().toISOString()
  };

  sessionStorage.setItem('las_current_user', JSON.stringify(currentUser));
  console.log('✅ 로그인 성공:', user.name, '/', user.userType);
  
  alert(`${user.name}님, 환영합니다!`);
  
  if (user.userType === '관리자' || user.userType === '점장') {
    navigate('/admin');
  } else {
    navigate('/dashboard');
  }
};

  return (
    <div style={{
      fontFamily: "'Noto Sans KR', sans-serif",
      backgroundColor: '#f5f5f5',
      padding: '20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        background: 'white',
        padding: '40px 30px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ color: '#16a085', textAlign: 'center', fontSize: '14px', marginBottom: '20px' }}>
          LAS 매장관리 시스템에 오신것을 환영합니다.
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <svg width="60" height="60" viewBox="0 0 100 100" style={{ margin: '0 auto 15px' }}>
            <path fill="#16a085" d="M20,30 L50,20 L80,30 L80,70 L50,80 L20,70 Z M30,40 L50,35 L70,40 L70,60 L50,65 L30,60 Z"/>
            <path fill="#1abc9c" d="M30,40 L50,35 L70,40 L70,50 L50,55 L30,50 Z"/>
          </svg>
          <h1 style={{ color: '#16a085', fontSize: '32px', fontWeight: 'bold' }}>로그인</h1>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50', fontWeight: '500', fontSize: '14px' }}>
              📧 이메일
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              required
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50', fontWeight: '500', fontSize: '14px' }}>
              🔒 비밀번호
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
            <button type="submit" style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              backgroundColor: '#16a085',
              color: 'white'
            }}>
              로그인
            </button>
            <button type="button" onClick={() => navigate('/signup')} style={{
              flex: 1,
              padding: '12px',
              backgroundColor: 'white',
              color: '#16a085',
              border: '1px solid #16a085',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              회원가입
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}