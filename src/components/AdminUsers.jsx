import { useState, useEffect } from 'react'
import { Edit2, Trash2, Check, X, ArrowLeft, Key, AlertCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'

export default function AdminUsers({ user, onNavigate }) {
  const [users, setUsers] = useState([])
  const [changeRequests, setChangeRequests] = useState([])
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [resetPasswordModal, setResetPasswordModal] = useState(null)
  const [tempPassword, setTempPassword] = useState('')
  const [selectedRequestsModal, setSelectedRequestsModal] = useState(null)

  useEffect(() => {
    loadUsers()
    loadChangeRequests()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('사용자 목록 로드 오류:', err)
      alert('사용자 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const loadChangeRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('change_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setChangeRequests(data || [])
    } catch (err) {
      console.error('변경 요청 로드 오류:', err)
    }
  }

  const getPendingRequestsCount = (userId) => {
    return changeRequests.filter(req => req.user_id === userId && req.status === 'pending').length
  }

  const getUserRequests = (userId) => {
    return changeRequests.filter(req => req.user_id === userId && req.status === 'pending')
  }

  const getRequestInfo = (requestType) => {
    const info = {
      branch: { icon: '🏢', label: '지점 변경', color: '#3b82f6' },
      user_type: { icon: '👥', label: '권한 변경', color: '#8b5cf6' }
    }
    return info[requestType] || { icon: '📝', label: '기타', color: '#6b7280' }
  }

  const handleViewRequests = (targetUser) => {
    const requests = getUserRequests(targetUser.id)
    if (requests.length === 0) {
      alert('대기중인 변경 요청이 없습니다.')
      return
    }
    setSelectedRequestsModal({ user: targetUser, requests })
  }

  const handleApproveRequest = async (request) => {
    if (!window.confirm('이 변경 요청을 승인하시겠습니까?')) return

    try {
      // 1. change_requests 테이블의 status를 'approved'로 변경
      const { error: updateRequestError } = await supabase
        .from('change_requests')
        .update({ 
          status: 'approved',
          processed_at: new Date().toISOString(),
          processed_by: user.id
        })
        .eq('id', request.id)
      
      if (updateRequestError) throw updateRequestError

      // 2. users 테이블의 해당 필드 업데이트
      const updateData = {}
      if (request.request_type === 'branch') {
        updateData.branch = request.requested_value
      } else if (request.request_type === 'user_type') {
        updateData.user_type = request.requested_value
      }
      
      const { error: updateUserError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', request.user_id)
      
      if (updateUserError) throw updateUserError

      alert(`${getRequestInfo(request.request_type).label} 요청이 승인되었습니다.`)
      
      // 데이터 새로고침
      await loadUsers()
      await loadChangeRequests()
      
      // 모달 내 남은 요청 확인
      const remainingRequests = changeRequests.filter(
        r => r.user_id === request.user_id && r.id !== request.id && r.status === 'pending'
      )
      
      if (remainingRequests.length === 0) {
        setSelectedRequestsModal(null)
      } else {
        setSelectedRequestsModal(prev => ({
          ...prev,
          requests: remainingRequests
        }))
      }
    } catch (err) {
      console.error('요청 승인 오류:', err)
      alert('요청 승인 중 오류가 발생했습니다.')
    }
  }

  const handleRejectRequest = async (request) => {
    const reason = window.prompt('거부 사유를 입력해주세요:')
    if (!reason) return

    try {
      const { error } = await supabase
        .from('change_requests')
        .update({ 
          status: 'rejected',
          reject_reason: reason,
          processed_at: new Date().toISOString(),
          processed_by: user.id
        })
        .eq('id', request.id)
      
      if (error) throw error

      alert(`${getRequestInfo(request.request_type).label} 요청이 거부되었습니다.`)
      
      // 데이터 새로고침
      await loadChangeRequests()
      
      // 모달 내 남은 요청 확인
      const remainingRequests = changeRequests.filter(
        r => r.user_id === request.user_id && r.id !== request.id && r.status === 'pending'
      )
      
      if (remainingRequests.length === 0) {
        setSelectedRequestsModal(null)
      } else {
        setSelectedRequestsModal(prev => ({
          ...prev,
          requests: remainingRequests
        }))
      }
    } catch (err) {
      console.error('요청 거부 오류:', err)
      alert('요청 거부 중 오류가 발생했습니다.')
    }
  }

  const handleApprove = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'approved' })
        .eq('id', userId)
      
      if (error) throw error
      
      alert('사용자가 승인되었습니다.')
      loadUsers()
    } catch (err) {
      console.error('승인 오류:', err)
      alert('승인 중 오류가 발생했습니다.')
    }
  }

  const handleReject = async (userId) => {
    if (!window.confirm('정말 거부하시겠습니까?')) return
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'rejected' })
        .eq('id', userId)
      
      if (error) throw error
      
      alert('사용자 가입이 거부되었습니다.')
      loadUsers()
    } catch (err) {
      console.error('거부 오류:', err)
      alert('거부 중 오류가 발생했습니다.')
    }
  }

  const handleEditUser = (targetUser) => {
    setEditingUser(targetUser)
    setEditForm({ ...targetUser })
  }

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    })
  }

  const handleSaveUserEdit = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editForm.name,
          branch: editForm.branch,
          phone: editForm.phone,
          email: editForm.email
        })
        .eq('id', editForm.id)
      
      if (error) throw error
      
      alert('사용자 정보가 수정되었습니다.')
      setEditingUser(null)
      loadUsers()
    } catch (err) {
      console.error('수정 오류:', err)
      alert('수정 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
      
      if (error) throw error
      
      alert('사용자가 삭제되었습니다.')
      loadUsers()
    } catch (err) {
      console.error('삭제 오류:', err)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const generateTempPassword = () => {
    const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowerCase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const special = '!@#$%'
    
    let password = ''
    password += upperCase[Math.floor(Math.random() * upperCase.length)]
    password += lowerCase[Math.floor(Math.random() * lowerCase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += special[Math.floor(Math.random() * special.length)]
    
    const allChars = upperCase + lowerCase + numbers + special
    for (let i = 0; i < 4; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }
    
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }

  const handleResetPasswordConfirm = (targetUser) => {
    if (!window.confirm(`${targetUser.name}(${targetUser.email})님의 비밀번호를 초기화하시겠습니까?`)) return
    handleResetPassword(targetUser)
  }

  const handleResetPassword = async (targetUser) => {
    try {
      const newTempPassword = generateTempPassword()
      
      // Supabase Auth를 통한 비밀번호 재설정
      const { error } = await supabase.auth.admin.updateUserById(
        targetUser.id,
        { password: newTempPassword }
      )
      
      if (error) throw error
      
      setTempPassword(newTempPassword)
      setResetPasswordModal(targetUser)
    } catch (err) {
      console.error('비밀번호 초기화 오류:', err)
      alert('비밀번호 초기화 중 오류가 발생했습니다.')
    }
  }

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword)
    alert('임시 비밀번호가 클립보드에 복사되었습니다.')
  }

  const handleCloseResetModal = () => {
    setResetPasswordModal(null)
    setTempPassword('')
    loadUsers()
  }

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-md p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => onNavigate('adminDashboard')}
            className="flex items-center gap-2 font-bold hover:opacity-70 transition-opacity"
            style={{ color: '#249689', fontSize: '15px' }}
          >
            <ArrowLeft size={20} />
            뒤로가기
          </button>
          <div className="flex items-center gap-1.5">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-10 h-10 object-cover"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
              회원관리
            </h1>
          </div>
          <div style={{ width: '100px' }}></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* 대기중인 요청 요약 */}
        {changeRequests.filter(r => r.status === 'pending').length > 0 && (
          <div className="mb-6 p-4 rounded-lg flex items-start gap-3" style={{ backgroundColor: '#fef3c7', border: '2px solid #fde68a' }}>
            <AlertCircle size={24} style={{ color: '#f59e0b' }} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold mb-1" style={{ color: '#92400e', fontSize: '16px' }}>
                처리 대기중인 변경 요청
              </h3>
              <div className="flex gap-4 text-sm" style={{ color: '#78350f' }}>
                <span>🏢 지점 변경: {changeRequests.filter(r => r.request_type === 'branch' && r.status === 'pending').length}건</span>
                <span>👥 권한 변경: {changeRequests.filter(r => r.request_type === 'user_type' && r.status === 'pending').length}건</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* 검색바 */}
          <div className="p-4 border-b flex items-center gap-2">
            <label className="font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              이메일
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이메일을 입력하세요"
              className="flex-1 px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            />
            <button 
              onClick={loadUsers}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              🔄
            </button>
          </div>

          {/* 회원 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    요청
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    지점명
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    이름
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    전화번호
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    구분
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    이메일
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    가입확인
                  </th>
                  <th className="px-4 py-3 text-center font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">
                      로딩 중...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">
                      사용자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((targetUser) => {
                    const requestCount = getPendingRequestsCount(targetUser.id)
                    const userRequests = getUserRequests(targetUser.id)
                    
                    return (
                      <tr key={targetUser.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {requestCount > 0 ? (
                            <button
                              onClick={() => handleViewRequests(targetUser)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:opacity-80 transition-opacity"
                              style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a' }}
                              title="변경 요청 보기"
                            >
                              <span style={{ fontSize: '16px' }}>
                                {userRequests.map(req => getRequestInfo(req.request_type).icon).join('')}
                              </span>
                              <span className="font-bold" style={{ color: '#92400e', fontSize: '12px' }}>
                                {requestCount}
                              </span>
                            </button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3" style={{ fontSize: '15px' }}>{targetUser.branch}</td>
                        <td className="px-4 py-3" style={{ fontSize: '15px' }}>{targetUser.name}</td>
                        <td className="px-4 py-3" style={{ fontSize: '15px' }}>{targetUser.phone}</td>
                        <td className="px-4 py-3" style={{ fontSize: '15px' }}>{targetUser.user_type}</td>
                        <td className="px-4 py-3" style={{ fontSize: '15px' }}>{targetUser.email}</td>
                        <td className="px-4 py-3">
                          {targetUser.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(targetUser.id)}
                                className="p-1 bg-green-100 hover:bg-green-200 rounded"
                                title="승인"
                              >
                                <Check size={16} className="text-green-600" />
                              </button>
                              <button
                                onClick={() => handleReject(targetUser.id)}
                                className="p-1 bg-red-100 hover:bg-red-200 rounded"
                                title="거부"
                              >
                                <X size={16} className="text-red-600" />
                              </button>
                            </div>
                          ) : (
                            <span 
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                targetUser.status === 'approved' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {targetUser.status === 'approved' ? '승인완료' : '거부됨'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEditUser(targetUser)}
                              className="p-2 hover:bg-gray-100 rounded"
                              title="수정"
                            >
                              <Edit2 size={18} style={{ color: '#249689' }} />
                            </button>
                            <button
                              onClick={() => handleResetPasswordConfirm(targetUser)}
                              className="p-2 hover:bg-gray-100 rounded"
                              title="비밀번호 초기화"
                            >
                              <Key size={18} style={{ color: '#f59e0b' }} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(targetUser.id)}
                              className="p-2 hover:bg-gray-100 rounded"
                              title="삭제"
                            >
                              <Trash2 size={18} style={{ color: '#dc2626' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 변경 요청 상세 모달 */}
      {selectedRequestsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#249689' }}>
                변경 요청 상세
              </h2>
              <button
                onClick={() => setSelectedRequestsModal(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            {/* 사용자 정보 */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold" style={{ fontSize: '16px' }}>👤 {selectedRequestsModal.user.name}</span>
                <span className="text-gray-600" style={{ fontSize: '14px' }}>({selectedRequestsModal.user.email})</span>
              </div>
              <div className="text-sm text-gray-600">
                현재 지점: {selectedRequestsModal.user.branch} | 현재 구분: {selectedRequestsModal.user.user_type}
              </div>
            </div>

            {/* 요청 목록 */}
            <div className="space-y-4">
              {selectedRequestsModal.requests.map((request) => {
                const info = getRequestInfo(request.request_type)
                return (
                  <div key={request.id} className="border-2 border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '24px' }}>{info.icon}</span>
                        <div>
                          <h3 className="font-bold" style={{ color: info.color, fontSize: '16px' }}>
                            {info.label}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {new Date(request.created_at).toLocaleString('ko-KR')}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        대기중
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 w-16">현재:</span>
                        <span className="font-medium">{request.current_value}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 w-16">요청:</span>
                        <span className="font-bold" style={{ color: info.color }}>{request.requested_value}</span>
                      </div>
                      {request.reason && (
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <span className="text-sm text-gray-600 w-16">사유:</span>
                          <span className="text-sm flex-1">{request.reason}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRequest(request)}
                        className="flex-1 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#10b981', fontSize: '14px' }}
                      >
                        ✅ 승인
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request)}
                        className="flex-1 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#ef4444', fontSize: '14px' }}
                      >
                        ❌ 거부
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => setSelectedRequestsModal(null)}
              className="w-full mt-6 py-3 font-bold rounded-lg hover:bg-gray-50 transition-colors"
              style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', fontSize: '15px' }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 회원 수정 모달 */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#249689' }}>
              회원 정보 수정
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>이름</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>지점명</label>
                <input
                  type="text"
                  name="branch"
                  value={editForm.branch}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>전화번호</label>
                <input
                  type="tel"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>이메일</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveUserEdit}
                className="flex-1 py-2 text-white font-bold rounded-lg"
                style={{ backgroundColor: '#249689', fontSize: '15px' }}
              >
                저장
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2 font-bold rounded-lg"
                style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', fontSize: '15px' }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 초기화 결과 모달 */}
      {resetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key size={32} style={{ color: '#10b981' }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#249689' }}>
                비밀번호 초기화 완료
              </h2>
              <p className="text-gray-600 text-sm">
                {resetPasswordModal.name}({resetPasswordModal.email})님의<br/>
                비밀번호가 초기화되었습니다.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 border-2 border-gray-200">
              <label className="block mb-2 font-bold text-sm" style={{ color: '#000000' }}>
                임시 비밀번호
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempPassword}
                  readOnly
                  className="flex-1 px-4 py-3 border-2 border-gray-300 bg-white font-mono text-lg font-bold text-center"
                  style={{ borderRadius: '10px', color: '#249689', letterSpacing: '2px' }}
                />
                <button
                  onClick={handleCopyPassword}
                  className="px-4 py-3 font-bold rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#249689', color: 'white', fontSize: '14px' }}
                  title="복사"
                >
                  📋 복사
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-bold mb-2" style={{ color: '#f59e0b' }}>
                ⚠️ 중요 안내사항
              </p>
              <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                <li>위 임시 비밀번호를 사용자에게 전달해주세요</li>
                <li>사용자는 로그인 후 반드시 비밀번호를 변경해야 합니다</li>
                <li>임시 비밀번호는 이 화면을 닫으면 다시 확인할 수 없습니다</li>
              </ul>
            </div>

            <button
              onClick={handleCloseResetModal}
              className="w-full py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#249689', fontSize: '15px' }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}