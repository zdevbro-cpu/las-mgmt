import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [pending, setPending] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = sessionStorage.getItem('las_current_user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    const userData = JSON.parse(userStr);
    if (userData.userType !== '관리자' && userData.userType !== '점장') {
      alert('승인 권한이 없습니다.');
      navigate('/dashboard');
      return;
    }
    setUser(userData);
    loadPending(userData);
  }, [navigate]);

  const loadPending = (currentUser) => {
    const users = JSON.parse(localStorage.getItem('las_users') || '[]');
    let filtered = [];
    if (currentUser.userType === '관리자') {
      filtered = users.filter(u => u.userType === '점장' && u.status === 'pending');
    } else if (currentUser.userType === '점장') {
      filtered = users.filter(u => u.userType === '점주' && u.status === 'pending');
    }
    setPending(filtered);
  };

  const handleApprove = (email) => {
    if (!window.confirm('이 사용자를 승인하시겠습니까?')) return;
    
    const users = JSON.parse(localStorage.getItem('las_users') || '[]');
    const idx = users.findIndex(u => u.email === email);
    if (idx !== -1) {
      users[idx].status = 'approved';
      users[idx].approvedAt = new Date().toISOString();
      users[idx].approver = user.email;
      localStorage.setItem('las_users', JSON.stringify(users));
      alert('승인되었습니다.');
      loadPending(user);
    }
  };

  const handleReject = (email) => {
    const reason = window.prompt('거부 사유를 입력하세요 (선택사항):');
    if (reason === null) return;
    
    const users = JSON.parse(localStorage.getItem('las_users') || '[]');
    const idx = users.findIndex(u => u.email === email);
    if (idx !== -1) {
      users[idx].status = 'rejected';
      users[idx].rejectedAt = new Date().toISOString();
      users[idx].rejecter = user.email;
      users[idx].rejectReason = reason || '별도 안내 예정';
      localStorage.setItem('las_users', JSON.stringify(users));
      alert('거부되었습니다.');
      loadPending(user);
    }
  };

  if (!user) return <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>;

  const isAdmin = user.userType === '관리자';
  const targetRole = isAdmin ? '점장' : '점주';

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", backgroundColor: '#f5f5f5', padding: '20px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ background: 'white', padding: '25px 30px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: '#16a085', fontSize: '28px', marginBottom: '10px' }}>
              {isAdmin ? 'LAS 관리자 페이지' : 'LAS 점장 승인 관리'}
            </h1>
            <div style={{ 
              background: isAdmin ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', 
              color: 'white', 
              padding: '8px 20px', 
              borderRadius: '20px', 
              display: 'inline-block', 
              fontSize: '14px', 
              fontWeight: '600' 
            }}>
              {isAdmin ? 'ADMINISTRATOR' : 'MANAGER'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 20px', background: '#16a085', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: '500' }}>
              대시보드
            </button>
            <button onClick={() => {
              if (window.confirm('로그아웃 하시겠습니까?')) {
                sessionStorage.removeItem('las_current_user');
                navigate('/login');
              }
            }} style={{ padding: '10px 20px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: '500' }}>
              로그아웃
            </button>
          </div>
        </div>

        <div style={{ background: '#fff3cd', border: '2px solid #ffc107', padding: '25px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#856404', fontSize: '18px' }}>
              ⏳ {targetRole} 승인 대기 목록
            </h3>
            <span style={{ background: '#ffc107', color: '#856404', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold' }}>
              {pending.length}
            </span>
          </div>
          
          {pending.length === 0 ? (
            <div style={{ background: 'white', textAlign: 'center', padding: '40px', borderRadius: '8px', color: '#95a5a6' }}>
              승인 대기 중인 사용자가 없습니다.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {pending.map(p => (
                <div key={p.email} style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ffc107', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', flex: 1 }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>구분</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e67e22' }}>{p.userType}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>이름</div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>{p.name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>지점</div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>{p.branch}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>이메일</div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>{p.email}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>신청일</div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>
                        {new Date(p.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                    <button onClick={() => handleApprove(p.email)} style={{ padding: '10px 20px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                      ✓ 승인
                    </button>
                    <button onClick={() => handleReject(p.email)} style={{ padding: '10px 20px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                      ✗ 거부
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}