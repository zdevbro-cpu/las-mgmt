import { useState, useEffect } from 'react'
import { ArrowLeft, Search, Building2, Crown, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { canAccessAllBranches, getDisplayRole, USER_TYPES } from '../constants/roles'

export default function AdminUsers({ user, onNavigate }) {
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    loadBranches()
    loadUsers()
  }, [])

  const loadBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
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
      console.log('📊 사용자 목록 로딩...')
      
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      // 점장은 자기 지점만 볼 수 있음
      if (!canAccessAllBranches(user)) {
        console.log('🔒 자기 지점만 필터링:', user.branch)
        query = query.eq('branch', user.branch)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      console.log('✅ 사용자 데이터 개수:', data?.length)
      setUsers(data || [])
      
    } catch (err) {
      console.error('❌ 사용자 로드 오류:', err)
      alert('사용자 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 승인/거부
  const handleApprove = async (userId, approve) => {
    const action = approve ? '승인' : '거부'
    if (!window.confirm(`이 사용자를 ${action}하시겠습니까?`)) return
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: approve ? 'approved' : 'rejected' })
        .eq('id', userId)
      
      if (error) throw error
      
      alert(`${action}되었습니다.`)
      loadUsers()
    } catch (err) {
      console.error('승인/거부 오류:', err)
      alert(`${action} 처리에 실패했습니다.`)
    }
  }

  // 필터링
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesBranch = !filterBranch || u.branch === filterBranch
    
    const matchesStatus = 
      filterStatus === 'all' || u.status === filterStatus
    
    return matchesSearch && matchesBranch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gray-50">
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
              {canAccessAllBranches(user) ? '회원관리' : '우리 지점 직원관리'}
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
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                title="새로고침"
              >
                🔄
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
                    권한
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
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      로딩 중...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      사용자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        <div className="flex items-center gap-2">
                          {u.name}
                          {u.user_type === USER_TYPES.SYSTEM_ADMIN && (
                            <Shield size={16} style={{ color: '#ef4444' }} title="시스템관리자" />
                          )}
                          {(u.user_type === USER_TYPES.STORE_MANAGER || u.user_type === USER_TYPES.BRANCH_MANAGER) && (
                            <Crown size={16} style={{ color: '#f59e0b' }} title="관리자" />
                          )}
                        </div>
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
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium">
                          {getDisplayRole(u.user_type)}
                        </span>
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
                        <div className="flex gap-2 justify-center flex-wrap">
                          {/* 승인 대기 중인 경우 */}
                          {u.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(u.id, true)}
                                className="px-3 py-1 rounded text-xs font-bold text-white hover:opacity-80"
                                style={{ backgroundColor: '#249689' }}
                              >
                                승인
                              </button>
                              <button
                                onClick={() => handleApprove(u.id, false)}
                                className="px-3 py-1 rounded text-xs font-bold text-white hover:opacity-80"
                                style={{ backgroundColor: '#dc2626' }}
                              >
                                거부
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
        </div>
      </div>
    </div>
  )
}