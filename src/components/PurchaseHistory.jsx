import { useState } from 'react'
import { Search, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'


// Supabase 클라이언트 초기화
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

let supabase = null
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
}

export default function PurchaseHistory({ user, onNavigate }) {
  const [searchType, setSearchType] = useState('phone')
  const [searchValue, setSearchValue] = useState('')
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      alert('검색어를 입력해주세요')
      return
    }

    if (!supabase) {
      alert('데이터베이스 연결 오류. 환경 변수를 확인하세요.')
      console.error('Supabase 초기화 실패. .env 파일을 확인하세요.')
      return
    }

    setLoading(true)
    try {
      let query = supabase.from('purchases').select('*')
      
      if (searchType === 'phone') {
        query = query.ilike('customer_phone', `%${searchValue}%`)
      } else if (searchType === 'name') {
        query = query.ilike('customer_name', `%${searchValue}%`)
      } else if (searchType === 'email') {
        query = query.ilike('customer_email', `%${searchValue}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase 쿼리 오류:', error)
        throw error
      }
      
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

  const handleRowClick = (purchase) => {
    setSelectedPurchase(purchase)
    setShowModal(true)
  }

  // 환경 변수 경고 메시지
  const showEnvWarning = !supabaseUrl || !supabaseKey

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-6">
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

          {/* 환경 변수 경고 */}
          {showEnvWarning && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>⚠️ 환경 변수 오류:</strong> Supabase URL 또는 Key가 설정되지 않았습니다.
              <br />
              <small>.env 파일을 확인하거나 Vercel 환경 변수를 설정하세요.</small>
            </div>
          )}

          {/* 검색 영역 */}
          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="px-4 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '15px' }}
              >
                <option value="phone">전화번호</option>
                <option value="name">이름</option>
                <option value="email">이메일</option>
              </select>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={`${searchType === 'phone' ? '전화번호' : searchType === 'name' ? '이름' : '이메일'}을 입력하세요`}
                className="flex-1 px-4 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '15px' }}
              />
              <button
                onClick={handleSearch}
                disabled={loading || showEnvWarning}
                className="px-6 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
              >
                <Search size={20} />
                {loading ? '검색 중...' : '검색'}
              </button>
            </div>
          </div>

          {/* 구매 목록 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th className="px-4 py-3 text-left font-bold" style={{ fontSize: '15px', borderBottom: '2px solid #249689' }}>
                    구매일시
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ fontSize: '15px', borderBottom: '2px solid #249689' }}>
                    이름
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ fontSize: '15px', borderBottom: '2px solid #249689' }}>
                    전화번호
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ fontSize: '15px', borderBottom: '2px solid #249689' }}>
                    이메일
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ fontSize: '15px', borderBottom: '2px solid #249689' }}>
                    주문정보
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center" style={{ fontSize: '15px' }}>
                      검색 중...
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500" style={{ fontSize: '15px' }}>
                      검색어를 입력하고 검색 버튼을 눌러주세요
                    </td>
                  </tr>
                ) : (
                  purchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      onClick={() => handleRowClick(purchase)}
                      className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {new Date(purchase.created_at).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {purchase.customer_name}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {purchase.customer_phone}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {purchase.customer_email}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {purchase.order_info?.substring(0, 30)}{purchase.order_info?.length > 30 ? '...' : ''}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 상세 정보 모달 */}
      {showModal && selectedPurchase && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: '10px' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold" style={{ color: '#249689', fontSize: '24px' }}>
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
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  👤 구매자 이름
                </label>
                <input
                  type="text"
                  value={selectedPurchase.customer_name || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  📞 전화번호
                </label>
                <input
                  type="text"
                  value={selectedPurchase.customer_phone || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  📧 이메일
                </label>
                <input
                  type="text"
                  value={selectedPurchase.customer_email || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  📅 구매일시
                </label>
                <input
                  type="text"
                  value={selectedPurchase.created_at ? new Date(selectedPurchase.created_at).toLocaleString('ko-KR') : ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  📦 주문 정보
                </label>
                <textarea
                  value={selectedPurchase.order_info || ''}
                  readOnly
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 font-bold rounded-lg hover:bg-gray-100 transition-colors"
                style={{ border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
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