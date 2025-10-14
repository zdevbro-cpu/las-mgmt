import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    branch: '',
    phone: '',
    userType: '점주'
  });
  const [showNotice, setShowNotice] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'userType') {
      setShowNotice(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('las_users') || '[]');
    if (users.some(user => user.email === formData.email)) {
      alert('이미 등록된 이메일입니다.');
      return;
    }

    let approverRole = '';
    if (formData.userType === '관리자') approverRole = '시스템 마스터';
    else if (formData.userType === '점장') approverRole = '관리자';
    else if (formData.userType === '점주') approverRole = '점장';

    if (!confirm(`${formData.userType}으로 가입 신청하시겠습니까?\n\n✓ ${approverRole}의 승인이 필요합니다\n✓ 승인 완료 전까지 로그인이 불가능합니다`)) {
      return;
    }

    const newUser = {
      email: formData.email,
      password: formData.password,
      name: formData.name,
      branch: formData.branch,
      phone: formData.phone,
      userType: formData.userType,
      status: 'pending',
      createdAt: new Date().toISOString(),
      approvedAt: null
    };

    users.push(newUser);
    localStorage.setItem('las_users', JSON.stringify(users));

    alert(`${formData.userType} 가입 신청이 완료되었습니다!\n\n${approverRole}의 승인 후 로그인이 가능합니다.`);
    navigate('/login');
  };

  const getApproverText = () => {
    if (formData.userType === '관리자') return '시스템 마스터의 승인이 필요합니다';
    if (formData.userType === '점장') return '관리자의 승인이 필요합니다';
    if (formData.userType === '점주') return '점장의 승인이 필요합니다';
    return '';
  };

  return (
    <div style={{
      fontFamily: "'Noto Sans KR', sans-serif",
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '400px',
        margin: '0 auto',
        background: 'white',
        padding: '40px 30px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <svg width="60" height="60" viewBox="0 0 100 100" style={{ margin: '0 auto 15px' }}>
            <path fill="#16a085" d="M20,30 L50,20 L80,30 L80,70 L50,80 L20,70 Z M30,40 L50,35 L70,40 L70,60 L50,65 L30,60 Z"/>
            <path fill="#1abc9c" d="M30,40 L50,35 L70,40 L70,50 L50,55 L30,50 Z"/>
          </svg>
          <h1 style={{ color: '#16a085', fontSize: '32px', fontWeight: 'bold' }}>회원가입</h1>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50', fontWeight: '500', fontSize: '14px' }}>
              📧 이메일
            </label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="이메일을 입력하세요" required
              style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50', fontWeight: '500', fontSize: '14px' }}>
              🔒 비밀번호
            </label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="비밀번호를 입력하세요" required
              style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50', fontWeight: '500', fontSize: '14px' }}>
              🔒 비밀번호 확인
            </label>
            <input type="password" name="passwordConfirm" value={formData.passwordConfirm} onChange={handleChange} placeholder="비밀번호를 확인하세요" required
              style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50', fontWeight: '500', fontSize: '14px' }}>
              이름
            </label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="이름을 입력하세요" required
              style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50', fontWeight: '500', fontSize: '14px' }}>
              지점명
            </label>
            <input type="text" name="branch" value={formData.branch} onChange={handleChange} placeholder="지점명을 입력하세요" required
              style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50', fontWeight: '500', fontSize: '14px' }}>
              핸드폰
            </label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="핸드폰 번호를 입력하세요" required
              style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50', fontWeight: '500', fontSize: '14px' }}>
              구분
            </label>
            <div style={{ display: 'flex', gap: '15px' }}>
              {['점주', '점장', '관리자'].map(type => (
                <label key={type} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="radio" name="userType" value={type} checked={formData.userType === type} onChange={handleChange}
                    style={{ width: '18px', height: '18px', marginRight: '5px' }} />
                  <span style={{ fontSize: '14px', color: '#2c3e50' }}>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {showNotice && (
            <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '5px', padding: '15px', marginBottom: '20px', fontSize: '13px', color: '#856404' }}>
              <strong>⏳ 승인 안내</strong>
              <ul style={{ margin: '8px 0 0 20px', fontSize: '12px' }}>
                <li>{getApproverText()}</li>
                <li>승인 완료 전까지 로그인이 불가능합니다</li>
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
            <button type="submit" style={{
              flex: 1, padding: '12px', backgroundColor: '#16a085', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: '500', cursor: 'pointer'
            }}>
              회원가입
            </button>
            <button type="button" onClick={() => navigate('/login')} style={{
              flex: 1, padding: '12px', backgroundColor: 'white', color: '#16a085', border: '1px solid #16a085', borderRadius: '5px', fontSize: '16px', fontWeight: '500', cursor: 'pointer'
            }}>
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}