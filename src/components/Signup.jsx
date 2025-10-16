import { useState } from 'react'
import { Mail, Lock, Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Signup({ onNavigate }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    branch: '',
    phone: '',
    userType: '점주'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    
    const { email, password, passwordConfirm, name, branch, phone, userType } = formData

    // 유효성 검사
    if (!email || !password || !passwordConfirm || !name || !branch || !phone) {
      setError('모든 항목을 입력해주세요.')
      setLoading(false)
      return
    }

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      setLoading(false)
      return
    }

    try {
      // 1. 이메일 중복 확인
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single()

      if (existingUsers) {
        setError('이미 등록된 이메일입니다.')
        setLoading(false)
        return
      }

      // 2. 새 사용자 생성 (승인 대기 상태)
      const newUser = {
        id: Date.now().toString(),
        email,
        password,
        name,
        branch,
        phone,
        user_type: userType,
        status: 'pending', // 승인 대기
        created_at: new Date().toISOString(),
        approved_at: null
      }

      const { data, error: insertError } = await supabase
        .from('users')
        .insert([newUser])
        .select()

      if (insertError) {
        console.error('Supabase 저장 오류:', insertError)
        setError('회원가입 중 오류가 발생했습니다: ' + insertError.message)
        setLoading(false)
        return
      }

      // 3. 성공 메시지
      console.log('회원가입 성공:', data)
      alert(
        `회원가입 신청이 완료되었습니다!\n\n` +
        `관리자 승인 후 로그인이 가능합니다.\n` +
        `승인 요청이 관리자에게 전송되었습니다.\n\n` +
        `이메일: ${email}\n` +
        `구분: ${userType}`
      )
      
      onNavigate('login')
    } catch (err) {
      console.error('회원가입 오류:', err)
      setError('회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-2">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        {/* 안내 텍스트 */}
        <p className="text-center mb-2" style={{ color: '#249689', fontSize: '15px' }}>
          LAS 매장관리 시스템에 오신것을 환영합니다.
        </p>

        {/* 로고 + 타이틀 */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          <img 
            src="/images/logo.png" 
            alt="LAS Logo" 
            className="w-10 h-10 object-cover"
            onError={(e) => e.target.style.display = 'none'}
          />
          <h1 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
            회원가입
          </h1>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 회원가입 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이메일 */}
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
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>

          {/* 비밀번호 */}
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
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="flex items-center gap-1.5 mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              <Lock size={18} />
              비밀번호 확인
            </label>
            <input
              type="password"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              placeholder="비밀번호를 확인하세요"
              className="w-full px-4 py-2 border border-gray-300 focus:border-teal-500 focus:outline-none"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>

          {/* 이름 */}
          <div>
            <label className="mb-2 font-bold block" style={{ color: '#000000', fontSize: '15px' }}>
              이름
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 focus:border-teal-500 focus:outline-none"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>

          {/* 지점명 */}
          <div>
            <label className="mb-2 font-bold block" style={{ color: '#000000', fontSize: '15px' }}>
              지점명
            </label>
            <input
              type="text"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              placeholder="지점명을 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 focus:border-teal-500 focus:outline-none"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>

          {/* 핸드폰 */}
          <div>
            <label className="flex items-center gap-1.5 mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              <Phone size={18} />
              핸드폰 번호를 입력하세요
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="핸드폰 번호를 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 focus:border-teal-500 focus:outline-none"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>

          {/* 구분 */}
          <div>
            <label className="mb-2 font-bold block" style={{ color: '#000000', fontSize: '15px' }}>
              구분
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="userType"
                  value="점주"
                  checked={formData.userType === '점주'}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span style={{ color: '#000000', fontSize: '15px' }}>점주</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="userType"
                  value="점장"
                  checked={formData.userType === '점장'}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span style={{ color: '#000000', fontSize: '15px' }}>점장</span>
              </label>
            </div>
          </div>

          {/* 버튼들 */}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 py-2.5 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              회원가입
            </button>
            <button
              type="button"
              onClick={() => onNavigate('hero')}
              className="flex-1 py-2.5 font-bold rounded-lg hover:bg-gray-50 transition-colors"
              style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
            >
              취소
            </button>
          </div>
        </form>

        {/* 로그인 링크 */}
        <div className="mt-6 text-center">
          <p style={{ color: '#000000', fontSize: '15px' }}>
            회원 가입하셨나요?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="font-bold underline hover:opacity-80"
              style={{ color: '#249689' }}
            >
              로그인 하기
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}