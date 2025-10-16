import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ShippingList({ user, onNavigate }) {
  const [searchValue, setSearchValue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState([])
  const [showPreview, setShowPreview] = useState(false)

  // TODO List
  const todoList = [
    '✅ 1. PurchaseHistory.jsx와 동일한 톤앤매너 적용',
    '✅ 2. 날짜 검색 조건 추가 (시작일, 종료일)',
    '✅ 3. 각 목록 앞에 체크박스 배치',
    '✅ 4. 체크한 항목의 이름/연락처/주소/구매내용 표시',
    '✅ 5. PDF 미리보기 기능',
    '✅ 6. PDF 열기/다른이름으로저장/취소 기능'
  ]

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

      const { data, error } = await query

      if (error) {
        console.error('전체 목록 조회 오류:', error)
        alert('데이터를 불러오는 중 오류가 발생했습니다: ' + error.message)
        return
      }
      
      setPurchases(data || [])
    } catch (error) {
      console.error('데이터 조회 오류:', error)
      alert('데이터를 불러오는 중 오류가 발생했습니다: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })

      // 검색어 필터
      if (searchValue.trim()) {
        query = query.or(`customer_name.ilike.%${searchValue}%,customer_phone.ilike.%${searchValue}%,customer_email.ilike.%${searchValue}%`)
      }

      // 날짜 필터
      if (startDate) {
        query = query.gte('created_at', new Date(startDate).toISOString())
      }
      if (endDate) {
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        query = query.lte('created_at', endDateTime.toISOString())
      }

      const { data, error } = await query

      if (error) {
        console.error('검색 오류:', error)
        alert('검색 중 오류가 발생했습니다: ' + error.message)
        return
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

  const handleReset = () => {
    setSearchValue('')
    setStartDate('')
    setEndDate('')
    setSelectedItems([])
    fetchAllPurchases()
  }

  const handleCheckboxChange = (purchase) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(item => item.id === purchase.id)
      if (isSelected) {
        return prev.filter(item => item.id !== purchase.id)
      } else {
        return [...prev, purchase]
      }
    })
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems([...purchases])
    } else {
      setSelectedItems([])
    }
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

  // PDF 미리보기 열기
  const handlePreview = () => {
    if (selectedItems.length === 0) {
      alert('출력할 항목을 선택해주세요')
      return
    }
    setShowPreview(true)
  }

  // PDF 생성 및 다운로드
  const handleDownloadPDF = () => {
    // 실제 구현시 jsPDF 또는 다른 PDF 라이브러리 사용
    alert('PDF 다운로드 기능은 jsPDF 라이브러리를 추가하여 구현할 수 있습니다.')
    // 예시: const doc = new jsPDF()...
  }

  // PDF 인쇄 (새 창에서 열기)
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.')
      return
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>주문 발송 목록</title>
        <style>
          body { 
            font-family: 'Malgun Gothic', sans-serif; 
            padding: 20px;
            line-height: 1.6;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 3px solid #249689;
            padding-bottom: 15px;
          }
          .header h1 { 
            color: #249689; 
            margin: 0;
          }
          .item { 
            border: 2px solid #249689; 
            padding: 15px; 
            margin-bottom: 20px;
            page-break-inside: avoid;
            border-radius: 8px;
          }
          .item-header {
            background-color: #f0fffe;
            padding: 10px;
            margin: -15px -15px 15px -15px;
            border-bottom: 2px solid #249689;
            font-weight: bold;
            font-size: 16px;
          }
          .field { 
            margin: 8px 0;
            display: flex;
          }
          .field-label { 
            font-weight: bold; 
            width: 100px;
            color: #249689;
          }
          .field-value {
            flex: 1;
          }
          .order-info {
            background-color: #f9fafb;
            padding: 10px;
            margin-top: 10px;
            border-left: 3px solid #249689;
            white-space: pre-wrap;
          }
          @media print {
            body { margin: 0; }
            .item { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📦 주문 발송 목록</h1>
          <p>생성일시: ${new Date().toLocaleString('ko-KR')}</p>
          <p>총 ${selectedItems.length}건</p>
        </div>
        ${selectedItems.map((item, index) => `
          <div class="item">
            <div class="item-header">[${index + 1}] ${item.customer_name}</div>
            <div class="field">
              <span class="field-label">이름:</span>
              <span class="field-value">${item.customer_name || '-'}</span>
            </div>
            <div class="field">
              <span class="field-label">연락처:</span>
              <span class="field-value">${item.customer_phone || '-'}</span>
            </div>
            <div class="field">
              <span class="field-label">주소:</span>
              <span class="field-value">${item.address || '-'}</span>
            </div>
            ${item.customer_email ? `
            <div class="field">
              <span class="field-label">이메일:</span>
              <span class="field-value">${item.customer_email}</span>
            </div>
            ` : ''}
            ${item.age ? `
            <div class="field">
              <span class="field-label">나이:</span>
              <span class="field-value">${item.age}세</span>
            </div>
            ` : ''}
            <div class="field">
              <span class="field-label">주문일시:</span>
              <span class="field-value">${formatDateTime(item.created_at)}</span>
            </div>
            <div class="field">
              <span class="field-label">결제방법:</span>
              <span class="field-value">${item.payment_method || '-'}</span>
            </div>
            ${item.quantity ? `
            <div class="field">
              <span class="field-label">수량:</span>
              <span class="field-value">${item.quantity}개</span>
            </div>
            ` : ''}
            <div class="order-info">
              <strong>📝 주문내용:</strong><br/>
              ${item.order_info || '주문 정보 없음'}
            </div>
          </div>
        `).join('')}
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    
    // 문서 로드 후 인쇄 다이얼로그 자동 실행
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const isSelected = (purchase) => {
    return selectedItems.some(item => item.id === purchase.id)
  }

  const allSelected = purchases.length > 0 && selectedItems.length === purchases.length

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 font-bold hover:opacity-70 transition-opacity"
              style={{ color: '#249689', fontSize: '15px' }}
            >
              <span style={{ fontSize: '18px' }}>←</span>
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
                주문발송목록
              </h2>
            </div>
            <div style={{ width: '100px' }}></div>
          </div>

          {/* 검색 영역 */}
          <div className="mb-6 space-y-3">
            {/* 날짜 검색 */}
            <div className="flex gap-2 items-center">
              <label className="font-bold" style={{ color: '#000000', fontSize: '15px', minWidth: '80px' }}>
                📅 주문일자
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '15px' }}
              />
              <span className="font-bold" style={{ color: '#000000', fontSize: '15px' }}>~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '15px' }}
              />
            </div>

            {/* 검색어 입력 */}
            <div className="flex gap-2">
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
              💡 날짜와 검색어를 조합하여 검색할 수 있습니다
            </p>
          </div>

          {/* 선택된 항목 액션 버튼 */}
          {selectedItems.length > 0 && (
            <div className="mb-4 p-4 rounded-lg flex items-center justify-between" style={{ backgroundColor: '#f0fffe', border: '2px solid #249689' }}>
              <span className="font-bold" style={{ color: '#249689', fontSize: '15px' }}>
                📋 선택된 항목: {selectedItems.length}건
              </span>
              <button
                onClick={handlePreview}
                className="px-6 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
              >
                📄 미리보기 및 출력
              </button>
            </div>
          )}

          {/* 목록 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th className="px-2 py-3 text-center font-bold" style={{ fontSize: '16px', borderBottom: '2px solid #249689', width: '50px' }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '16px', borderBottom: '2px solid #249689' }}>
                    이름
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '16px', borderBottom: '2px solid #249689' }}>
                    연락처
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '16px', borderBottom: '2px solid #249689' }}>
                    주소
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '16px', borderBottom: '2px solid #249689' }}>
                    주문정보
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '16px', borderBottom: '2px solid #249689' }}>
                    주문일
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
                        <p className="mb-2">등록된 주문 내역이 없습니다</p>
                        <p className="text-sm">판매관리에서 판매 데이터를 추가하세요</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  purchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${isSelected(purchase) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected(purchase)}
                          onChange={() => handleCheckboxChange(purchase)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '14px' }}>
                        {purchase.customer_name}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '14px' }}>
                        {purchase.customer_phone}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '14px' }}>
                        {purchase.address?.substring(0, 30)}{purchase.address?.length > 30 ? '...' : ''}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '14px' }}>
                        {purchase.order_info?.substring(0, 20)}{purchase.order_info?.length > 20 ? '...' : ''}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '14px' }}>
                        {formatDate(purchase.created_at)}
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

      {/* PDF 미리보기 모달 */}
      {showPreview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: '10px' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: '#249689', fontSize: '20px' }}>
                📄 주문 발송 목록 미리보기
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* 미리보기 내용 */}
            <div className="border-2 border-gray-200 rounded-lg p-6 mb-4 bg-gray-50 max-h-[60vh] overflow-y-auto">
              <div className="text-center mb-6 pb-4" style={{ borderBottom: '3px solid #249689' }}>
                <h2 className="font-bold mb-2" style={{ color: '#249689', fontSize: '24px' }}>
                  📦 주문 발송 목록
                </h2>
                <p className="text-sm text-gray-600">
                  생성일시: {new Date().toLocaleString('ko-KR')} | 총 {selectedItems.length}건
                </p>
              </div>

              {selectedItems.map((item, index) => (
                <div key={item.id} className="mb-6 p-4 border-2 rounded-lg" style={{ borderColor: '#249689', backgroundColor: 'white' }}>
                  <div className="mb-3 pb-2 font-bold" style={{ borderBottom: '2px solid #249689', color: '#249689', fontSize: '16px' }}>
                    [{index + 1}] {item.customer_name}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="font-bold w-24" style={{ color: '#249689' }}>이름:</span>
                      <span>{item.customer_name || '-'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-bold w-24" style={{ color: '#249689' }}>연락처:</span>
                      <span>{item.customer_phone || '-'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-bold w-24" style={{ color: '#249689' }}>주소:</span>
                      <span>{item.address || '-'}</span>
                    </div>
                    {item.customer_email && (
                      <div className="flex">
                        <span className="font-bold w-24" style={{ color: '#249689' }}>이메일:</span>
                        <span>{item.customer_email}</span>
                      </div>
                    )}
                    <div className="flex">
                      <span className="font-bold w-24" style={{ color: '#249689' }}>주문일시:</span>
                      <span>{formatDateTime(item.created_at)}</span>
                    </div>
                    <div className="flex">
                      <span className="font-bold w-24" style={{ color: '#249689' }}>결제방법:</span>
                      <span>{item.payment_method || '-'}</span>
                    </div>
                    {item.quantity && (
                      <div className="flex">
                        <span className="font-bold w-24" style={{ color: '#249689' }}>수량:</span>
                        <span>{item.quantity}개</span>
                      </div>
                    )}
                    <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#f0fffe', border: '1px solid #249689' }}>
                      <div className="font-bold mb-1" style={{ color: '#249689' }}>📝 주문내용:</div>
                      <div className="whitespace-pre-wrap text-sm">{item.order_info || '주문 정보 없음'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handlePrintPDF}
                className="px-6 py-2.5 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
              >
                🖨️ 열기/인쇄
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-6 py-2.5 font-bold rounded-lg hover:bg-gray-100 transition-colors"
                style={{ border: '2px solid #249689', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px', color: '#249689' }}
              >
                💾 다른이름으로 저장
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2.5 font-bold rounded-lg hover:bg-gray-100 transition-colors"
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