import { useState, useEffect } from 'react'
import { ArrowLeft, Search, Calendar, User, Building2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AdminWorkDiary({ user, onNavigate }) {
  const [workDiaries, setWorkDiaries] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [branches, setBranches] = useState([])

  useEffect(() => {
    loadBranches()
    loadWorkDiaries()
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

  const loadWorkDiaries = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('work_diaries')
        .select(`
          *,
          users:user_id (
            name,
            branch,
            user_type
          )
        `)
        .order('work_date', { ascending: false })
      
      // 지점관리자는 자신의 지점만 볼 수 있음
      if (user?.user_type === '지점관리자') {
        query = query.eq('users.branch', user.branch)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      setWorkDiaries(data || [])
    } catch (err) {
      console.error('근무일지 로드 오류:', err)
      alert('근무일지를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const filteredDiaries = workDiaries.filter(diary => {
    const matchesSearch = diary.users?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBranch = !filterBranch || diary.users?.branch === filterBranch
    return matchesSearch && matchesBranch
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
              근무일지 관리
            </h1>
          </div>
          <div style={{ width: '100px' }}></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2">
              <label className="font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                <User size={18} className="inline mr-1" />
                이름
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="이름을 입력하세요"
                className="flex-1 px-4 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '15px' }}
              />
            </div>
            
            {user?.user_type === '상위관리자' && (
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
            
            <button 
              onClick={loadWorkDiaries}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              🔄
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    근무일
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    지점
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    이름
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    출근시간
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    퇴근시간
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    근무시간
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    매출
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
                ) : filteredDiaries.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      근무일지가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredDiaries.map((diary) => (
                    <tr key={diary.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {new Date(diary.work_date).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {diary.users?.branch || '-'}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {diary.users?.name || '-'}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {diary.start_time || '-'}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {diary.end_time || '-'}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {diary.work_hours ? `${diary.work_hours}시간` : '-'}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {diary.sales ? `${Number(diary.sales).toLocaleString()}원` : '-'}
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