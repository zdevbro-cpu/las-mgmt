import React, { useState, useEffect } from 'react'
import { ArrowLeft, Search, RotateCcw, Edit, Trash2, CheckCircle, XCircle, Clock, AlertCircle, Users, Key } from 'lucide-react'
import { supabase } from '../lib/supabase'

// 고유코드 생성 함수
const generateReferralCode = async (userType) => {
  try {
    // 1. 구분코드 결정
    let prefix = 'LAS'
    if (userType === '직원' || userType === '점주' || userType === '점장') {
      prefix = 'LAS1'
    } else if (userType === '모니터링요원') {
      prefix = 'LAS3'
    } else {
      return null // 지점관리자, 시스템관리자는 코드 미발급
    }

    // 2. 해당 prefix의 마지막 번호 조회
    const { data, error } = await supabase
      .from('users')
      .select('referral_code')
      .like('referral_code', `${prefix}%`)
      .order('referral_code', { ascending: false })
      .limit(1)

    if (error) throw error

    // 3. 다음 번호 생성
    let nextNumber = 1
    if (data && data.length > 0 && data[0].referral_code) {
      const lastNumber = parseInt(data[0].referral_code.slice(4))
      nextNumber = lastNumber + 1
    }

    // 4. 새 코드 생성 (예: LAS1001)
    const newCode = prefix + String(nextNumber).padStart(3, '0')

    return newCode
  } catch (err) {
    console.error('추천인 코드 생성 오류:', err)
    return null
  }
}

export default function SystemAdminUsers({ user, onNavigate }) {
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [changeRequests, setChangeRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [resettingPassword, setResettingPassword] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    branch: '',
    phone: '',
    user_type: ''
  })

  useEffect(() => {
    fetchBranches()
    fetchUsers()
    fetchChangeRequests()
  }, [])

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      console.log('✅ Branches loaded:', data)
      setBranches(data || [])
    } catch (err) {
      console.error('❌ 지점 조회 오류:', err)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('✅ 직원 목록:', data)
      setUsers(data || [])
    } catch (err) {
      console.error('❌ 직원 조회 오류:', err)
      alert('직원 목록을 불러오는 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchChangeRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('change_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('✅ 변경요청 목록:', data)
      setChangeRequests(data || [])
    } catch (err) {
      console.error('❌ 변경요청 조회 오류:', err)
    }
  }

  const handleSearch = () => {
    fetchUsers()
  }

  const handleReset = () => {
    setSearchValue('')
    setFilterStatus('all')
    fetchUsers()
  }

  const handleApprove = async (userId) => {
      console.log('🔍 승인 시작 - userId:', userId)
      
      if (!window.confirm('이 직원을 승인하시겠습니까?')) {
        console.log('❌ 사용자가 승인 취소')
        return
      }

      setLoading(true)
      try {
        const targetUser = users.find(u => u.id === userId)
        console.log('👤 대상 사용자:', targetUser)
        
        const updateData = {
          status: 'approved',
          approved_at: new Date().toISOString()
        }

        // referral_code가 없는 경우에만 생성
        if (targetUser && !targetUser.referral_code) {
          const referralCode = await generateReferralCode(targetUser.user_type)
          console.log('🎫 생성된 고유코드:', referralCode)
          if (referralCode) {
            updateData.referral_code = referralCode
          }
        }

        console.log('📝 업데이트 데이터:', updateData)

        const { error, data } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId)
          .select()

        console.log('✅ 업데이트 결과:', data)
        console.log('❌ 에러:', error)

        if (error) throw error

        if (updateData.referral_code) {
          alert(`직원이 승인되었습니다!\n고유코드: ${updateData.referral_code}`)
        } else {
          alert('직원이 승인되었습니다!')
        }
        
        fetchUsers()
      } catch (err) {
        console.error('❌ 승인 오류:', err)
        alert('승인 처리 중 오류가 발생했습니다: ' + err.message)
      } finally {
        setLoading(false)
      }
    }
  const handleReject = async (userId) => {
    if (!window.confirm('이 직원을 거부하시겠습니까?\n거부된 직원은 삭제됩니다.')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      alert('직원이 거부되었습니다!')
      fetchUsers()
    } catch (err) {
      console.error('❌ 거부 오류:', err)
      alert('거부 처리 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

const handlePasswordReset = async (targetUser) => {
  const tempPassword = 'las0000'
  
  if (!window.confirm(
    `${targetUser.name}(${targetUser.email})님의 비밀번호를 초기화하시겠습니까?\n\n초기화 비밀번호: ${tempPassword}\n\n※ 직원에게 유선으로 전달해주세요.`
  )) {
    return
  }

  setResettingPassword(targetUser.id)
  try {
    // users 테이블의 password 컬럼 직접 업데이트
    const { error } = await supabase
      .from('users')
      .update({ password: tempPassword })
      .eq('id', targetUser.id)

    if (error) throw error

    alert(
      `비밀번호가 초기화되었습니다!\n\n` +
      `초기화 비밀번호: ${tempPassword}\n\n` +
      `※ 직원에게 유선으로 초기화 비밀번호를 전달하고,\n` +
      `로그인 후 반드시 비밀번호를 변경하도록 안내해주세요.`
    )
  } catch (err) {
    console.error('Password reset error:', err)
    alert('비밀번호 초기화에 실패했습니다: ' + err.message)
  } finally {
    setResettingPassword(null)
  }
}

  const handleApproveChangeRequest = async (requestId, userId, changes) => {
    if (!window.confirm('변경요청을 승인하시겠습니까?')) return

    setLoading(true)
    try {
      const { error: requestError } = await supabase
        .from('change_requests')
        .update({ status: 'approved' })
        .eq('id', requestId)

      if (requestError) throw requestError

      const updateData = {}
      if (changes.branch) updateData.branch = changes.branch
      if (changes.user_type) updateData.user_type = changes.user_type

      const { error: userError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)

      if (userError) throw userError

      alert('변경요청이 승인되었습니다!')
      fetchUsers()
      fetchChangeRequests()
    } catch (err) {
      console.error('❌ 변경요청 승인 오류:', err)
      alert('변경요청 승인 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRejectChangeRequest = async (requestId) => {
    if (!window.confirm('변경요청을 거부하시겠습니까?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('change_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)

      if (error) throw error

      alert('변경요청이 거부되었습니다!')
      fetchChangeRequests()
    } catch (err) {
      console.error('❌ 변경요청 거부 오류:', err)
      alert('변경요청 거부 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (u) => {
    setSelectedUser(u)
    setFormData({
      name: u.name || '',
      phone: u.phone || '',
      branch: u.branch || '',
      user_type: u.user_type || ''
    })
    setShowEditModal(true)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleUpdateUser = async () => {
    if (!formData.name?.trim()) {
      alert('이름을 입력해주세요.')
      return
    }

    if (!window.confirm('수정 내용을 저장하시겠습니까?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          branch: formData.branch,
          user_type: formData.user_type
        })
        .eq('id', selectedUser.id)

      if (error) throw error

      alert('수정되었습니다.')
      setShowEditModal(false)
      fetchUsers()
    } catch (err) {
      console.error('❌ 수정 오류:', err)
      alert('수정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`${userName} 직원을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      alert('삭제되었습니다.')
      fetchUsers()
    } catch (err) {
      console.error('❌ 삭제 오류:', err)
      alert('삭제에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const matchSearch = !searchValue || 
      u.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchValue.toLowerCase())
    
    const matchStatus = filterStatus === 'all' || u.status === filterStatus
    
    return matchSearch && matchStatus
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => onNavigate('systemAdminDashboard')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft size={20} style={{ color: '#249689' }} />
            <span style={{ color: '#249689', fontSize: '14px', fontWeight: 'bold' }}>
              나가기
            </span>
          </button>
          <h1 className="font-bold" style={{ color: '#249689', fontSize: '24px' }}>
            👥 직원정보관리
          </h1>
          <div style={{ width: '100px' }}></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* 변경요청 알림 */}
        {changeRequests.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={20} style={{ color: '#f59e0b' }} />
              <span className="font-bold" style={{ color: '#f59e0b', fontSize: '15px' }}>
                🔔 대기 중인 변경요청이 {changeRequests.length}건 있습니다
              </span>
            </div>
            <div className="space-y-2">
              {changeRequests.map((req) => {
                const reqUser = users.find(u => u.id === req.user_id)
                return (
                  <div key={req.id} className="bg-white p-3 rounded border border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold" style={{ fontSize: '14px' }}>
                        {reqUser?.name || '알 수 없음'}
                      </span>
                      <span className="text-gray-600 ml-2" style={{ fontSize: '13px' }}>
                        {req.requested_changes?.branch && `지점: ${req.requested_changes.branch}`}
                        {req.requested_changes?.user_type && ` / 구분: ${req.requested_changes.user_type}`}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveChangeRequest(req.id, req.user_id, req.requested_changes)}
                        className="px-3 py-1.5 rounded-lg hover:bg-green-50"
                        style={{ color: '#10b981', fontSize: '13px', border: '1px solid #10b981' }}
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleRejectChangeRequest(req.id)}
                        className="px-3 py-1.5 rounded-lg hover:bg-red-50"
                        style={{ color: '#dc2626', fontSize: '13px', border: '1px solid #dc2626' }}
                      >
                        거부
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[250px]">
              <div className="flex items-center gap-2">
                <Search size={18} style={{ color: '#249689' }} />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="이름, 이메일 검색"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  style={{ fontSize: '14px' }}
                />
              </div>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
              style={{ fontSize: '14px' }}
            >
              <option value="all">전체 상태</option>
              <option value="approved">승인됨</option>
              <option value="pending">대기중</option>
              <option value="rejected">거부됨</option>
            </select>

            <button
              onClick={handleSearch}
              className="px-4 py-2 rounded-lg font-bold"
              style={{ backgroundColor: '#249689', color: 'white', fontSize: '14px' }}
            >
              검색
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="초기화"
            >
              <RotateCcw size={18} style={{ color: '#249689' }} />
            </button>
          </div>
        </div>

        {/* 직원 목록 테이블 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px' }}>
                    이름
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px' }}>
                    이메일
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px' }}>
                    지점
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px' }}>
                    구분
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px' }}>
                    전화번호
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px' }}>
                    고유코드
                  </th>
                  <th className="px-3 py-3 text-center font-bold" style={{ fontSize: '14px' }}>
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      로딩 중...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      직원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-3" style={{ fontSize: '14px' }}>
                        {u.name}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '13px' }}>
                        {u.email}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '14px' }}>
                        {u.branch}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '14px' }}>
                        {u.user_type}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '13px' }}>
                        {u.phone || '-'}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '14px', fontWeight: 'bold', color: '#249689' }}>
                        {u.referral_code || '-'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {u.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleApprove(u.id)}
                                className="p-1.5 rounded-lg hover:bg-green-50"
                                style={{ color: '#10b981' }}
                                title="승인"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                onClick={() => handleReject(u.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50"
                                style={{ color: '#dc2626' }}
                                title="거부"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-1.5 rounded-lg hover:bg-blue-50"
                                style={{ color: '#2563eb' }}
                                title="수정"
                              >
                                <Edit size={16} />
                              </button>
                              {/* 비밀번호 초기화 버튼 - 본인이 아닌 경우만 */}
                              {u.id !== user.id && (
                                <button
                                  onClick={() => handlePasswordReset(u)}
                                  disabled={resettingPassword === u.id}
                                  className="p-1.5 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
                                  style={{ color: '#7f95eb' }}
                                  title="비밀번호 초기화"
                                >
                                  <Key size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(u.id, u.name)}
                                className="p-1.5 rounded-lg hover:bg-red-50"
                                style={{ color: '#dc2626' }}
                                title="삭제"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 총 개수 */}
          {filteredUsers.length > 0 && (
            <div className="mt-4 text-right text-gray-600" style={{ fontSize: '13px' }}>
              총 <strong style={{ color: '#249689' }}>{filteredUsers.length}</strong>명
            </div>
          )}
        </div>
      </div>

      {/* 직원정보 수정 모달 */}
      {showEditModal && selectedUser && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: '10px' }}
          >
            <h3 className="font-bold mb-4" style={{ color: '#249689', fontSize: '20px' }}>
              ✏️ 직원정보수정
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-bold text-sm text-gray-600">
                  이메일 (수정불가)
                </label>
                <input
                  type="text"
                  value={selectedUser.email}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-100"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                  이름 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                  전화번호
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                  지점
                </label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 bg-white"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                >
                  <option value="">선택하세요</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                  구분
                </label>
                <select
                  name="user_type"
                  value={formData.user_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 bg-white"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                >
                  <option value="">선택</option>
                  <option value="모니터링요원">모니터링요원</option>
                  <option value="점주">점주</option>
                  <option value="점장">점장</option>
                  <option value="지점관리자">지점관리자</option>
                  <option value="시스템관리자">시스템관리자</option>
                </select>
              </div>

              {/* 비밀번호 초기화 버튼 - 수정 모달 내에서도 제공 */}
              {selectedUser.id !== user.id && (
                <div className="pt-2 border-t">
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      handlePasswordReset(selectedUser)
                    }}
                    disabled={resettingPassword === selectedUser.id}
                    className="w-full py-2.5 font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    style={{ 
                      backgroundColor: '#7f95eb', 
                      color: 'white',
                      borderRadius: '10px', 
                      fontSize: '15px' 
                    }}
                  >
                    <Key size={18} />
                    {resettingPassword === selectedUser.id ? '처리 중...' : '비밀번호 초기화'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    초기화 비밀번호(las0000)가 설정되며, 유선으로 직원에게 전달하세요
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleUpdateUser}
                disabled={loading}
                className="flex-1 py-2.5 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
              >
                {loading ? '저장 중...' : '수정'}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                disabled={loading}
                className="flex-1 py-2.5 font-bold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                style={{ border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
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