import React, { useState, useEffect } from 'react'
import { ArrowLeft, Search, RotateCcw, Eye, Users, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function SystemAdminCustomers({ user, onNavigate }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      // sales 테이블에서 고유한 구매자 정보 추출
      // 🔧 수정: phone, email 필드를 customer_phone, customer_email로 alias 처리
      const { data, error } = await supabase
        .from('sales')
        .select('customer_name, phone, email, address, age')
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('🔍 조회된 원본 데이터:', data)

      // 중복 제거 (이름 + 전화번호 기준)
      const uniqueCustomers = []
      const seen = new Set()

      data.forEach(item => {
        let key
        if (item.customer_name && item.phone) {
          // 이름과 전화번호가 모두 있으면 조합을 키로 사용
          key = `${item.customer_name}-${item.phone}`
        } else if (item.email) {
          // 이메일이 있으면 이메일을 키로 사용
          key = `email-${item.email}`
        } else if (item.phone) {
          // 전화번호만 있으면 전화번호를 키로 사용
          key = `phone-${item.phone}`
        } else if (item.customer_name) {
          // 이름만 있으면 이름을 키로 사용
          key = `name-${item.customer_name}`
        } else {
          // 아무 정보도 없으면 스킵
          return
        }
        
        if (!seen.has(key)) {
          seen.add(key)
          uniqueCustomers.push(item)
        }
      })

      console.log('✅ 중복 제거 후 구매자 목록:', uniqueCustomers)
      setCustomers(uniqueCustomers)
    } catch (err) {
      console.error('❌ 구매자 조회 오류:', err)
      alert('구매자 정보를 불러오는 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      fetchCustomers()
      return
    }

    setLoading(true)
    try {
      // 🔧 수정: phone, email 필드로 검색
      const { data, error } = await supabase
        .from('sales')
        .select('customer_name, phone, email, address, age')
        .or(`customer_name.ilike.%${searchValue}%,phone.ilike.%${searchValue}%,email.ilike.%${searchValue}%`)
        .order('created_at', { ascending: false })

      if (error) throw error

      // 중복 제거 (이름 + 전화번호 기준)
      const uniqueCustomers = []
      const seen = new Set()

      data.forEach(item => {
        let key
        if (item.customer_name && item.phone) {
          // 이름과 전화번호가 모두 있으면 조합을 키로 사용
          key = `${item.customer_name}-${item.phone}`
        } else if (item.email) {
          // 이메일이 있으면 이메일을 키로 사용
          key = `email-${item.email}`
        } else if (item.phone) {
          // 전화번호만 있으면 전화번호를 키로 사용
          key = `phone-${item.phone}`
        } else if (item.customer_name) {
          // 이름만 있으면 이름을 키로 사용
          key = `name-${item.customer_name}`
        } else {
          // 아무 정보도 없으면 스킵
          return
        }
        
        if (!seen.has(key)) {
          seen.add(key)
          uniqueCustomers.push(item)
        }
      })

      setCustomers(uniqueCustomers)

      if (uniqueCustomers.length === 0) {
        alert('검색 결과가 없습니다')
      }
    } catch (err) {
      console.error('❌ 검색 오류:', err)
      alert('검색 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSearchValue('')
    fetchCustomers()
  }

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer)
    setShowModal(true)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => onNavigate('SystemAdminDashboard')}
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
              <h2 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
                구매자정보
              </h2>
            </div>
            <div style={{ width: '100px' }}></div>
          </div>

          {/* 안내 메시지 */}
          <div className="mb-6 p-3 rounded-lg" style={{ backgroundColor: '#f0f9ff', border: '2px solid #3b82f6' }}>
            <p className="text-sm" style={{ color: '#1e40af' }}>
              ℹ️ 구매자 정보는 <strong>조회만 가능</strong>하며 수정할 수 없습니다.
            </p>
          </div>

          {/* 검색 */}
          <div className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="이름, 전화번호, 이메일로 검색"
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 disabled:bg-gray-100"
                style={{ borderRadius: '10px', fontSize: '15px' }}
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px', width: '120px', justifyContent: 'center' }}
              >
                <Search size={18} />
                검색
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="px-6 py-2 font-bold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                style={{ border: '2px solid #249689', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px', color: '#249689', width: '120px', justifyContent: 'center' }}
              >
                <RotateCcw size={18} />
                초기화
              </button>
            </div>
          </div>

          {/* 구매자 목록 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th className="px-3 py-3 text-center font-bold" style={{ fontSize: '15px', borderBottom: '2px solid #249689', width: '80px' }}>
                    상세
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '15px', borderBottom: '2px solid #249689' }}>
                    이름
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '15px', borderBottom: '2px solid #249689' }}>
                    전화번호
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '15px', borderBottom: '2px solid #249689' }}>
                    주소
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '15px', borderBottom: '2px solid #249689' }}>
                    이메일
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#249689' }}></div>
                        로딩 중...
                      </div>
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      <Users size={48} className="mx-auto mb-2 opacity-30" />
                      <p className="mb-2">등록된 구매자 정보가 없습니다</p>
                      <p className="text-sm">판매 데이터가 생성되면 자동으로 표시됩니다</p>
                    </td>
                  </tr>
                ) : (
                  customers.map((customer, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleViewDetails(customer)}
                    >
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewDetails(customer)
                          }}
                          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                          style={{ color: '#249689' }}
                          title="상세보기"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                      <td className="px-3 py-3 font-bold" style={{ fontSize: '15px' }}>
                        {customer.customer_name || '-'}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '15px' }}>
                        {customer.phone || '-'}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '15px' }}>
                        {customer.address ? (
                          customer.address.length > 30 ? customer.address.substring(0, 30) + '...' : customer.address
                        ) : '-'}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '15px' }}>
                        {customer.email || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 총 개수 */}
          {customers.length > 0 && (
            <div className="mt-4 text-right text-gray-600" style={{ fontSize: '13px' }}>
              총 <strong style={{ color: '#249689' }}>{customers.length}</strong>명
            </div>
          )}
        </div>
      </div>

      {/* 구매자 상세정보 모달 */}
      {showModal && selectedCustomer && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: '10px' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: '#249689', fontSize: '20px' }}>
                👤 구매자 상세정보
              </h3>
            </div>

            {/* 구매자 기본정보 */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f0fffe', border: '2px solid #249689' }}>
              <h4 className="font-bold mb-3" style={{ color: '#249689', fontSize: '16px' }}>
                기본정보
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-bold text-gray-600 mb-1">이름</p>
                  <p className="text-sm">{selectedCustomer.customer_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-600 mb-1">나이</p>
                  <p className="text-sm">{selectedCustomer.age ? `${selectedCustomer.age}세` : '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-600 mb-1">전화번호</p>
                  <p className="text-sm">{selectedCustomer.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-600 mb-1">이메일</p>
                  <p className="text-sm break-all">{selectedCustomer.email || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-bold text-gray-600 mb-1">주소</p>
                  <p className="text-sm">{selectedCustomer.address || '-'}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                style={{ border: '2px solid #249689', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px', color: '#249689' }}
              >
                <X size={18} />
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}