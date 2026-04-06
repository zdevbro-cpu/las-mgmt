import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login({ onNavigate, onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Supabase Auth로 로그인 시도 (v1 정석 방식: object-based)
      const { user: authUser, error: authError } = await supabase.auth.signIn({
        email,
        password
      })

      if (authError) {
        alert('이메일 또는 비밀번호가 올바르지 않습니다.\n\n오류: ' + authError.message)
        return
      }

      // 2. users 테이블에서 추가 프로필 정보 조회
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_uid', authUser.id)
        .single()

      if (userError || !userData) {
        alert('사용자 정보를 불러올 수 없습니다.\n\n오류: ' + (userError?.message || 'auth_uid 매칭 실패') + '\nUID: ' + authUser.id)
        return
      }

      // 승인 상태 확인
      if (userData.status !== 'approved') {
        alert('관리자 승인 대기 중입니다. 승인 후 로그인이 가능합니다.')
        await supabase.auth.signOut()
        return
      }

      // 로그인 성공
      onLogin(userData)

    } catch (error) {
      console.error('로그인 오류:', error)
      alert('로그인에 실패했습니다: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center p-4 pt-4" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <p className="text-sm mb-4" style={{ color: '#249689' }}>
            LAS 매장관리 시스템에 오신것을 환영합니다.
          </p>
          <div className="flex items-center justify-center gap-3">
            <img 
              src="/images/logo.png" 
              alt="LAS Book Logo" 
              className="h-16"
            />
            <h1 className="text-3xl font-bold" style={{ color: '#249689' }}>로그인</h1>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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

          {/* 비밀번호 */}
          <div>
            <label className="flex items-center gap-2 mb-1 font-bold" style={{ fontSize: '15px' }}>
              <span>🔒</span>
              <span>비밀번호</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              className="w-full px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            />
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-white hover:opacity-90 mt-6"
            style={{ backgroundColor: '#249689', fontSize: '16px' }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          {/* 취소 버튼 */}
          <button
            type="button"
            onClick={() => onNavigate('hero')}
            className="w-full py-3 rounded-lg font-bold border-2 hover:bg-gray-50"
            style={{ borderColor: '#cccccc', fontSize: '16px' }}
          >
            취소
          </button>
        </form>

        <div className="mt-4 text-center">
          <p style={{ color: '#666666', fontSize: '13px' }}>
            아직 직원등록 전 이신가요?{' '}
            <button
              onClick={() => onNavigate('signup')}
              className="font-bold hover:underline"
              style={{ color: '#249689' }}
            >
              직원등록 가기
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}