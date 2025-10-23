import React, { useState, useEffect } from 'react'
import { ArrowLeft, Search, Building2, Edit, Trash2, CheckCircle, XCircle, RefreshCw, Key } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { canAccessAllBranches } from '../constants/roles'

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

export default function AdminUsers({ user, onNavigate }) {
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBranch, setFilterBranch] = useState('')
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
    loadBranches()
    loadUsers()
  }, [])

  const loadBranches = async () => {
    setLoadingBranches(true)
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      
      console.log('Branches loaded:', data)
      setBranches(data || [])
    } catch (err) {
      console.error('Load branches error:', err)
      alert('지점 목록을 불러오는데 실패했습니다: ' + err.message)
    } finally {
      setLoadingBranches(false)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      console.log('Loading users...')
      
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!canAccessAllBranches(user)) {
        console.log('Filtering by branch:', user.branch)
        query = query.eq('branch', user.branch)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      console.log('Users loaded:', data?.length)
      setUsers(data || [])
      
    } catch (err) {
      console.error('Load users error:', err)
      alert('사용자 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId, approve) => {
    const action = approve ? '승인' : '거부'
    if (!window.confirm(`이 사용자를 ${action}하시겠습니까?`)) return
    
    try {
      const updateData = {
        status: approve ? 'approved' : 'rejected'
      }

      // 승인하는 경우, referral_code가 없으면 생성
      if (approve) {
        const targetUser = users.find(u => u.id === userId)
        if (targetUser && !targetUser.referral_code) {
          const referralCode = await generateReferralCode(targetUser.user_type)
          if (referralCode) {
            updateData.referral_code = referralCode
          }
        }
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
      
      if (error) throw error
      
      if (approve && updateData.referral_code) {
        alert(`${action}되었습니다.\n고유코드: ${updateData.referral_code}`)
      } else {
        alert(`${action}되었습니다.`)
      }
      
      loadUsers()
    } catch (err) {
      console.error('Approve/Reject error:', err)
      alert(`${action} 처리에 실패했습니다.`)
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

  const openEditModal = (u) => {
    console.log('Opening edit modal for:', u)
    console.log('Available branches:', branches)
    console.log('Branches count:', branches.length)
    
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
    console.log(`Form change: ${name} = ${value}`)
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
      loadUsers()
    } catch (err) {
      console.error('Update error:', err)
      alert('수정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`${userName} 사용자를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
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
      loadUsers()
    } catch (err) {
      console.error('Delete error:', err)
      alert('삭제에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const matchSearch = !searchTerm || 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchBranch = !filterBranch || u.branch === filterBranch
    
    const matchStatus = filterStatus === 'all' || u.status === filterStatus
    
    return matchSearch && matchBranch && matchStatus
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => onNavigate('adminDashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            title="나가기"
          >
            <ArrowLeft size={24} style={{ color: '#249689' }} />
            <span style={{ color: '#249689', fontSize: '16px' }}>나가기</span>
          </button>
          <div className="flex-1 flex justify-center">
            <h1 className="font-bold" style={{ color: '#249689', fontSize: '28px' }}>
              {canAccessAllBranches(user) ? '직원정보관리' : '직원정보관리'}
            </h1>
          </div>
          <div style={{ width: '100px' }}></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex flex-wrap items-center gap-2">
              {/* 검색 */}
              <div className="flex-1 flex items-center gap-2 min-w-[200px]">
                <label className="font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  <Search size={18} className="inline mr-1" />
                  검색
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="이름, 이메일"
                  className="flex-1 px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              
              {/* 지점 필터 (시스템관리자만) */}
              {canAccessAllBranches(user) && branches.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    <Building2 size={18} className="inline mr-1" />
                    지점
                  </label>
                  <select
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                    className="px-4 py-2 border border-gray-300"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                  >
                    <option value="">전체</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.name}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* 상태 필터 */}
              <div className="flex items-center gap-2">
                <label className="font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  상태
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                >
                  <option value="all">전체</option>
                  <option value="approved">승인됨</option>
                  <option value="pending">대기중</option>
                  <option value="rejected">거부됨</option>
                </select>
              </div>
              
              <button 
                onClick={loadUsers}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-1"
                title="새로고침"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    이름
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    이메일
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    지점
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    전화번호
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    구분
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    고유코드
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    상태
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
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {u.name}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {u.email}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {u.branch || '-'}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {u.phone || '-'}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {u.user_type || '-'}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px', fontWeight: 'bold', color: '#249689' }}>
                        {u.referral_code || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span 
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            u.status === 'approved' 
                              ? 'bg-green-100 text-green-700' 
                              : u.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {u.status === 'approved' ? '승인됨' : u.status === 'pending' ? '대기중' : '거부됨'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-center items-center">
                          {/* 승인 대기 중인 경우 */}
                          {u.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(u.id, true)}
                                className="p-2 rounded-lg hover:bg-green-50 transition-colors"
                                style={{ color: '#10b981' }}
                                title="승인"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleApprove(u.id, false)}
                                className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                                style={{ color: '#dc2626' }}
                                title="거부"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                          
                          {/* 수정 버튼 */}
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            style={{ color: '#2563eb' }}
                            title="수정"
                          >
                            <Edit size={18} />
                          </button>
                          
                          {/* 비밀번호 초기화 버튼 - 본인이 아닌 경우만 */}
                          {u.id !== user.id && (
                            <button
                              onClick={() => handlePasswordReset(u)}
                              disabled={resettingPassword === u.id}
                              className="p-2 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
                              style={{ color: '#7f95eb' }}
                              title="비밀번호 초기화"
                            >
                              <Key size={18} />
                            </button>
                          )}
                          
                          {/* 삭제 버튼 - 본인이 아닌 경우만 */}
                          {u.id !== user.id && (
                            <button
                              onClick={() => handleDelete(u.id, u.name)}
                              className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                              style={{ color: '#dc2626' }}
                              title="삭제"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 수정 모달 */}
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
                  {branches.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
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