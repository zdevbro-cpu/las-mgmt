import { useState, useEffect } from 'react'
import { Search, ArrowLeft, Eye } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function PurchaseHistory({ user, onNavigate }) {
  const [searchValue, setSearchValue] = useState('')
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [showModal, setShowModal] = useState(false)

  // 페이지 로드 시 전체 판매(구매) 목록 가져오기
  useEffect(() => {
    fetchAllPurchases()
  }, [])

  // 전체 판매(구매) 목록 가져오기
  const fetchAllPurchases = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('전체 목록 조회 오류:', error)
        alert('데이터를 불러오는 중 오류가 발생했습니다: ' + error.message)
        return
      }
      
      console.log('조회된 데이터:', data)
      setPurchases(data || [])
      
      if (!data || data.length === 0) {
        console.log('데이터가 없습니다. 판매관리에서 판매 데이터를 추가하세요.')
      }
    } catch (error) {
      console.error('데이터 조회 오류:', error)
      alert('데이터를 불러오는 중 오류가 발생했습니다: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 통합 검색 기능 - 이름, 전화번호, 이메일 모두 검색
  const handleSearch = async () => {
    if (!searchValue.trim()) {
      // 검색어가 없으면 전체 목록 표시
      fetchAllPurchases()
      return
    }

    setLoading(true)
    try {
      // OR 조건으로 이름, 전화번호, 이메일 모두 검색
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .or(`customer_name.ilike.%${searchValue}%,customer_phone.ilike.%${searchValue}%,customer_email.ilike.%${searchValue}%`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase 검색 오류:', error)
        alert('검색 중 오류가 발생했습니다: ' + error.message)
        return
      }
      
      console.log('검색 결과:', data)
      setPurchases(data || [])
      
      if (!data || data.length === 0) {
        alert('검색 결과가 없습니다')
      }
    } catch (error) {
      console.error('검색 오류:', error)
      alert('검색 중 오류가 발생했습니다: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 초기화 버튼
  const handleReset = () => {
    setSearchValue('')
    fetchAllPurchases()
  }

  const handleRowClick = (purchase) => {
    setSelectedPurchase(purchase)
    setShowModal(true)
  }

  // 구매내역 포맷팅 (구매일시 + 구매내역)
  const formatPurchaseHistory = (purchase) => {
    const date = new Date(purchase.created_at).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    const orderInfo = purchase.order_info || '주문 정보 없음'
    
    return `📅 구매일시: ${date}\n\n📦 주문내역:\n${orderInfo}`
  }

  return (
    <div className="min-h-screen bg-white">
      {/* max-w-6xl → max-w-3xl (약 1/2 크기) */}
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => onNavigate('dashboard')}
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
              <h2 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
                구매이력조회
              </h2>
            </div>
            <div style={{ width: '100px' }}></div>
          </div>

          {/* 통합 검색 영역 */}
          <div className="mb-6">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="이름, 전화번호, 이메일로 검색하세요"
                className="flex-1 px-4 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '15px' }}
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
              >
                <Search size={20} />
                {loading ? '검색 중...' : '검색'}
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="px-6 py-2 font-bold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                style={{ border: '2px solid #249689', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px', color: '#249689' }}
              >
                초기화
              </button>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              💡 이름, 전화번호, 이메일 중 아무거나 입력하세요
            </p>
          </div>

          {/* 구매 목록 테이블 - 순서 변경: 상세/이름/전화번호/이메일/주문정보 */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th className="px-2 py-3 text-center font-bold" style={{ fontSize: '14px', borderBottom: '2px solid #249689', width: '50px' }}>
                    상세
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px', borderBottom: '2px solid #249689' }}>
                    이름
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px', borderBottom: '2px solid #249689' }}>
                    전화번호
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px', borderBottom: '2px solid #249689' }}>
                    이메일
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px', borderBottom: '2px solid #249689' }}>
                    주문정보
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center" style={{ fontSize: '14px' }}>
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#249689' }}></div>
                        로딩 중...
                      </div>
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500" style={{ fontSize: '14px' }}>
                      <div>
                        <p className="mb-2">등록된 판매 내역이 없습니다</p>
                        <p className="text-sm">판매관리에서 판매 데이터를 추가하세요</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  purchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-2 py-3 text-center">
                        <button
                          onClick={() => handleRowClick(purchase)}
                          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                          style={{ color: '#249689' }}
                          title="상세 보기"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                      <td 
                        className="px-3 py-3 cursor-pointer" 
                        style={{ fontSize: '14px' }}
                        onClick={() => handleRowClick(purchase)}
                      >
                        {purchase.customer_name}
                      </td>
                      <td 
                        className="px-3 py-3 cursor-pointer" 
                        style={{ fontSize: '14px' }}
                        onClick={() => handleRowClick(purchase)}
                      >
                        {purchase.customer_phone}
                      </td>
                      <td 
                        className="px-3 py-3 cursor-pointer" 
                        style={{ fontSize: '14px' }}
                        onClick={() => handleRowClick(purchase)}
                      >
                        {purchase.customer_email}
                      </td>
                      <td 
                        className="px-3 py-3 cursor-pointer" 
                        style={{ fontSize: '14px' }}
                        onClick={() => handleRowClick(purchase)}
                      >
                        {purchase.order_info?.substring(0, 20)}{purchase.order_info?.length > 20 ? '...' : ''}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 총 개수 표시 */}
          {purchases.length > 0 && (
            <div className="mt-4 text-right text-gray-600" style={{ fontSize: '13px' }}>
              총 <strong style={{ color: '#249689' }}>{purchases.length}</strong>건
            </div>
          )}
        </div>
      </div>

      {/* 상세 정보 모달 - max-w-2xl → max-w-xl (약 90% 축소) */}
      {showModal && selectedPurchase && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl p-5 max-w-xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: '10px' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold" style={{ color: '#249689', fontSize: '20px' }}>
                구매 상세 정보
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* 구매자 정보 그룹 */}
              <div className="border-2 rounded-lg p-4" style={{ borderColor: '#249689', backgroundColor: '#f0fffe' }}>
                <h4 className="font-bold mb-3" style={{ color: '#249689', fontSize: '15px' }}>
                  👤 구매자 정보
                </h4>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="font-bold w-20 text-sm">이름:</span>
                    <span className="text-sm">{selectedPurchase.customer_name || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-20 text-sm">전화번호:</span>
                    <span className="text-sm">{selectedPurchase.customer_phone || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-20 text-sm">이메일:</span>
                    <span className="text-sm break-all">{selectedPurchase.customer_email || '-'}</span>
                  </div>
                  {selectedPurchase.address && (
                    <div className="flex">
                      <span className="font-bold w-20 text-sm">주소:</span>
                      <span className="text-sm">{selectedPurchase.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 구매내역 그룹 */}
              <div className="border-2 rounded-lg p-4" style={{ borderColor: '#249689', backgroundColor: '#f0fffe' }}>
                <h4 className="font-bold mb-3" style={{ color: '#249689', fontSize: '15px' }}>
                  📦 구매내역
                </h4>
                <textarea
                  value={formatPurchaseHistory(selectedPurchase)}
                  readOnly
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 bg-white text-sm"
                  style={{ 
                    borderRadius: '10px',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }}
                />
              </div>

              {/* 결제 정보 (있는 경우) */}
              {(selectedPurchase.payment_method || selectedPurchase.payment_amount || selectedPurchase.quantity) && (
                <div className="border-2 rounded-lg p-4" style={{ borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}>
                  <h4 className="font-bold mb-3" style={{ color: '#6b7280', fontSize: '15px' }}>
                    💳 결제 정보
                  </h4>
                  <div className="space-y-2">
                    {selectedPurchase.payment_method && (
                      <div className="flex">
                        <span className="font-bold w-20 text-sm">결제방법:</span>
                        <span className="text-sm">{selectedPurchase.payment_method}</span>
                      </div>
                    )}
                    {selectedPurchase.payment_amount && (
                      <div className="flex">
                        <span className="font-bold w-20 text-sm">결제금액:</span>
                        <span className="text-sm">{selectedPurchase.payment_amount.toLocaleString()}원</span>
                      </div>
                    )}
                    {selectedPurchase.quantity && (
                      <div className="flex">
                        <span className="font-bold w-20 text-sm">수량:</span>
                        <span className="text-sm">{selectedPurchase.quantity}개</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 font-bold rounded-lg hover:bg-gray-100 transition-colors text-sm"
                style={{ border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}