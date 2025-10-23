import React, { useState } from 'react'
import { ArrowLeft, User, Mail, Phone, Building2, Shield, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Profile({ user, onNavigate }) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || ''
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [loading, setLoading] = useState(false)

  // 변경 요청 상태 (지점, 권한 변경 요청)
  const [changeRequestForm, setChangeRequestForm] = useState({
    requestType: '',
    requestedValue: '',
    reason: ''
  })
  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false)

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    })
  }

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      alert('이름을 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editForm.name.trim(),
          phone: editForm.phone.trim()
        })
        .eq('id', user.id)
      
      if (error) throw error
      
      alert('프로필이 수정되었습니다.')
      setIsEditMode(false)
      window.location.reload() // 사용자 정보 새로고침
    } catch (err) {
      console.error('프로필 수정 오류:', err)
      alert('프로필 수정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('모든 비밀번호 필드를 입력해주세요.')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      alert('새 비밀번호는 8자 이상이어야 합니다.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })
      
      if (error) throw error
      
      alert('비밀번호가 변경되었습니다.')
      setShowPasswordChange(false)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (err) {
      console.error('비밀번호 변경 오류:', err)
      alert('비밀번호 변경 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitChangeRequest = async () => {
    if (!changeRequestForm.requestType || !changeRequestForm.requestedValue) {
      alert('변경할 항목과 값을 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('change_requests')
        .insert([{
          user_id: user.id,
          request_type: changeRequestForm.requestType,
          current_value: changeRequestForm.requestType === 'branch' ? user.branch : user.user_type,
          requested_value: changeRequestForm.requestedValue,
          reason: changeRequestForm.reason,
          status: 'pending'
        }])
      
      if (error) throw error
      
      alert('변경 요청이 제출되었습니다. 관리자 승인 후 반영됩니다.')
      setShowChangeRequestModal(false)
      setChangeRequestForm({
        requestType: '',
        requestedValue: '',
        reason: ''
      })
    } catch (err) {
      console.error('변경 요청 제출 오류:', err)
      alert('변경 요청 제출 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-md p-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 font-bold hover:opacity-70 transition-opacity"
            style={{ color: '#249689', fontSize: '15px' }}
          >
            <ArrowLeft size={20} />
            나가기
          </button>
          <div className="flex items-center gap-1.5">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-10 h-10 object-cover"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
              내 정보관리
            </h1>
          </div>
          <div style={{ width: '100px' }}></div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* 기본 정보 */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#249689' }}>기본 정보</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                  <User size={18} className="inline mr-1" />
                  이름
                </label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  readOnly={!isEditMode}
                  className={`w-full px-4 py-2 border border-gray-300 ${!isEditMode ? 'bg-gray-50' : ''}`}
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                  <Mail size={18} className="inline mr-1" />
                  이메일
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
                <p className="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다</p>
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                  <Phone size={18} className="inline mr-1" />
                  전화번호
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  readOnly={!isEditMode}
                  className={`w-full px-4 py-2 border border-gray-300 ${!isEditMode ? 'bg-gray-50' : ''}`}
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                  <Building2 size={18} className="inline mr-1" />
                  지점
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={user?.branch || '-'}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 bg-gray-50"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                  />
                  <button
                    onClick={() => {
                      setChangeRequestForm({ ...changeRequestForm, requestType: 'branch' })
                      setShowChangeRequestModal(true)
                    }}
                    className="px-4 py-2 text-sm font-bold rounded-lg"
                    style={{ backgroundColor: '#fbbf24', color: 'white' }}
                  >
                    변경 요청
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                  <Shield size={18} className="inline mr-1" />
                  권한
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={user?.user_type || '-'}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 bg-gray-50"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                  />
                  <button
                    onClick={() => {
                      setChangeRequestForm({ ...changeRequestForm, requestType: 'user_type' })
                      setShowChangeRequestModal(true)
                    }}
                    className="px-4 py-2 text-sm font-bold rounded-lg"
                    style={{ backgroundColor: '#fbbf24', color: 'white' }}
                  >
                    변경 요청
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              {!isEditMode ? (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="flex-1 py-2 text-white font-bold rounded-lg"
                  style={{ backgroundColor: '#249689', fontSize: '15px' }}
                >
                  수정하기
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="flex-1 py-2 text-white font-bold rounded-lg"
                    style={{ backgroundColor: '#249689', fontSize: '15px' }}
                  >
                    {loading ? '저장 중...' : '저장'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditMode(false)
                      setEditForm({
                        name: user?.name || '',
                        phone: user?.phone || '',
                        email: user?.email || ''
                      })
                    }}
                    className="flex-1 py-2 font-bold rounded-lg"
                    style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', fontSize: '15px' }}
                  >
                    취소
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 비밀번호 변경 */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#249689' }}>
              <Lock size={20} className="inline mr-1" />
              비밀번호 변경
            </h2>
            {!showPasswordChange ? (
              <button
                onClick={() => setShowPasswordChange(true)}
                className="w-full py-2 font-bold rounded-lg"
                style={{ color: '#000000', border: '2px solid #249689', backgroundColor: 'white', fontSize: '15px' }}
              >
                비밀번호 변경하기
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                    현재 비밀번호
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                  />
                </div>
                <div>
                  <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                    새 비밀번호
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                  />
                  <p className="text-xs text-gray-500 mt-1">8자 이상 입력해주세요</p>
                </div>
                <div>
                  <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                    새 비밀번호 확인
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={loading}
                    className="flex-1 py-2 text-white font-bold rounded-lg"
                    style={{ backgroundColor: '#249689', fontSize: '15px' }}
                  >
                    {loading ? '변경 중...' : '비밀번호 변경'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordChange(false)
                      setPasswordForm({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      })
                    }}
                    className="flex-1 py-2 font-bold rounded-lg"
                    style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', fontSize: '15px' }}
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 변경 요청 모달 */}
      {showChangeRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#249689' }}>
              {changeRequestForm.requestType === 'branch' ? '지점 변경 요청' : '권한 변경 요청'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                  현재 값
                </label>
                <input
                  type="text"
                  value={changeRequestForm.requestType === 'branch' ? user.branch : user.user_type}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                  변경 요청 값 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={changeRequestForm.requestedValue}
                  onChange={(e) => setChangeRequestForm({ ...changeRequestForm, requestedValue: e.target.value })}
                  placeholder={changeRequestForm.requestType === 'branch' ? '새 지점명' : '새 권한'}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                  변경 사유
                </label>
                <textarea
                  value={changeRequestForm.reason}
                  onChange={(e) => setChangeRequestForm({ ...changeRequestForm, reason: e.target.value })}
                  placeholder="변경 사유를 입력해주세요"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSubmitChangeRequest}
                disabled={loading}
                className="flex-1 py-2 text-white font-bold rounded-lg"
                style={{ backgroundColor: '#249689', fontSize: '15px' }}
              >
                {loading ? '제출 중...' : '요청 제출'}
              </button>
              <button
                onClick={() => {
                  setShowChangeRequestModal(false)
                  setChangeRequestForm({
                    requestType: '',
                    requestedValue: '',
                    reason: ''
                  })
                }}
                className="flex-1 py-2 font-bold rounded-lg"
                style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', fontSize: '15px' }}
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