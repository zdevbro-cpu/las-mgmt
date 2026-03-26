import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Signup({ onNavigate }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [brname, setBrname] = useState('')
  const [phone, setPhone] = useState('')
  const [userType, setUserType] = useState('점주')
  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState([])
  
  // 급여 정보 (선택사항)
  const [showSalaryInfo, setShowSalaryInfo] = useState(false)
  const [ssn, setSsn] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [accountNumber, setAccountNumber] = useState('')

  useEffect(() => {
    loadBranches()
  }, [])

  const loadBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('name')
        .order('name', { ascending: true })

      if (error) throw error
      setBranches(data || [])
    } catch (err) {
      console.error('지점 목록 로드 오류:', err)
    }
  }

  // 전화번호 자동 포맷팅 (000-0000-0000)
  const formatPhone = (value) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

  // 주민등록번호 자동 포맷팅 (000000-0000000)
  const formatSSN = (value) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 6) return numbers
    return `${numbers.slice(0, 6)}-${numbers.slice(6, 13)}`
  }

  const handleSSNChange = (e) => {
    const formatted = formatSSN(e.target.value)
    setSsn(formatted)
    
    // 13자리 유효성 검사
    if (formatted.replace(/-/g, '').length === 13) {
      // 유효성 검사는 통과
    } else if (formatted.replace(/-/g, '').length > 0) {
      // 입력 중이지만 아직 13자리가 아닌 경우
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    // 주민등록번호 유효성 검사 (입력했을 경우만)
    if (ssn && ssn.replace(/-/g, '').length !== 13) {
      alert('주민등록번호는 13자리여야 합니다.')
      return
    }

    setLoading(true)

    try {
      // 1. 추천인 코드 생성
      const { data: existingCodes } = await supabase
        .from('users')
        .select('referral_code')
        .not('referral_code', 'is', null)
        .order('referral_code', { ascending: false })

      let newCode = 'LAS001'
      if (existingCodes && existingCodes.length > 0) {
        const lastCode = existingCodes[0].referral_code
        const numericPart = parseInt(lastCode.replace('LAS', ''))
        const nextNumber = numericPart + 1
        newCode = `LAS${String(nextNumber).padStart(3, '0')}`
      }

      // 2. Supabase Auth 회원가입
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            full_name: name,
          }
        }
      })

      if (authError) throw authError

      // 3. users 테이블에 프로필 저장
      const phoneNumbers = phone.replace(/-/g, '')
      const ssnNumbers = ssn ? ssn.replace(/-/g, '') : null
      
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            auth_uid: authData.user.id,
            email,
            password: 'MIGRATED_TO_SUPABASE_AUTH', // 보안 위해 마커만 저장
            name,
            branch: brname,
            phone: phoneNumbers,
            user_type: userType,
            status: 'pending',
            referral_code: newCode,
            ssn: ssnNumbers,
            bank_name: bankName || null,
            account_holder: accountHolder || null,
            account_number: accountNumber || null
          }
        ])

      if (insertError) throw insertError

      alert('직원등록이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.')
      onNavigate('login')

    } catch (error) {
      console.error('직원등록 오류:', error)
      alert('직원등록 중 오류가 발생했습니다: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center p-4 pt-4" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-4">
          <p className="text-sm mb-3" style={{ color: '#249689' }}>
            LAS 매장관리 시스템에 오신것을 환영합니다.
          </p>
          <div className="flex items-center justify-center gap-3">
            <img 
              src="/images/logo.png" 
              alt="LAS Book Logo" 
              className="h-12"
            />
            <h1 className="text-2xl font-bold" style={{ color: '#249689' }}>직원등록</h1>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-3">
          {/* 이메일 */}
          <div>
            <label className="flex items-center gap-2 mb-1 font-bold" style={{ fontSize: '15px' }}>
              <span>📧</span>
              <span>이메일</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              required
              className="w-full px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            />
          </div>

          {/* 비밀번호와 비밀번호 확인 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-2 mb-1 font-bold" style={{ fontSize: '15px' }}>
                <span>🔒</span>
                <span>비밀번호</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                required
                className="w-full px-4 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '15px' }}
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 mb-1 font-bold" style={{ fontSize: '15px' }}>
                <span>🔒</span>
                <span>비밀번호 확인</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 확인"
                required
                className="w-full px-4 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '15px' }}
              />
            </div>
          </div>

          {/* 이름과 핸드폰 번호 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-2 mb-1 font-bold" style={{ fontSize: '15px' }}>
                <span>👤</span>
                <span>이름</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름"
                required
                className="w-full px-4 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '15px' }}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-1 font-bold" style={{ fontSize: '15px' }}>
                <span>📱</span>
                <span>핸드폰 번호</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="000-0000-0000"
                required
                className="w-full px-4 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '15px' }}
              />
            </div>
          </div>

          {/* 지정명 (지점) */}
          <div>
            <label className="flex items-center gap-2 mb-1 font-bold" style={{ fontSize: '15px' }}>
              <span>🏢</span>
              <span>지정명</span>
            </label>
            <select
              value={brname}
              onChange={(e) => setBrname(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            >
              <option value="">지정명을 선택하세요</option>
              {branches.map((branch) => (
                <option key={branch.name} value={branch.name}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          {/* 구분 - 4개로 수정 */}
          <div>
            <label className="flex items-center gap-2 mb-1 font-bold" style={{ fontSize: '15px' }}>
              <span>🏷️</span>
              <span>구분</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="모니터링요원"
                  checked={userType === '모니터링요원'}
                  onChange={(e) => setUserType(e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: '#249689' }}
                />
                <span style={{ fontSize: '15px' }}>모니터링요원</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="계약근무"
                  checked={userType === '계약근무'}
                  onChange={(e) => setUserType(e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: '#249689' }}
                />
                <span style={{ fontSize: '15px' }}>계약근무</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="점주"
                  checked={userType === '점주'}
                  onChange={(e) => setUserType(e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: '#249689' }}
                />
                <span style={{ fontSize: '15px' }}>점주</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="점장"
                  checked={userType === '점장'}
                  onChange={(e) => setUserType(e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: '#249689' }}
                />
                <span style={{ fontSize: '15px' }}>점장</span>
              </label>
            </div>
          </div>

          {/* 급여 정보 (선택사항) */}
          <div className="border-t pt-3 mt-4">
            <button
              type="button"
              onClick={() => setShowSalaryInfo(!showSalaryInfo)}
              className="w-full flex items-center justify-between p-3 rounded-lg border-2 hover:bg-gray-50"
              style={{ borderColor: '#249689', fontSize: '15px' }}
            >
              <span className="font-bold" style={{ color: '#249689' }}>
                💰 급여 정보 (선택)
              </span>
              <span style={{ color: '#249689' }}>
                {showSalaryInfo ? '▲' : '▼'}
              </span>
            </button>

            {showSalaryInfo && (
              <div className="mt-3 space-y-3">
                {/* 주민등록번호 */}
                <div>
                  <label className="flex items-center gap-2 mb-1 font-bold" style={{ fontSize: '15px', color: '#666' }}>
                    <span>🆔</span>
                    <span>주민등록번호 (선택)</span>
                  </label>
                  <input
                    type="text"
                    value={ssn}
                    onChange={handleSSNChange}
                    placeholder="000000-0000000"
                    maxLength="14"
                    className="w-full px-4 py-2 border border-gray-300"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                  />
                  {ssn && ssn.replace(/-/g, '').length > 0 && ssn.replace(/-/g, '').length !== 13 && (
                    <p className="text-sm mt-1" style={{ color: '#e74c3c' }}>
                      ⚠️ 주민등록번호는 13자리여야 합니다.
                    </p>
                  )}
                </div>

                {/* 예금주와 기관명 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-2 mb-1 font-bold" style={{ fontSize: '15px', color: '#666' }}>
                      <span>👤</span>
                      <span>예금주 (선택)</span>
                    </label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      placeholder="예금주"
                      className="w-full px-4 py-2 border border-gray-300"
                      style={{ borderRadius: '10px', fontSize: '15px' }}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 mb-1 font-bold" style={{ fontSize: '15px', color: '#666' }}>
                      <span>🏦</span>
                      <span>기관명 (선택)</span>
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="기관명"
                      className="w-full px-4 py-2 border border-gray-300"
                      style={{ borderRadius: '10px', fontSize: '15px' }}
                    />
                  </div>
                </div>

                {/* 계좌번호 */}
                <div>
                  <label className="flex items-center gap-2 mb-1 font-bold" style={{ fontSize: '15px', color: '#666' }}>
                    <span>💳</span>
                    <span>계좌번호 (선택)</span>
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="계좌번호"
                    className="w-full px-4 py-2 border border-gray-300"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* 나가기 버튼 */}
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="py-3 rounded-lg font-bold border-2 hover:bg-gray-50 flex items-center justify-center gap-2"
              style={{ borderColor: '#cccccc', fontSize: '16px' }}
            >
              <ArrowLeft size={18} />
              나가기
            </button>

            {/* 직원등록 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="py-3 rounded-lg font-bold text-white hover:opacity-90"
              style={{ backgroundColor: '#249689', fontSize: '16px' }}
            >
              {loading ? '등록 중...' : '직원등록'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p style={{ color: '#666666', fontSize: '13px' }}>
            직원등록을 하셨나요?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="font-bold hover:underline"
              style={{ color: '#249689' }}
            >
              로그인하기
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}