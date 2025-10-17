import { useState } from 'react'
import { LogOut, User, Lock, MessageCircle, Info } from 'lucide-react'

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
    if (!profileForm.name.trim()) {
      alert('이름을 입력해주세요.')
      return
    }

    if (!profileForm.phone.trim()) {
      alert('전화번호를 입력해주세요.')
      return
    }

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
    }

    setLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert('정보가 성공적으로 수정되었습니다.')
      handleCloseProfile()
      
    } catch (err) {
      console.error('정보 수정 오류:', err)
      alert('정보 수정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestChange = (fieldType) => {
    const messages = {
      branch: '지점 변경을 요청하시겠습니까?\n\n요청 내용이 관리자에게 전달됩니다.',
      userType: '권한 변경을 요청하시겠습니까?\n\n요청 내용이 관리자에게 전달됩니다.'
    }
    
    if (window.confirm(messages[fieldType])) {
      alert('변경 요청이 접수되었습니다.\n관리자 검토 후 연락드리겠습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center gap-1.5 mb-8">
            <div className="w-10 h-10 bg-teal-600 rounded flex items-center justify-center text-white font-bold text-xl">
              LAS
            </div>
            <h2 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
              LAS 매장관리
            </h2>
          </div>
          
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

      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md overflow-y-auto" style={{ borderRadius: '10px', maxHeight: '90vh' }}>
            <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: '#249689' }}>
              내정보관리
            </h2>
            
            <div className="mb-6 p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: '#f0fdfa', border: '1px solid #99f6e4' }}>
              <Info size={20} className="flex-shrink-0 mt-0.5" style={{ color: '#0d9488' }} />
              <p style={{ fontSize: '13px', color: '#0f766e', lineHeight: '1.5' }}>
                이메일, 지점명, 구분은 보안 및 정책상 관리자를 통해서만 변경 가능합니다.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-bold flex items-center gap-1.5" style={{ color: '#000000', fontSize: '15px' }}>
                  <Lock size={16} style={{ color: '#6b7280' }} />
                  📧 이메일
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                  style={{ borderRadius: '10px', fontSize: '15px', color: '#6b7280' }}
                />
                <p className="mt-1.5 flex items-center gap-1.5" style={{ fontSize: '12px', color: '#6b7280' }}>
                  <Lock size={12} />
                  보안을 위해 이메일은 변경할 수 없습니다
                </p>
              </div>

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

              <div>
                <label className="block mb-2 font-bold flex items-center gap-1.5" style={{ color: '#000000', fontSize: '15px' }}>
                  <MessageCircle size={16} style={{ color: '#6b7280' }} />
                  🏢 지점명
                </label>
                <input
                  type="text"
                  value={user?.branch || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                  style={{ borderRadius: '10px', fontSize: '15px', color: '#6b7280' }}
                />
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5" style={{ fontSize: '12px', color: '#6b7280' }}>
                    <MessageCircle size={12} />
                    지점 변경은 관리자 승인이 필요합니다
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRequestChange('branch')}
                    className="px-3 py-1 rounded hover:opacity-80 transition-opacity text-xs font-medium"
                    style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
                  >
                    변경 요청
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-bold flex items-center gap-1.5" style={{ color: '#000000', fontSize: '15px' }}>
                  <MessageCircle size={16} style={{ color: '#6b7280' }} />
                  📋 구분
                </label>
                <input
                  type="text"
                  value={user?.user_type || user?.userType || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                  style={{ borderRadius: '10px', fontSize: '15px', color: '#6b7280' }}
                />
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5" style={{ fontSize: '12px', color: '#6b7280' }}>
                    <MessageCircle size={12} />
                    권한 변경은 관리자 승인이 필요합니다
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRequestChange('userType')}
                    className="px-3 py-1 rounded hover:opacity-80 transition-opacity text-xs font-medium"
                    style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
                  >
                    변경 요청
                  </button>
                </div>
              </div>

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

              {changePassword && (
                <div className="space-y-4 p-4 rounded-lg" style={{ backgroundColor: '#f9fafb', border: '2px solid #e5e7eb' }}>
                  <div>
                    <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      🔑 현재 비밀번호 <span style={{ color: '#ef4444' }}>*</span>
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

                  <div>
                    <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      🔐 새 비밀번호 <span style={{ color: '#ef4444' }}>*</span>
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