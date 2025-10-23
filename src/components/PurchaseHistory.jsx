import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PurchaseHistory({ user, onNavigate }) {
  const [searchValue, setSearchValue] = useState('')
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [allPurchaseHistory, setAllPurchaseHistory] = useState([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchAllPurchases()
  }, [])

  const fetchAllPurchases = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })

      // 지점관리자는 자신의 지점만 볼 수 있음
      if (user?.user_type === '지점관리자' && user?.branch) {
        query = query.eq('branch_name', user.branch)
      }

      const { data, error } = await query

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

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      fetchAllPurchases()
      return
    }

    setLoading(true)
    try {
      let query = supabase
        .from('sales')
        .select('*')
        .or(`customer_name.ilike.%${searchValue}%,customer_phone.ilike.%${searchValue}%,customer_email.ilike.%${searchValue}%`)
        .order('created_at', { ascending: false })

      // 지점관리자는 자신의 지점만 볼 수 있음
      if (user?.user_type === '지점관리자' && user?.branch) {
        query = query.eq('branch_name', user.branch)
      }

      const { data, error } = await query

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

  const handleReset = () => {
    setSearchValue('')
    fetchAllPurchases()
  }

  const fetchSamePersonHistory = async (purchase) => {
    try {
      let query = supabase
        .from('sales')
        .select('*')
        .or(`customer_name.eq.${purchase.customer_name},customer_phone.eq.${purchase.customer_phone}`)
        .order('created_at', { ascending: false })

      // 지점관리자는 자신의 지점만
      if (user?.user_type === '지점관리자' && user?.branch) {
        query = query.eq('branch_name', user.branch)
      }

      const { data, error } = await query

      if (error) {
        console.error('동일인 구매이력 조회 오류:', error)
        return [purchase]
      }

      console.log('동일인 구매이력:', data)
      return data || [purchase]
    } catch (error) {
      console.error('동일인 구매이력 조회 오류:', error)
      return [purchase]
    }
  }

  const handleRowClick = async (purchase) => {
    setSelectedPurchase(purchase)
    setShowModal(true)
    
    const history = await fetchSamePersonHistory(purchase)
    setAllPurchaseHistory(history)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatSinglePurchase = (purchase, index) => {
    const date = formatDateTime(purchase.created_at)
    const orderInfo = purchase.order_info || '주문 정보 없음'
    const quantity = purchase.quantity ? `${purchase.quantity}개` : ''
    const paymentMethod = purchase.payment_method || ''
    
    return `[${index + 1}번째 구매]
📅 구매일시: ${date}
💳 결제방법: ${paymentMethod}
📦 수량: ${quantity}
📝 주문내역: ${orderInfo}
${purchase.depositor ? `💰 입금자: ${purchase.depositor}` : ''}
${purchase.deposit_bank ? `🏦 입금기관: ${purchase.deposit_bank}` : ''}
`
  }

  const formatAllPurchaseHistory = () => {
    if (!allPurchaseHistory || allPurchaseHistory.length === 0) {
      return '구매이력이 없습니다.'
    }

    const totalCount = allPurchaseHistory.length
    const header = `📊 총 구매횟수: ${totalCount}회\n${'='.repeat(50)}\n\n`
    
    const historyText = allPurchaseHistory
      .map((purchase, index) => formatSinglePurchase(purchase, index))
      .join('\n' + '-'.repeat(50) + '\n\n')

    return header + historyText
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 font-bold hover:opacity-70 transition-opacity"
              style={{ color: '#249689', fontSize: '15px' }}
            >
              <span style={{ fontSize: '18px' }}>←</span>
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
                구매이력
              </h2>
            </div>
            <div style={{ width: '100px' }}></div>
          </div>

          {/* 지점관리자 안내 */}
          {user?.user_type === '지점관리자' && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm" style={{ color: '#8b5cf6' }}>
                🛡️ <strong>{user.branch}</strong> 지점의 데이터만 표시됩니다
              </p>
            </div>
          )}

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
                <span style={{ fontSize: '18px' }}>🔍</span>
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

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th className="px-2 py-3 text-center font-bold" style={{ fontSize: '16px', borderBottom: '2px solid #249689', width: '50px' }}>
                    상세
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '16px', borderBottom: '2px solid #249689' }}>
                    이름
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '16px', borderBottom: '2px solid #249689' }}>
                    전화번호
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '16px', borderBottom: '2px solid #249689' }}>
                    이메일
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '16px', borderBottom: '2px solid #249689' }}>
                    주문정보
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '16px', borderBottom: '2px solid #249689' }}>
                    구매일
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center" style={{ fontSize: '16px' }}>
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#249689' }}></div>
                        로딩 중...
                      </div>
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500" style={{ fontSize: '16px' }}>
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
                          style={{ color: '#249689', fontSize: '18px' }}
                          title="상세 보기"
                        >
                          👁️
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
                        style={{ fontSize: '16px' }}
                        onClick={() => handleRowClick(purchase)}
                      >
                        {purchase.customer_phone}
                      </td>
                      <td 
                        className="px-3 py-3 cursor-pointer" 
                        style={{ fontSize: '16px' }}
                        onClick={() => handleRowClick(purchase)}
                      >
                        {purchase.customer_email}
                      </td>
                      <td 
                        className="px-3 py-3 cursor-pointer" 
                        style={{ fontSize: '16px' }}
                        onClick={() => handleRowClick(purchase)}
                      >
                        {purchase.order_info?.substring(0, 20)}{purchase.order_info?.length > 20 ? '...' : ''}
                      </td>
                      <td 
                        className="px-3 py-3 cursor-pointer" 
                        style={{ fontSize: '16px' }}
                        onClick={() => handleRowClick(purchase)}
                      >
                        {formatDate(purchase.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {purchases.length > 0 && (
            <div className="mt-4 text-right text-gray-600" style={{ fontSize: '13px' }}>
              총 <strong style={{ color: '#249689' }}>{purchases.length}</strong>건
            </div>
          )}
        </div>
      </div>

      {showModal && selectedPurchase && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl p-4 max-w-md w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: '10px' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: '#249689', fontSize: '17px' }}>
                구매 상세 정보
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="border-2 rounded-lg p-3" style={{ borderColor: '#249689', backgroundColor: '#f0fffe' }}>
                <h4 className="font-bold mb-2" style={{ color: '#249689', fontSize: '16px' }}>
                  👤 구매자 정보
                </h4>
                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="font-bold w-20 text-xs">이름:</span>
                    <span className="text-xs">{selectedPurchase.customer_name || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-20 text-xs">전화번호:</span>
                    <span className="text-xs">{selectedPurchase.customer_phone || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-20 text-xs">이메일:</span>
                    <span className="text-xs break-all">{selectedPurchase.customer_email || '-'}</span>
                  </div>
                  {selectedPurchase.address && (
                    <div className="flex">
                      <span className="font-bold w-20 text-xs">주소:</span>
                      <span className="text-xs">{selectedPurchase.address}</span>
                    </div>
                  )}
                  {selectedPurchase.age && (
                    <div className="flex">
                      <span className="font-bold w-20 text-xs">나이:</span>
                      <span className="text-xs">{selectedPurchase.age}세</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-2 rounded-lg p-3" style={{ borderColor: '#249689', backgroundColor: '#f0fffe' }}>
                <h4 className="font-bold mb-2" style={{ color: '#249689', fontSize: '14px' }}>
                  📦 전체 구매이력
                  <span className="ml-2 text-xs font-normal text-gray-600">
                    (동일인 기준: 이름 또는 연락처 일치)
                  </span>
                </h4>
                <textarea
                  value={formatAllPurchaseHistory()}
                  readOnly
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 bg-white text-xs"
                  style={{ 
                    borderRadius: '10px',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 font-bold rounded-lg hover:bg-gray-100 transition-colors text-xs"
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