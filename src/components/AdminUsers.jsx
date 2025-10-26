import { useState, useEffect } from 'react'
import { ArrowLeft, Search, Building2, Edit, Trash2, CheckCircle, XCircle, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { canAccessAllBranches } from '../constants/roles'
import * as XLSX from 'xlsx'

export default function AdminUsers({ user, onNavigate }) {
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
  const [itemsPerPage, setItemsPerPage] = useState(30)
  const [currentPage, setCurrentPage] = useState(1)
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
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setBranches(data || [])
    } catch (err) {
      console.error('지점 목록 로드 오류:', err)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!canAccessAllBranches(user)) {
        query = query.eq('branch', user.branch)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      setUsers(data || [])
      
    } catch (err) {
      console.error('사용자 로드 오류:', err)
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
      
      if (approve) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('referral_code')
          .eq('id', userId)
          .single()
        
        if (!existingUser?.referral_code) {
          const { data: allCodes } = await supabase
            .from('users')
            .select('referral_code')
            .not('referral_code', 'is', null)
            .order('referral_code', { ascending: false })
            .limit(1)
          
          const lastCode = allCodes?.[0]?.referral_code || 'LAS0000'
          const lastNumber = parseInt(lastCode.replace('LAS', ''))
          const newNumber = lastNumber + 1
          updateData.referral_code = `LAS${String(newNumber).padStart(4, '0')}`
        }
      }
      
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
      
      if (error) throw error
      
      alert(`${action}되었습니다.`)
      loadUsers()
    } catch (err) {
      console.error('승인/거부 오류:', err)
      alert(`${action} 처리에 실패했습니다.`)
    }
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('정말로 이 사용자를 삭제하시겠습니까?')) return
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
      
      if (error) throw error
      
      alert('삭제되었습니다.')
      loadUsers()
    } catch (err) {
      console.error('삭제 오류:', err)
      alert('삭제에 실패했습니다.')
    }
  }

  const handleEdit = (u) => {
    setFormData({
      id: u.id,
      name: u.name,
      branch: u.branch,
      phone: u.phone,
      user_type: u.user_type
    })
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!formData.id) return
    
    if (!window.confirm('수정 내용을 저장하시겠습니까?')) return
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone: formData.phone,
          branch: formData.branch,
          user_type: formData.user_type
        })
        .eq('id', formData.id)
      
      if (error) throw error
      
      alert('수정되었습니다.')
      setShowEditModal(false)
      loadUsers()
    } catch (err) {
      console.error('수정 오류:', err)
      alert('수정에 실패했습니다.')
    }
  }

  const handleCheckboxChange = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  // 엑셀 다운로드 - 공통 함수 사용
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

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // 필터 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterBranch, filterUserType, startDate, endDate, itemsPerPage])

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="bg-white border-b pb-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate('AdminDashboard')}
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
          <div className="flex gap-4">
            {/* 검색어 */}
            <div className="flex-1">
              <label className="block mb-2 font-bold" style={{ fontSize: '14px' }}>검색</label>
              <input
                type="text"
                placeholder="이름 또는 이메일"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '14px' }}
              />
            </div>

            {/* 지점 필터 */}
            {canAccessAllBranches(user) && (
              <div className="flex-1">
                <label className="block mb-2 font-bold" style={{ fontSize: '14px' }}>지점</label>
                <select
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '14px' }}
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

            {/* 직원구분 필터 */}
            <div className="flex-1">
              <label className="block mb-2 font-bold" style={{ fontSize: '14px' }}>직원구분</label>
              <select
                value={filterUserType}
                onChange={(e) => setFilterUserType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '14px' }}
              >
                <option value="all">전체</option>
                <option value="점주">점주</option>
                <option value="점장">점장</option>
                <option value="직원">직원</option>
                <option value="모니터링요원">모니터링요원</option>
                <option value="계약근무">계약근무</option>
                <option value="지점관리자">지점관리자</option>
              </select>
            </div>

            {/* 근무시작일 */}
            <div className="flex-1">
              <label className="block mb-2 font-bold" style={{ fontSize: '14px' }}>근무시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '14px' }}
              />
            </div>

            {/* 근무종료일 */}
            <div className="flex-1">
              <label className="block mb-2 font-bold" style={{ fontSize: '14px' }}>근무종료일</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '14px' }}
              />
            </div>

            {/* 엑셀 다운로드 버튼 */}
            <div className="flex-1 flex items-end">
              <button
                onClick={handleExcelDownload}
                
                className="w-full py-2 flex items-center justify-center gap-2 text-white font-bold rounded-lg hover:opacity-90"
                style={{ backgroundColor: '#5B7FC8', fontSize: '15px', borderRadius: '10px', height: '42px' }}
              >
                <Download size={18} />
                엑셀다운로드({filteredUsers.length.toString().padStart(2, '0')})
              </button>
            </div>
          </div>

          {/* 총 인원수와 페이지 선택 */}
          <div className="mt-4 flex justify-start items-center gap-4">
            <div className="text-gray-600" style={{ fontSize: '15px' }}>
              총 <strong style={{ color: '#249689', fontSize: '16px' }}>{filteredUsers.length}</strong>명
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">페이지당:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                style={{ fontSize: '14px' }}
              >
                <option value={30}>30개</option>
                <option value={50}>50개</option>
                <option value={100}>100개</option>
              </select>
            </div>
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
                    <th className="px-4 py-3 text-left font-bold" style={{ fontSize: '14px' }}>상태</th>
                    <th className="px-4 py-3 text-center font-bold" style={{ fontSize: '14px' }}>관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedUsers.map((u) => (
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
                      <td className="px-4 py-3" style={{ fontSize: '14px' }}>{u.phone}</td>
                      <td className="px-4 py-3" style={{ fontSize: '14px' }}>{u.branch}</td>
                      <td className="px-4 py-3" style={{ fontSize: '14px' }}>{u.user_type}</td>
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
                          {u.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(u.id, true)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="승인"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleApprove(u.id, false)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="거부"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleEdit(u)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="수정"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="삭제"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지 네비게이션 */}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontSize: '14px' }}
                >
                  이전
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 border rounded ${
                          currentPage === pageNum
                            ? 'text-white font-bold'
                            : 'hover:bg-gray-50'
                        }`}
                        style={{
                          fontSize: '14px',
                          backgroundColor: currentPage === pageNum ? '#249689' : 'white',
                          borderColor: currentPage === pageNum ? '#249689' : '#d1d5db'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontSize: '14px' }}
                >
                  다음
                </button>

                <span className="ml-4 text-sm text-gray-600">
                  {currentPage} / {totalPages} 페이지
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 수정 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/images/logo.png" 
                alt="LAS Logo" 
                className="w-10 h-10 object-cover"
                onError={(e) => e.target.style.display = 'none'}
              />
              <h2 className="text-xl font-bold" style={{ color: '#249689' }}>
                직원정보수정
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-1 font-bold" style={{ fontSize: '15px' }}>이름</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              <div>
                <label className="block mb-1 font-bold" style={{ fontSize: '15px' }}>지점</label>
                <select
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                >
                  <option value="">선택</option>
                  {branches.map((branch) => (
                    <option key={branch.name} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold" style={{ fontSize: '15px' }}>전화번호</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              <div>
                <label className="block mb-1 font-bold" style={{ fontSize: '15px' }}>직원구분</label>
                <select
                  value={formData.user_type}
                  onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                >
                  <option value="점주">점주</option>
                  <option value="점장">점장</option>
                  <option value="직원">직원</option>
                  <option value="모니터링요원">모니터링요원</option>
                  <option value="계약근무">계약근무</option>
                  <option value="지점관리자">지점관리자</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleUpdate}
                className="flex-1 py-2 text-white font-bold rounded-lg hover:opacity-90"
                style={{ backgroundColor: '#249689', fontSize: '15px' }}
              >
                저장
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2 font-bold rounded-lg hover:bg-gray-50"
                style={{ border: '2px solid #7f95eb', backgroundColor: 'white', fontSize: '15px' }}
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