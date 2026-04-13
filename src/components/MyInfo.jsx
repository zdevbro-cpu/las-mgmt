import React, { useState, useEffect } from 'react'
import { ArrowLeft, User, Mail, Building2, Briefcase, Phone, Edit2, Lock, QrCode, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { generateReferralCode } from '../constants/roles'

export default function MyInfo({ user, onBack, onNavigate }) {
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    fetchUserInfo()
  }, [user])

  const fetchUserInfo = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      console.log('✅ 사용자 정보 로드:', data)
      setUserInfo(data)
      setFormData({
        name: data.name || '',
        phone: data.phone || ''
      })
    } catch (err) {
      console.error('❌ 사용자 정보 조회 오류:', err)
      alert('사용자 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('이름을 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone: formData.phone
        })
        .eq('id', user.id)

      if (error) throw error

      alert('정보가 수정되었습니다.')
      setEditing(false)
      fetchUserInfo()
    } catch (err) {
      console.error('정보 수정 오류:', err)
      alert('정보 수정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSave = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('모든 비밀번호 필드를 입력해주세요.')
      return
    }

    if (newPassword.length < 6) {
      alert('새 비밀번호는 6자 이상이어야 합니다.')
      return
    }

    if (newPassword !== confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.')
      return
    }

    setLoading(true)
    try {
      // 1. 현재 비밀번호 확인을 위해 Supabase Auth로 로그인 시도 (재인증)
      const { error: authCheckError } = await supabase.auth.signIn({
        email: userInfo.email,
        password: currentPassword
      })

      if (authCheckError) {
        alert('현재 비밀번호가 일치하지 않습니다.')
        setLoading(false)
        return
      }

      // 2. Auth 비밀번호 변경
      const { error: updateError } = await supabase.auth.update({ 
        password: newPassword 
      })

      if (updateError) throw updateError

      // 3. users 테이블의 password 필드도 'MIGRATED_TO_SUPABASE_AUTH'로 확실히 하여 보안 강화 및 정합성 유지
      await supabase
        .from('users')
        .update({ password: 'MIGRATED_TO_SUPABASE_AUTH' })
        .eq('id', user.id)

      alert('비밀번호가 변경되었습니다.')
      setChangingPassword(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (err) {
      console.error('비밀번호 변경 오류:', err)
      alert('비밀번호 변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelPasswordChange = () => {
    setChangingPassword(false)
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  const handleGenerateCode = async () => {
    if (loading) return
    if (!window.confirm('나만의 홍보용 고유번호를 발급받으시겠습니까?')) return

    setLoading(true)
    try {
      // 1. 기존 코드 전체 조회 (중복 방지용)
      const { data: allUsers, error: fetchError } = await supabase
        .from('users')
        .select('referral_code')
        .not('referral_code', 'is', null)

      if (fetchError) throw fetchError

      const existingCodes = allUsers.map(u => u.referral_code)
      
      // 2. 새 코드 생성
      const newCode = generateReferralCode(userInfo, existingCodes)
      
      if (!newCode) {
        throw new Error('고유번호 생성에 실패했습니다. 관리자에게 문의하세요.')
      }

      // 3. DB 업데이트
      const { error: updateError } = await supabase
        .from('users')
        .update({ referral_code: newCode })
        .eq('id', user.id)

      if (updateError) throw updateError

      alert(`고유번호가 발급되었습니다: ${newCode}\n이제 수학편지 홍보용 QR과 링크를 사용할 수 있습니다.`)
      fetchUserInfo()
    } catch (err) {
      console.error('고유번호 발급 오류:', err)
      alert(err.message || '고유번호 발급에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !userInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#249689' }}></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-center min-h-screen bg-gray-50 p-2">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mt-10">
        <div className="flex items-center justify-center gap-1.5 mb-4">
          <img 
            src="/images/logo.png" 
            alt="LAS Logo" 
            className="w-10 h-10 object-cover"
            onError={(e) => e.target.style.display = 'none'}
          />
          <h1 className="font-bold" style={{ color: '#249689', fontSize: '28px' }}>
            내 정보관리
          </h1>
        </div>

        <div className="space-y-4">
          {/* 이메일 */}
          <div>
            <label className="flex items-center gap-1.5 mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              <Mail size={18} />
              이메일
            </label>
            <input
              type="text"
              value={userInfo?.email || '-'}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>

          {/* 이름 */}
          <div>
            <label className="flex items-center gap-1.5 mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              <User size={18} />
              이름
            </label>
            {editing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 focus:border-teal-500 focus:outline-none"
                style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
              />
            ) : (
              <input
                type="text"
                value={userInfo?.name || '-'}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
              />
            )}
          </div>

          {/* 전화번호 */}
          <div>
            <label className="flex items-center gap-1.5 mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              <Phone size={18} />
              전화번호
            </label>
            {editing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 focus:border-teal-500 focus:outline-none"
                style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
              />
            ) : (
              <input
                type="text"
                value={userInfo?.phone || '-'}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
              />
            )}
          </div>

          {/* 지점 */}
          <div>
            <label className="flex items-center gap-1.5 mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              <Building2 size={18} />
              지점
            </label>
            <input
              type="text"
              value={userInfo?.branch || '-'}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>

          {/* 구분 */}
          <div>
            <label className="flex items-center gap-1.5 mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              <Briefcase size={18} />
              구분
            </label>
            <input
              type="text"
              value={userInfo?.user_type || '-'}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>

          {/* 고유코드 영역 */}
          <div className="mt-2">
            <label className="flex items-center gap-1.5 mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              <QrCode size={18} />
              홍보용 고유코드
            </label>
            
            {userInfo?.referral_code ? (
              <div 
                className="w-full px-4 py-3 border-2 font-bold flex items-center justify-between"
                style={{ 
                  borderRadius: '10px', 
                  backgroundColor: '#D1FAE5',
                  borderColor: '#14B8A6',
                  color: '#0D9488',
                  fontSize: '16px',
                  letterSpacing: '1px'
                }}
              >
                {userInfo.referral_code}
                <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-teal-200 uppercase">Active</span>
              </div>
            ) : (
              <button
                onClick={handleGenerateCode}
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-dashed border-teal-400 text-teal-600 font-bold flex items-center justify-center gap-2 hover:bg-teal-50 transition-colors"
                style={{ borderRadius: '10px', fontSize: '15px' }}
              >
                <Sparkles size={18} />
                {loading ? '발급 중...' : '홍보용 고유코드 발급받기'}
              </button>
            )}
            
            <p className="text-xs text-gray-500 mt-2 ml-1">
              {userInfo?.referral_code 
                ? '* 이벤트(수학편지) 홍보 시 이 코드가 링크에 포함됩니다.' 
                : '* 수학편지 홍보를 위해 먼저 고유번호를 발급받아 주세요.'}
            </p>
          </div>

          {/* 버튼 영역 */}
          <div className="mt-6 space-y-2.5">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#4A9B8E', borderRadius: '10px', fontSize: '15px' }}
                >
                  {loading ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setFormData({
                      name: userInfo.name || '',
                      phone: userInfo.phone || ''
                    })
                  }}
                  className="w-full py-3 font-bold rounded-lg transition-colors"
                  style={{ color: '#000000', border: '2px solid #A5AEE3', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
                >
                  취소
                </button>
              </>
            ) : changingPassword ? (
              <div className="space-y-2.5">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                  <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: '#000000', fontSize: '15px' }}>
                    <Lock size={18} />
                    비밀번호 변경
                  </h3>
                </div>
                <div>
                  <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '14px' }}>
                    현재 비밀번호 *
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                    placeholder="••••••"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '14px' }}>
                    새 비밀번호 *
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                    placeholder="새 비밀번호 (6자 이상)"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '14px' }}>
                    새 비밀번호 확인 *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                    placeholder="새 비밀번호 다시 입력하세요"
                  />
                </div>
                <button
                  onClick={handlePasswordSave}
                  disabled={loading}
                  className="w-full py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#4A9B8E', borderRadius: '10px', fontSize: '15px' }}
                >
                  {loading ? '변경 중...' : '비밀번호 변경'}
                </button>
                <button
                  onClick={handleCancelPasswordChange}
                  className="w-full py-3 font-bold rounded-lg transition-colors"
                  style={{ color: '#000000', border: '2px solid #A5AEE3', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
                >
                  취소
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="w-full py-3 flex items-center justify-center gap-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#4A9B8E', borderRadius: '10px', fontSize: '15px' }}
                >
                  <Edit2 size={18} />
                  정보 수정
                </button>

                {/* 수학편지/이벤트 QR 관리 버튼 */}
                <button
                  onClick={() => onNavigate('MyQRCode')}
                  className="w-full py-3.5 flex items-center justify-center gap-2 font-bold rounded-lg hover:opacity-90 transition-opacity"
                  style={{ 
                    color: 'white', 
                    border: 'none', 
                    backgroundColor: '#1E5A6A', 
                    borderRadius: '10px', 
                    fontSize: '16px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                >
                  <QrCode size={20} />
                  수학편지 홍보 QR / 링크 관리
                </button>

                <button
                  onClick={() => setChangingPassword(true)}
                  className="w-full py-3 flex items-center justify-center gap-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#8B8FD9', borderRadius: '10px', fontSize: '15px' }}
                >
                  <Lock size={18} />
                  비밀번호 변경
                </button>

                <button
                  onClick={onBack}
                  className="w-full py-3 flex items-center justify-center gap-2 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ color: '#000000', border: '2px solid #A5AEE3', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
                >
                  <ArrowLeft size={18} />
                  나가기
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}