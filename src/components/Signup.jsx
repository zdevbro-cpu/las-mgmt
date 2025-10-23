import React, { useState, useEffect } from 'react'
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
    userType: '모니터링요원'
  })
  const [branches, setBranches] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingBranches, setLoadingBranches] = useState(true)

  useEffect(() => {
    loadBranches()
  }, [])

  const loadBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      setBranches(data || [])
    } catch (err) {
      console.error('지점 목록 로드 오류:', err)
      setError('지점 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoadingBranches(false)
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

      // 2. 고유번호(referral_code) 생성
      // 사용자 유형별 범위 설정
      const rangeMap = {
        '직원': { min: 1000, max: 2999, prefix: 'LAS' },
        '점주': { min: 1000, max: 2999, prefix: 'LAS' },
        '점장': { min: 1000, max: 2999, prefix: 'LAS' },
        '모니터링요원': { min: 3000, max: 4999, prefix: 'LAS' },
        '계약근무': { min: 5000, max: 6999, prefix: 'LAS' }
      }

      const range = rangeMap[userType] || { min: 1000, max: 2999, prefix: 'LAS' }

      // 해당 유형의 마지막 사용자 ID 조회
      const { data: lastUserCode } = await supabase
        .from('users')
        .select('referral_code')
        .eq('user_type', userType)
        .not('referral_code', 'is', null)
        .order('referral_code', { ascending: false })
        .limit(1)

      let nextNumber = range.min

      if (lastUserCode && lastUserCode.length > 0) {
        // 마지막 코드에서 숫자 추출
        const lastCode = lastUserCode[0].referral_code
        const lastNumber = parseInt(lastCode.replace(range.prefix, ''))
        
        if (lastNumber >= range.min && lastNumber < range.max) {
          nextNumber = lastNumber + 1
        }
      }

      // 범위 초과 확인
      if (nextNumber > range.max) {
        setError(`${userType} 유형의 고유번호가 모두 사용되었습니다. 관리자에게 문의하세요.`)
        setLoading(false)
        return
      }

      const referralCode = range.prefix + String(nextNumber).padStart(4, '0')
      const newUserId = Date.now().toString()

      // 3. 새 사용자 생성 (승인 대기 상태)
      const newUser = {
        id: newUserId,
        email,
        password,
        name,
        branch,
        phone,
        user_type: userType,
        referral_code: referralCode,
        status: 'pending',
        created_at: new Date().toISOString(),
        approved_at: null
      }

      const { data, error: insertError } = await supabase
        .from('users')
        .insert([newUser])
        .select()

      if (insertError) {
        console.error('Supabase 저장 오류:', insertError)
        setError('직원가입 중 오류가 발생했습니다: ' + insertError.message)
        setLoading(false)
        return
      }

      // 4. 성공 메시지
      console.log('직원가입 성공:', data)
      alert(
        `직원가입 신청이 완료되었습니다!\n\n` +
        `관리자 승인 후 로그인이 가능합니다.\n` +
        `승인 요청이 관리자에게 전송되었습니다.\n\n` +
        `이메일: ${email}\n` +
        `지점: ${branch}\n` +
        `구분: ${userType}\n` +
        `고유번호: ${referralCode}\n\n` +
        `💡 고유번호는 이벤트 참가자 추천 시 사용됩니다.`
      )
      
      onNavigate('login')
    } catch (err) {
      console.error('직원가입 오류:', err)
      setError('직원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-start justify-center min-h-screen bg-gray-50 p-2">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mt-10">
        <p className="text-center mb-2" style={{ color: '#249689', fontSize: '15px' }}>
          LAS 매장관리 시스템에 오신것을 환영합니다.
        </p>

        <div className="flex items-center justify-center gap-1.5 mb-4">
          <img 
            src="/images/logo.png" 
            alt="LAS Logo" 
            className="w-10 h-10 object-cover"
            onError={(e) => e.target.style.display = 'none'}
          />
          <h1 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
            직원가입
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
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
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
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>

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

          <div>
            <label className="mb-2 font-bold block" style={{ color: '#000000', fontSize: '15px' }}>
              지점명
            </label>
            {loadingBranches ? (
              <div className="w-full px-4 py-2 border border-gray-300 bg-gray-50 text-gray-400" style={{ borderRadius: '10px', fontSize: '15px' }}>
                지점 목록 불러오는 중...
              </div>
            ) : branches.length === 0 ? (
              <div className="w-full px-4 py-2 border border-red-300 bg-red-50 text-red-600" style={{ borderRadius: '10px', fontSize: '14px' }}>
                등록된 지점이 없습니다. 관리자에게 문의하세요.
              </div>
            ) : (
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 focus:border-teal-500 focus:outline-none"
                style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
              >
                <option value="">지점을 선택하세요</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="flex items-center gap-1.5 mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              <Phone size={18} />
              핸드폰 번호
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

          <div>
            <label className="mb-2 font-bold block" style={{ color: '#000000', fontSize: '15px' }}>
              구분
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="userType"
                  value="모니터링요원"
                  checked={formData.userType === '모니터링요원'}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span style={{ color: '#000000', fontSize: '14px' }}>모니터링요원</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="userType"
                  value="계약근무"
                  checked={formData.userType === '계약근무'}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span style={{ color: '#000000', fontSize: '14px' }}>계약근무</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="userType"
                  value="점주"
                  checked={formData.userType === '점주'}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span style={{ color: '#000000', fontSize: '14px' }}>점주</span>
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
                <span style={{ color: '#000000', fontSize: '14px' }}>점장</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading || loadingBranches || branches.length === 0}
              className="flex-1 py-2.5 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              {loading ? '처리 중...' : '직원가입'}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('hero')}
              className="flex-1 py-2.5 font-bold rounded-lg hover:bg-gray-50 transition-colors"
              style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
            >
              나가기
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p style={{ color: '#000000', fontSize: '15px' }}>
            직원 가입하셨나요?{' '}
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