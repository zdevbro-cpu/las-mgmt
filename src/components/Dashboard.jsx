import { useState } from 'react'
import { LogOut, User } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Dashboard({ user, onNavigate, onLogout }) {
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [changePassword, setChangePassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    })
  }

  const handleOpenProfile = () => {
    setProfileForm({
      name: user?.name || '',
      phone: user?.phone || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setChangePassword(false)
    setShowProfileModal(true)
  }

  const handleCloseProfile = () => {
    setShowProfileModal(false)
    setChangePassword(false)
    setProfileForm({
      name: user?.name || '',
      phone: user?.phone || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  const handleSaveProfile = async () => {
    // 유효성 검사
    if (!profileForm.name.trim()) {
      alert('이름을 입력해주세요.')
      return
    }

    if (!profileForm.phone.trim()) {
      alert('전화번호를 입력해주세요.')
      return
    }

    // 비밀번호 변경 체크 시 유효성 검사
    if (changePassword) {
      if (!profileForm.currentPassword) {
        alert('현재 비밀번호를 입력해주세요.')
        return
      }

      if (!profileForm.newPassword) {
        alert('새 비밀번호를 입력해주세요.')
        return
      }

      if (profileForm.newPassword.length < 6) {
        alert('새 비밀번호는 최소 6자 이상이어야 합니다.')
        return
      }

      if (profileForm.newPassword !== profileForm.confirmPassword) {
        alert('새 비밀번호가 일치하지 않습니다.')
        return
      }

      // 현재 비밀번호 확인
      const { data: userData, error: checkError } = await supabase
        .from('users')
        .select('password')
        .eq('id', user.id)
        .single()

      if (checkError || !userData) {
        alert('사용자 정보를 확인할 수 없습니다.')
        return
      }

      if (userData.password !== profileForm.currentPassword) {
        alert('현재 비밀번호가 일치하지 않습니다.')
        return
      }
    }

    setLoading(true)

    try {
      // 업데이트할 데이터 준비
      const updateData = {
        name: profileForm.name,
        phone: profileForm.phone
      }

      // 비밀번호 변경이 체크되어 있으면 비밀번호도 업데이트
      if (changePassword) {
        updateData.password = profileForm.newPassword
        updateData.password_changed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)

      if (error) {
        console.error('정보 수정 오류:', error)
        alert('정보 수정 중 오류가 발생했습니다.')
        return
      }

      alert('정보가 성공적으로 수정되었습니다.')
      
      // 세션 정보 업데이트
      const updatedUser = { ...user, name: profileForm.name, phone: profileForm.phone }
      sessionStorage.setItem('las_current_user', JSON.stringify(updatedUser))
      
      handleCloseProfile()
      
      // 페이지 새로고침하여 업데이트된 정보 반영
      window.location.reload()
    } catch (err) {
      console.error('정보 수정 오류:', err)
      alert('정보 수정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 메인 컨텐츠 */}
      <div className="max-w-xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* 페이지 타이틀 */}
          <div className="flex items-center justify-center gap-1.5 mb-8">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-10 h-10 object-cover"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h2 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
              LAS 매장관리
            </h2>
          </div>
          
          {/* 사용자 정보 */}
          <div className="grid grid-cols-2 gap-1.5 mb-8">
            <div>
              <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                🏢 지점명
              </label>
              <input
                type="text"
                value={user?.branch || ''}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
              />
            </div>
            <div>
              <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                👤 이름
              </label>
              <input
                type="text"
                value={user?.name || ''}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
              />
            </div>
          </div>

          {/* 버튼들 */}
          <div className="space-y-4">
            <button
              onClick={() => onNavigate('workDiary')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              근무일지
            </button>
            <button
              onClick={() => onNavigate('sales')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              판매관리
            </button>
            <button
              onClick={() => onNavigate('shippingList')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              송장출력
            </button>
            <button
              onClick={() => onNavigate('purchaseHistory')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              구매이력조회
            </button>
            
            {/* 내정보관리 버튼 추가 */}
            <button
              onClick={handleOpenProfile}
              className="w-full py-4 font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
              style={{ color: '#249689', border: '2px solid #249689', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
            >
              <User size={20} />
              내정보관리
            </button>

            <button
              onClick={onLogout}
              className="w-full py-4 font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
              style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
            >
              <LogOut size={20} />
              나가기
            </button>
          </div>
        </div>
      </div>

      {/* 내정보관리 모달 */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" style={{ borderRadius: '10px' }}>
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#249689' }}>
              내정보관리
            </h2>

            <div className="space-y-4">
              {/* 이메일 (읽기 전용) */}
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  📧 이메일
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                  style={{ borderRadius: '10px', fontSize: '15px', color: '#6b7280' }}
                />
              </div>

              {/* 이름 */}
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  👤 이름 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  placeholder="이름을 입력하세요"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              {/* 전화번호 */}
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  📱 전화번호 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  placeholder="전화번호를 입력하세요"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              {/* 지점명 (읽기 전용) */}
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  🏢 지점명
                </label>
                <input
                  type="text"
                  value={user?.branch || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                  style={{ borderRadius: '10px', fontSize: '15px', color: '#6b7280' }}
                />
              </div>

              {/* 구분 (읽기 전용) */}
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  📋 구분
                </label>
                <input
                  type="text"
                  value={user?.user_type || user?.userType || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                  style={{ borderRadius: '10px', fontSize: '15px', color: '#6b7280' }}
                />
              </div>

              {/* 비밀번호 변경 체크박스 */}
              <div className="pt-4 border-t-2 border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={changePassword}
                    onChange={(e) => setChangePassword(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="font-bold" style={{ color: '#249689', fontSize: '15px' }}>
                    🔒 비밀번호 변경
                  </span>
                </label>
              </div>

              {/* 비밀번호 변경 필드들 (체크박스 선택시에만 표시) */}
              {changePassword && (
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  {/* 현재 비밀번호 */}
                  <div>
                    <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      🔒 현재 비밀번호 <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={profileForm.currentPassword}
                      onChange={handleProfileChange}
                      placeholder="현재 비밀번호를 입력하세요"
                      className="w-full px-4 py-2 border border-gray-300"
                      style={{ borderRadius: '10px', fontSize: '15px' }}
                    />
                  </div>

                  {/* 새 비밀번호 */}
                  <div>
                    <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      🔑 새 비밀번호 <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={profileForm.newPassword}
                      onChange={handleProfileChange}
                      placeholder="새 비밀번호를 입력하세요 (최소 6자)"
                      className="w-full px-4 py-2 border border-gray-300"
                      style={{ borderRadius: '10px', fontSize: '15px' }}
                    />
                  </div>

                  {/* 새 비밀번호 확인 */}
                  <div>
                    <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      ✅ 새 비밀번호 확인 <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={profileForm.confirmPassword}
                      onChange={handleProfileChange}
                      placeholder="새 비밀번호를 다시 입력하세요"
                      className="w-full px-4 py-2 border border-gray-300"
                      style={{ borderRadius: '10px', fontSize: '15px' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 버튼들 */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="flex-1 py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
              >
                {loading ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={handleCloseProfile}
                disabled={loading}
                className="flex-1 py-3 font-bold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}