import { useState } from 'react'
import { Mail, Lock, Shield, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { LOGIN_MODES } from '../constants/roles'

export default function Login({ onNavigate, onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loginMode, setLoginMode] = useState(LOGIN_MODES.STAFF)
  const [userInfo, setUserInfo] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  
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
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { email, password } = formData

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      setLoading(false)
      return
    }

    try {
      const { data: users, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single()

      if (queryError || !users) {
        setError('이메일 또는 비밀번호가 일치하지 않습니다.')
        setLoading(false)
        return
      }

      if (users.status === 'pending') {
        setError('승인 대기 중입니다. 관리자 승인 후 로그인하실 수 있습니다.')
        setLoading(false)
        return
      }

      if (users.status === 'rejected') {
        setError('가입이 거부되었습니다. 관리자에게 문의해주세요.')
        setLoading(false)
        return
      }

      console.log('✅ 로그인 성공:', users)
      
      // 점장이면 모드 선택 화면으로
      if (users.is_branch_manager) {
        setUserInfo(users)
        setLoading(false)
        return
      }
      
      // 일반 사용자는 바로 로그인
      onLogin({ ...users, loginMode: LOGIN_MODES.STAFF })
      
    } catch (err) {
      console.error('❌ 로그인 오류:', err)
      setError('로그인 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  const handleModeSelect = () => {
    if (userInfo) {
      onLogin({ ...userInfo, loginMode })
    }
  }

  // 점장 모드 선택 화면
  if (userInfo && userInfo.is_branch_manager) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#e6f7f5' }}>
              <Shield size={32} style={{ color: '#249689' }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#249689' }}>
              로그인 모드 선택
            </h2>
            <p className="text-gray-600" style={{ fontSize: '15px' }}>
              <span className="font-bold">{userInfo.name}</span>님, 어떤 업무를 진행하시겠습니까?
            </p>
          </div>

          <div className="space-y-4">
            {/* 일반 업무 모드 */}
            <button
              onClick={() => setLoginMode(LOGIN_MODES.STAFF)}
              className={`w-full p-6 border-2 rounded-lg transition-all ${
                loginMode === LOGIN_MODES.STAFF 
                  ? 'bg-teal-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{ 
                borderRadius: '10px',
                borderColor: loginMode === LOGIN_MODES.STAFF ? '#249689' : undefined
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center`}
                  style={{ 
                    borderColor: loginMode === LOGIN_MODES.STAFF ? '#249689' : '#d1d5db'
                  }}
                >
                  {loginMode === LOGIN_MODES.STAFF && (
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#249689' }} />
                  )}
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User size={20} style={{ color: '#249689' }} />
                    <h3 className="font-bold text-lg" style={{ color: '#000000' }}>
                      일반 업무
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    근무일지 작성, 판매 입력 등
                  </p>
                </div>
              </div>
            </button>

            {/* 관리자 모드 */}
            <button
              onClick={() => setLoginMode(LOGIN_MODES.MANAGER)}
              className={`w-full p-6 border-2 rounded-lg transition-all ${
                loginMode === LOGIN_MODES.MANAGER 
                  ? 'bg-purple-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{ 
                borderRadius: '10px',
                borderColor: loginMode === LOGIN_MODES.MANAGER ? '#8b5cf6' : undefined
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center`}
                  style={{ 
                    borderColor: loginMode === LOGIN_MODES.MANAGER ? '#8b5cf6' : '#d1d5db'
                  }}
                >
                  {loginMode === LOGIN_MODES.MANAGER && (
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
                  )}
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield size={20} style={{ color: '#8b5cf6' }} />
                    <h3 className="font-bold text-lg" style={{ color: '#000000' }}>
                      지점 관리
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    직원 관리, 통계 조회 등
                  </p>
                </div>
              </div>
            </button>
          </div>

          <button
            onClick={handleModeSelect}
            className="w-full mt-6 py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: loginMode === LOGIN_MODES.MANAGER ? '#8b5cf6' : '#249689', borderRadius: '10px', fontSize: '15px' }}
          >
            {loginMode === LOGIN_MODES.MANAGER ? '🛡️ 관리자로 시작하기' : '👤 일반 업무 시작하기'}
          </button>

          <button
            onClick={() => {
              setUserInfo(null)
              setLoginMode(LOGIN_MODES.STAFF)
            }}
            className="w-full mt-2 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            style={{ fontSize: '15px' }}
          >
            ← 다른 계정으로 로그인
          </button>
        </div>
      </div>
    )
  }

  // 일반 로그인 폼
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start p-2 pt-12">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <p className="text-center mb-4 font-bold" style={{ color: '#249689', fontSize: '15px' }}>
          LAS 매장관리 시스템에 오신것을 환영합니다.
        </p>

        <div className="flex items-center justify-center mb-4 gap-2">
          <img 
            src="/images/logo.png" 
            alt="LAS Logo" 
            className="h-10 w-10 object-cover"
            onError={(e) => e.target.style.display = 'none'}
          />
          <h1 className="text-4xl font-bold" style={{ color: '#249689' }}>
            로그인
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              <Mail size={18} />
              이메일
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="이메일을 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 focus:border-teal-500 focus:outline-none"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              <Lock size={18} />
              비밀번호
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 focus:border-teal-500 focus:outline-none"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#249689', fontSize: '15px' }}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('hero')}
              className="flex-1 py-2.5 font-bold rounded-lg hover:bg-gray-50 transition-colors"
              style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', fontSize: '15px' }}
            >
              취소
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p style={{ color: '#000000', fontSize: '15px' }}>
            아직 회원이 아니신가요?{' '}
            <button
              onClick={() => onNavigate('signup')}
              className="font-bold underline hover:opacity-80"
              style={{ color: '#249689' }}
            >
              회원가입하기
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}