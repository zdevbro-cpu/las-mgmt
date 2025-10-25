import React, { useState, useEffect } from 'react'
import { ArrowLeft, Search, Download, Edit, Trash2, CheckCircle, XCircle, Key } from 'lucide-react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

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
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [filterUserType, setFilterUserType] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedUsers, setSelectedUsers] = useState([])
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
  }, [])

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setBranches(data || [])
    } catch (err) {
      console.error('지점 조회 오류:', err)
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
      setUsers(data || [])
    } catch (err) {
      console.error('직원 조회 오류:', err)
      alert('직원 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId) => {
    if (!window.confirm('이 직원을 승인하시겠습니까?')) return

    setLoading(true)
    try {
      const targetUser = users.find(u => u.id === userId)
      let referralCode = null
      
      if (targetUser) {
        referralCode = await generateReferralCode(targetUser.user_type)
      }

      const updateData = {
        status: 'approved',
        approved_at: new Date().toISOString()
      }

      if (referralCode) {
        updateData.referral_code = referralCode
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)

      if (error) throw error

      if (referralCode) {
        alert(`직원이 승인되었습니다!\n고유코드: ${referralCode}`)
      } else {
        alert('직원이 승인되었습니다!')
      }
      
      fetchUsers()
    } catch (err) {
      console.error('승인 오류:', err)
      alert('승인 처리 중 오류가 발생했습니다.')
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
      console.error('거부 오류:', err)
      alert('거부 처리 중 오류가 발생했습니다.')
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
      console.error('비밀번호 초기화 오류:', err)
      alert('비밀번호 초기화에 실패했습니다.')
    } finally {
      setResettingPassword(null)
    }
  }

  const openEditModal = (u) => {
    setSelectedUser(u)
    setFormData({
      name: u.name,
      branch: u.branch,
      phone: u.phone,
      user_type: u.user_type
    })
    setShowEditModal(true)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleUpdateUser = async () => {
    if (!formData.name.trim()) {
      alert('이름을 입력해주세요.')
      return
    }

    if (!window.confirm('수정하시겠습니까?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone: formData.phone,
          branch: formData.branch,
          user_type: formData.user_type
        })
        .eq('id', selectedUser.id)

      if (error) throw error

      alert('수정되었습니다!')
      setShowEditModal(false)
      fetchUsers()
    } catch (err) {
      console.error('수정 오류:', err)
      alert('수정 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`${userName}님을 삭제하시겠습니까?`)) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      alert('삭제되었습니다!')
      fetchUsers()
    } catch (err) {
      console.error('삭제 오류:', err)
      alert('삭제 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckboxChange = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleExcelDownload = async () => {
    if (selectedUsers.length === 0) {
      alert('다운로드할 직원을 선택해주세요.')
      return
    }

    try {
      setLoading(true)
      
      const selectedData = users.filter(u => selectedUsers.includes(u.id))
      
      const excelData = await Promise.all(selectedData.map(async (u) => {
        // 날짜가 없으면 자동 설정: 가입일 ~ 오늘
        const effectiveStartDate = startDate || new Date(u.created_at).toISOString().split('T')[0]
        const effectiveEndDate = endDate || new Date().toISOString().split('T')[0]

        // work_diaries에서 해당 기간의 근무시간 합계 조회
        const { data: workDiaries, error } = await supabase
          .from('work_diaries')
          .select('work_hours')
          .eq('user_id', u.id)
          .gte('work_date', effectiveStartDate)
          .lte('work_date', effectiveEndDate)

        if (error) {
          console.error(`근무일지 조회 오류 (user_id: ${u.id}):`, error)
        }

        const totalWorkHours = workDiaries?.reduce((sum, diary) => {
          return sum + (parseFloat(diary.work_hours) || 0)
        }, 0) || 0

        const maskedSSN = u.ssn ? u.ssn.substring(0, 6) + '-*******' : '-'
        const maskedAccount = u.account_number 
          ? u.account_number.substring(0, u.account_number.length - 4) + '****'
          : '-'

        return {
          '지점명': u.branch || '-',
          '이름': u.name || '-',
          '전화번호': u.phone || '-',
          '구분': u.user_type || '-',
          '근무시작일': new Date(effectiveStartDate).toLocaleDateString('ko-KR'),
          '근무종료일': new Date(effectiveEndDate).toLocaleDateString('ko-KR'),
          '총근무시간': `${totalWorkHours.toFixed(1)}시간`,
          '주민번호': maskedSSN,
          '예금주': u.account_holder || '-',
          '기관명': u.bank_name || '-',
          '계좌번호': maskedAccount
        }
      }))

      const ws = XLSX.utils.json_to_sheet(excelData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '직원목록')
      
      const dateRange = startDate && endDate 
        ? `${startDate}_${endDate}`
        : `전체기간_${new Date().toISOString().split('T')[0]}`
      
      const fileName = `직원목록_${dateRange.replace(/-/g, '')}.xlsx`
      XLSX.writeFile(wb, fileName)
      

      
    } catch (error) {
      console.error('엑셀 다운로드 오류:', error)
      alert('엑셀 파일 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBranch = !filterBranch || u.branch === filterBranch
    const matchesUserType = filterUserType === 'all' || u.user_type === filterUserType
    
    let matchesDate = true
    if (startDate || endDate) {
      const createdDate = new Date(u.created_at)
      if (startDate) matchesDate = matchesDate && createdDate >= new Date(startDate)
      if (endDate) matchesDate = matchesDate && createdDate <= new Date(endDate)
    }
    
    return matchesSearch && matchesBranch && matchesUserType && matchesDate
  })

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="bg-white border-b pb-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate('SystemAdminDashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              style={{ fontSize: '15px' }}
            >
              <ArrowLeft size={20} />
              나가기
            </button>
            
            <div className="flex items-center gap-3">
              <img 
                src="/images/logo.png" 
                alt="LAS Book" 
                className="h-10"
              />
              <h1 className="text-2xl font-bold" style={{ color: '#249689' }}>
                직원정보관리
              </h1>
            </div>

            <div className="w-24" />
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: '#249689' }}>
            검색 조건
          </h2>
          
          <div className="flex gap-4">
            {/* 이름/이메일 검색 */}
            <div className="flex-1">
              <label className="block mb-2 font-bold" style={{ fontSize: '14px' }}>
                이름 / 이메일
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="검색어를 입력하세요"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                  style={{ fontSize: '14px' }}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            {/* 지점 필터 */}
            <div className="flex-1">
              <label className="block mb-2 font-bold" style={{ fontSize: '14px' }}>
                지점
              </label>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                style={{ fontSize: '14px' }}
              >
                <option value="">전체 지점</option>
                {branches.map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 직원구분 필터 */}
            <div className="flex-1">
              <label className="block mb-2 font-bold" style={{ fontSize: '14px' }}>
                직원구분
              </label>
              <select
                value={filterUserType}
                onChange={(e) => setFilterUserType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                style={{ fontSize: '14px' }}
              >
                <option value="all">전체</option>
                <option value="점주">점주</option>
                <option value="점장">점장</option>
                <option value="직원">직원</option>
                <option value="모니터링요원">모니터링요원</option>
                <option value="계약근무">계약근무</option>
                <option value="지점관리자">지점관리자</option>
                <option value="시스템관리자">시스템관리자</option>
              </select>
            </div>

            {/* 근무 시작일 */}
            <div className="flex-1">
              <label className="block mb-2 font-bold" style={{ fontSize: '14px' }}>
                근무 시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                style={{ fontSize: '14px' }}
              />
            </div>

            {/* 근무 종료일 */}
            <div className="flex-1">
              <label className="block mb-2 font-bold" style={{ fontSize: '14px' }}>
                근무 종료일
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                style={{ fontSize: '14px' }}
              />
            </div>
          </div>

          {/* 엑셀 다운로드 버튼 */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleExcelDownload}
              
              className="flex items-center gap-2 px-6 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#249689', fontSize: '15px', borderRadius: '10px' }}
            >
              <Download size={18} />
              선택 항목 엑셀 다운로드 ({selectedUsers.length})
            </button>
          </div>
        </div>

        {/* 직원 목록 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-[#249689] rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <p className="text-gray-500" style={{ fontSize: '15px' }}>
              조건에 맞는 직원이 없습니다.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(filteredUsers.map(u => u.id))
                          } else {
                            setSelectedUsers([])
                          }
                        }}
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-bold" style={{ fontSize: '14px' }}>이름</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ fontSize: '14px' }}>이메일</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ fontSize: '14px' }}>전화번호</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ fontSize: '14px' }}>지점</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ fontSize: '14px' }}>직원구분</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ fontSize: '14px' }}>고유코드</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ fontSize: '14px' }}>상태</th>
                    <th className="px-4 py-3 text-center font-bold" style={{ fontSize: '14px' }}>관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(u.id)}
                          onChange={() => handleCheckboxChange(u.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '14px' }}>{u.name}</td>
                      <td className="px-4 py-3" style={{ fontSize: '14px' }}>{u.email}</td>
                      <td className="px-4 py-3" style={{ fontSize: '14px' }}>{u.phone || '-'}</td>
                      <td className="px-4 py-3" style={{ fontSize: '14px' }}>{u.branch}</td>
                      <td className="px-4 py-3" style={{ fontSize: '14px' }}>{u.user_type}</td>
                      <td className="px-4 py-3" style={{ fontSize: '14px', fontWeight: 'bold', color: '#249689' }}>
                        {u.referral_code || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: u.status === 'approved' ? '#D1FAE5' : u.status === 'pending' ? '#FEF3C7' : '#FEE2E2',
                            color: u.status === 'approved' ? '#065F46' : u.status === 'pending' ? '#92400E' : '#991B1B'
                          }}
                        >
                          {u.status === 'approved' ? '승인됨' : u.status === 'pending' ? '대기중' : '거부됨'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {u.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleApprove(u.id)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="승인"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleReject(u.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="거부"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="수정"
                              >
                                <Edit size={18} />
                              </button>
                              {u.id !== user.id && (
                                <button
                                  onClick={() => handlePasswordReset(u)}
                                  disabled={resettingPassword === u.id}
                                  className="p-1 hover:bg-purple-50 rounded disabled:opacity-50"
                                  style={{ color: '#7f95eb' }}
                                  title="비밀번호 초기화"
                                >
                                  <Key size={18} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(u.id, u.name)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="삭제"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 총 개수 */}
            {filteredUsers.length > 0 && (
              <div className="mt-4 px-4 pb-4 text-right text-gray-600" style={{ fontSize: '13px' }}>
                총 <strong style={{ color: '#249689' }}>{filteredUsers.length}</strong>명
              </div>
            )}
          </div>
        )}
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
                  <option value="계약근무">계약근무</option>
                  <option value="지점관리자">지점관리자</option>
                  <option value="시스템관리자">시스템관리자</option>
                </select>
              </div>

              {/* 비밀번호 초기화 버튼 */}
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