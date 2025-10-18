import React, { useState } from 'react'
import { FileText, Users, User, Building2, LogOut, Eye, EyeOff, Calendar, Trash2, Edit, ChevronDown } from 'lucide-react'

// 초기 사용자 데이터
const initialUsers = [
  { id: '1760682889060', email: 'kwonym77@naver.com', password: '111555', name: '권영미', branch: '서초점', user_type: '점주', phone: '010-1234-5678' }
]

// 초기 회원 데이터
const initialMembers = [
  {
    id: '1',
    branch: '서초점',
    name: '김철수',
    phone: '010-1111-2222',
    user_type: '점주',
    email: 'kim@example.com',
    confirmName: '김철수'
  }
]

// 히어로 페이지
const HeroPage = ({ onNavigate }) => {
  console.log('📍 Current Page: hero')
  
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="mb-8">
          <img src="https://i.ibb.co/Zcie30m/las-logo.png" alt="LAS Logo" className="w-32 h-32 mx-auto mb-6" />
          <h1 className="text-5xl font-bold text-white mb-4">LAS 근무관리시스템</h1>
          <p className="text-xl text-white opacity-90 mb-8">향상된 이행능력이 미치는 영향력</p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              console.log('🧭 Navigate to: login')
              onNavigate('login')
            }}
            className="px-8 py-4 text-lg font-bold rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#249689', color: 'white' }}
          >
            로그인
          </button>
          <button
            onClick={() => {
              console.log('🧭 Navigate to: signup')
              onNavigate('signup')
            }}
            className="px-8 py-4 text-lg font-bold rounded-lg hover:bg-gray-50 transition-colors"
            style={{ backgroundColor: 'white', color: '#249689' }}
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  )
}

// 로그인 페이지
const LoginPage = ({ onNavigate, onLogin }) => {
  console.log('📍 Current Page: login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [users] = useState(initialUsers)

  const handleLogin = () => {
    console.log('🔐 Login')
    const user = users.find(u => u.email === email && u.password === password)
    
    if (user) {
      console.log('✅ 로그인 성공:', user)
      onLogin(user)
    } else {
      console.log('❌ 로그인 실패')
      alert('이메일 또는 비밀번호가 올바르지 않습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="https://i.ibb.co/Zcie30m/las-logo.png" alt="LAS Logo" className="w-20 h-20 mx-auto mb-4" />
          <p className="text-sm mb-6" style={{ color: '#249689' }}>LAS 매장관리 시스템에 오신것을 환영합니다.</p>
          <h2 className="text-3xl font-bold" style={{ color: '#249689' }}>로그인</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              <User size={18} /> 이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              비밀번호
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-3 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '15px' }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                type="button"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleLogin}
              className="flex-1 py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#249689', fontSize: '15px' }}
            >
              로그인
            </button>
            <button
              onClick={() => onNavigate('hero')}
              className="flex-1 py-3 font-bold rounded-lg"
              style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', fontSize: '15px' }}
            >
              취소
            </button>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm" style={{ color: '#666666' }}>
              아직 회원이 아니신가요?{' '}
              <button
                onClick={() => onNavigate('signup')}
                className="font-bold underline"
                style={{ color: '#249689' }}
              >
                회원가입하기
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// 회원가입 페이지
const SignupPage = ({ onNavigate }) => {
  console.log('📍 Current Page: signup')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    branch: '',
    phone: '',
    user_type: '점주'
  })

  const handleSubmit = () => {
    if (!formData.email || !formData.password || !formData.name || !formData.branch) {
      alert('필수 항목을 모두 입력해주세요.')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.')
      return
    }
    console.log('✅ 회원가입:', formData)
    alert('회원가입이 완료되었습니다!')
    onNavigate('login')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <img src="https://i.ibb.co/Zcie30m/las-logo.png" alt="LAS Logo" className="w-20 h-20 mx-auto mb-4" />
          <p className="text-sm mb-6" style={{ color: '#249689' }}>LAS 매장관리 시스템에 오신것을 환영합니다.</p>
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#249689' }}>회원가입</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>이메일</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="이메일을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            />
          </div>

          <div>
            <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>비밀번호</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-3 border border-gray-300"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            />
          </div>

          <div>
            <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>비밀번호 확인</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="비밀번호를 확인하세요"
              className="w-full px-4 py-3 border border-gray-300"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            />
          </div>

          <div>
            <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>이름</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            />
          </div>

          <div>
            <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>지점명</label>
            <input
              type="text"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              placeholder="지점명을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            />
          </div>

          <div>
            <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>핸드폰</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="핸드폰 번호를 입력하세요"
              className="w-full px-4 py-3 border border-gray-300"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            />
          </div>

          <div>
            <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>구분</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.user_type === '점주'}
                  onChange={() => setFormData({ ...formData, user_type: '점주' })}
                />
                <span style={{ fontSize: '15px' }}>점주</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.user_type === '직원'}
                  onChange={() => setFormData({ ...formData, user_type: '직원' })}
                />
                <span style={{ fontSize: '15px' }}>직원</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 text-white font-bold rounded-lg"
              style={{ backgroundColor: '#249689', fontSize: '15px' }}
            >
              회원가입
            </button>
            <button
              onClick={() => onNavigate('hero')}
              className="flex-1 py-3 font-bold rounded-lg"
              style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', fontSize: '15px' }}
            >
              취소
            </button>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => onNavigate('login')}
              className="text-sm underline"
              style={{ color: '#249689' }}
            >
              회원 가입하셨나요? 로그인 하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 메인 대시보드
const MainPage = ({ user, onNavigate, onLogout }) => {
  console.log('📍 Current Page: main')
  console.log('👤 Current User:', user)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <img src="https://i.ibb.co/Zcie30m/las-logo.png" alt="LAS Logo" className="w-12 h-12" />
              <h1 className="text-2xl font-bold" style={{ color: '#249689' }}>LAS 근무관리시스템</h1>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm" style={{ color: '#666666' }}>환영합니다!</p>
            <p className="text-lg font-bold">{user?.name || 'User'}님</p>
            <p className="text-sm" style={{ color: '#666666' }}>{user?.branch || 'Branch'} | {user?.user_type || 'Type'}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onNavigate('worklog')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', fontSize: '15px' }}
            >
              <FileText size={20} />
              SM점장 근무일지
            </button>

            <button
              onClick={() => onNavigate('memberManagement')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', fontSize: '15px' }}
            >
              <Building2 size={20} />
              지점관리 업무
            </button>

            <button
              onClick={() => onNavigate('sales')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', fontSize: '15px' }}
            >
              <Users size={20} />
              판매고객관리
            </button>

            <button
              onClick={() => onNavigate('profile')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', fontSize: '15px' }}
            >
              <User size={20} />
              내 정보관리
            </button>

            <button
              onClick={onLogout}
              className="w-full py-4 font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', fontSize: '15px' }}
            >
              <LogOut size={20} />
              나가기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 회원관리 페이지
const MemberManagementPage = ({ user, onNavigate }) => {
  console.log('📍 Current Page: memberManagement')
  const [members, setMembers] = useState(initialMembers)
  const [searchEmail, setSearchEmail] = useState('')
  const [showUserInfo, setShowUserInfo] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#249689' }}>LAS 매장관리</h1>
          <button onClick={() => onNavigate('main')} className="text-sm underline" style={{ color: '#249689' }}>
            매장관리 시스템으로 가기
          </button>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              className="flex-1 px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px' }}
            />
            <button className="px-6 py-2 text-white font-bold rounded-lg" style={{ backgroundColor: '#249689' }}>
              검색
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th className="border p-3 text-left font-bold">지점명</th>
                <th className="border p-3 text-left font-bold">이름</th>
                <th className="border p-3 text-left font-bold">전화번호</th>
                <th className="border p-3 text-left font-bold">구분</th>
                <th className="border p-3 text-left font-bold">이메일</th>
                <th className="border p-3 text-left font-bold">가입확인</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="border p-3">{member.branch}</td>
                  <td className="border p-3">{member.name}</td>
                  <td className="border p-3">{member.phone}</td>
                  <td className="border p-3">{member.user_type}</td>
                  <td className="border p-3">{member.email}</td>
                  <td className="border p-3">{member.confirmName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => onNavigate('main')}
            className="flex-1 py-3 font-bold rounded-lg"
            style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white' }}
          >
            나가기
          </button>
        </div>
      </div>
    </div>
  )
}

// 근무일지 페이지
const WorkLogPage = ({ user, onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-6">
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#249689' }}>SM점장 근무일지</h1>
        <p>근무일지 작성 페이지입니다.</p>
        <button
          onClick={() => onNavigate('main')}
          className="mt-6 px-6 py-3 font-bold rounded-lg"
          style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white' }}
        >
          돌아가기
        </button>
      </div>
    </div>
  )
}

// 판매관리 페이지
const SalesPage = ({ user, onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-6">
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#249689' }}>판매고객관리</h1>
        <p>판매 관리 페이지입니다.</p>
        <button
          onClick={() => onNavigate('main')}
          className="mt-6 px-6 py-3 font-bold rounded-lg"
          style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white' }}
        >
          돌아가기
        </button>
      </div>
    </div>
  )
}

// 프로필 페이지
const ProfilePage = ({ user, onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-6">
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#249689' }}>내 정보관리</h1>
        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-bold">이름</label>
            <input type="text" value={user?.name || ''} readOnly className="w-full px-4 py-2 border bg-gray-50" style={{ borderRadius: '10px' }} />
          </div>
          <div>
            <label className="block mb-2 font-bold">이메일</label>
            <input type="text" value={user?.email || ''} readOnly className="w-full px-4 py-2 border bg-gray-50" style={{ borderRadius: '10px' }} />
          </div>
          <div>
            <label className="block mb-2 font-bold">지점</label>
            <input type="text" value={user?.branch || ''} readOnly className="w-full px-4 py-2 border bg-gray-50" style={{ borderRadius: '10px' }} />
          </div>
        </div>
        <button
          onClick={() => onNavigate('main')}
          className="mt-6 px-6 py-3 font-bold rounded-lg"
          style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white' }}
        >
          돌아가기
        </button>
      </div>
    </div>
  )
}

// 메인 App
const App = () => {
  const [currentPage, setCurrentPage] = useState('hero')
  const [currentUser, setCurrentUser] = useState(null)

  console.log('📍 Current Page:', currentPage)
  console.log('👤 Current User:', currentUser)

  const handleLogin = (user) => {
    console.log('🔐 Login')
    setCurrentUser(user)
    setCurrentPage('main')
  }

  const handleLogout = () => {
    console.log('🚪 Logout')
    setCurrentUser(null)
    setCurrentPage('hero')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');
        * { font-family: 'Noto Sans KR', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
        input::placeholder { color: #9ca3af; }
      `}</style>

      {currentPage === 'hero' && <HeroPage onNavigate={setCurrentPage} />}
      {currentPage === 'login' && <LoginPage onNavigate={setCurrentPage} onLogin={handleLogin} />}
      {currentPage === 'signup' && <SignupPage onNavigate={setCurrentPage} />}
      {currentPage === 'main' && <MainPage user={currentUser} onNavigate={setCurrentPage} onLogout={handleLogout} />}
      {currentPage === 'memberManagement' && <MemberManagementPage user={currentUser} onNavigate={setCurrentPage} />}
      {currentPage === 'worklog' && <WorkLogPage user={currentUser} onNavigate={setCurrentPage} />}
      {currentPage === 'sales' && <SalesPage user={currentUser} onNavigate={setCurrentPage} />}
      {currentPage === 'profile' && <ProfilePage user={currentUser} onNavigate={setCurrentPage} />}
    </>
  )
}

export default App