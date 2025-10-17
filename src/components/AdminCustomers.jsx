import { useState, useEffect } from 'react'
import { ArrowLeft, Search, Building2, User } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AdminCustomers({ user, onNavigate }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [branches, setBranches] = useState([])

  useEffect(() => {
    loadBranches()
    loadCustomers()
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

  const loadCustomers = async () => {
    setLoading(true)
    try {
      console.log('📊 구매자 정보 로딩 시작...')
      
      // ✅ sales 테이블에서 데이터 가져오기
      let query = supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
      
      // 지점관리자는 자신의 지점만 볼 수 있음
      if (user?.user_type === '지점관리자') {
        query = query.eq('branch_name', user.branch)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('❌ Supabase 오류:', error)
        throw error
      }
      
      console.log('✅ 구매자 데이터:', data)
      setCustomers(data || [])
      
    } catch (err) {
      console.error('❌ 구매자 정보 로드 오류:', err)
      alert(`구매자 정보를 불러오는데 실패했습니다.\n오류: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.customer_phone?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesBranch = !filterBranch || customer.branch_name === filterBranch
    
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
              구매자정보 관리
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
                <Search size={18} className="inline mr-1" />
                검색
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="이름, 전화번호, 이메일"
                className="flex-1 px-4 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '15px' }}
              />
            </div>
            
            {(user?.user_type === '시스템관리자' || user?.user_type === '관리자') && (
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
              onClick={loadCustomers}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              title="새로고침"
            >
              🔄
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    지점
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    이름
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    전화번호
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    이메일
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    주소
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    결제방법
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    수량
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    등록일
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
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">
                      구매자 정보가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {customer.branch_name || customer.user_branch || '-'}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {customer.customer_name || '-'}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {customer.phone || customer.customer_phone || '-'}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {customer.email || customer.customer_email || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {customer.address || '-'}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {customer.payment_method || '-'}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {customer.quantity || '-'}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {customer.created_at ? new Date(customer.created_at).toLocaleDateString('ko-KR') : '-'}
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