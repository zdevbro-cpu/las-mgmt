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
    '✅ 6. 송장 인쇄 기능',
    '✅ 7. 민감정보 제외 (작성일/이름/주소/연락처/주문내역/수량만 표시)',
    '✅ 8. 송장형태 출력 구현'
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



  // 송장 형태로 인쇄
  const handlePrintInvoice = () => {
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
        <title>배송 송장</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: 'Malgun Gothic', sans-serif; 
            padding: 0;
            line-height: 1.4;
          }
          
          .page {
            width: 100mm;
            padding: 8mm;
            page-break-after: always;
            border: 1px dashed #ccc;
            margin: 0 auto 5mm auto;
          }
          
          .page:last-child {
            page-break-after: auto;
          }
          
          .invoice-header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 5mm;
            margin-bottom: 5mm;
          }
          
          .invoice-header h1 {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 2mm;
          }
          
          .invoice-number {
            font-size: 10pt;
            color: #666;
          }
          
          .section {
            margin-bottom: 5mm;
          }
          
          .section-title {
            font-size: 11pt;
            font-weight: bold;
            background-color: #f0f0f0;
            padding: 2mm;
            margin-bottom: 2mm;
            border-left: 3mm solid #249689;
          }
          
          .field {
            display: flex;
            padding: 1.5mm 0;
            font-size: 10pt;
          }
          
          .field-label {
            font-weight: bold;
            width: 20mm;
            flex-shrink: 0;
          }
          
          .field-value {
            flex: 1;
            word-break: break-all;
          }
          
          .order-box {
            border: 1px solid #ddd;
            padding: 3mm;
            background-color: #fafafa;
            min-height: 20mm;
            font-size: 9pt;
            white-space: pre-wrap;
            word-break: break-word;
          }
          
          .footer {
            margin-top: 5mm;
            padding-top: 3mm;
            border-top: 1px dashed #ccc;
            text-align: center;
            font-size: 8pt;
            color: #666;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .page {
              width: 100mm;
              height: auto;
              border: none;
              margin: 0;
              padding: 8mm;
              page-break-after: always;
            }
            .page:last-child {
              page-break-after: auto;
            }
          }
        </style>
      </head>
      <body>
        ${selectedItems.map((item, index) => `
          <div class="page">
            <!-- 송장 헤더 -->
            <div class="invoice-header">
              <h1>📦 배송 송장</h1>
              <div class="invoice-number">No. ${String(index + 1).padStart(4, '0')}</div>
            </div>
            
            <!-- 수취인 정보 -->
            <div class="section">
              <div class="section-title">📍 수취인 정보</div>
              <div class="field">
                <div class="field-label">성명</div>
                <div class="field-value">${item.customer_name || '-'}</div>
              </div>
              <div class="field">
                <div class="field-label">연락처</div>
                <div class="field-value">${item.customer_phone || '-'}</div>
              </div>
              <div class="field">
                <div class="field-label">주소</div>
                <div class="field-value">${item.address || '-'}</div>
              </div>
            </div>
            
            <!-- 주문 정보 -->
            <div class="section">
              <div class="section-title">📝 주문 정보</div>
              <div class="field">
                <div class="field-label">주문일</div>
                <div class="field-value">${formatDate(item.created_at)}</div>
              </div>
              <div class="field">
                <div class="field-label">수량</div>
                <div class="field-value">${item.quantity || '-'}개</div>
              </div>
              <div style="margin-top: 2mm;">
                <div class="field-label" style="margin-bottom: 1mm;">주문내역</div>
                <div class="order-box">${item.order_info || '주문 정보 없음'}</div>
              </div>
            </div>
            
            <!-- 푸터 -->
            <div class="footer">
              LAS Book Store · 배송 송장<br/>
              발행일: ${new Date().toLocaleDateString('ko-KR')}
            </div>
          </div>
        `).join('')}
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
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

      {/* 송장 미리보기 모달 */}
      {showPreview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: '10px' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: '#249689', fontSize: '20px' }}>
                📄 배송 송장 미리보기
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* 미리보기 내용 - 송장 형태 */}
            <div className="border-2 border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 max-h-[60vh] overflow-y-auto">
              <p className="text-center text-sm text-gray-600 mb-4">
                총 {selectedItems.length}건의 송장이 생성됩니다
              </p>
              
              <div className="space-y-6">
                {selectedItems.map((item, index) => (
                  <div key={item.id} className="bg-white border-2 rounded-lg p-4 mx-auto" style={{ borderColor: '#249689', maxWidth: '400px' }}>
                    {/* 송장 헤더 */}
                    <div className="text-center pb-3 mb-3 border-b-2 border-black">
                      <h4 className="font-bold mb-1 text-lg">📦 배송 송장</h4>
                      <p className="text-xs text-gray-600">No. {String(index + 1).padStart(4, '0')}</p>
                    </div>

                    {/* 수취인 정보 */}
                    <div className="mb-3">
                      <div className="font-bold mb-2 px-2 py-1 bg-gray-100 border-l-4" style={{ borderColor: '#249689' }}>
                        📍 수취인 정보
                      </div>
                      <div className="space-y-1.5 text-sm px-2 mt-2">
                        <div className="flex gap-2">
                          <span className="font-bold min-w-16">성명</span>
                          <span>{item.customer_name || '-'}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-bold min-w-16">연락처</span>
                          <span>{item.customer_phone || '-'}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-bold min-w-16">주소</span>
                          <span className="flex-1">{item.address || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* 주문 정보 */}
                    <div className="mb-3">
                      <div className="font-bold mb-2 px-2 py-1 bg-gray-100 border-l-4" style={{ borderColor: '#249689' }}>
                        📝 주문 정보
                      </div>
                      <div className="space-y-1.5 text-sm px-2 mt-2">
                        <div className="flex gap-2">
                          <span className="font-bold min-w-16">주문일</span>
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-bold min-w-16">수량</span>
                          <span>{item.quantity || '-'}개</span>
                        </div>
                        <div className="mt-2">
                          <div className="font-bold mb-1">주문내역</div>
                          <div className="border border-gray-300 p-2 bg-gray-50 text-sm rounded" style={{ minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                            {item.order_info || '주문 정보 없음'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 푸터 */}
                    <div className="text-center pt-2 mt-3 border-t border-dashed border-gray-300 text-xs text-gray-600">
                      LAS Book Store · 배송 송장<br/>
                      발행일: {new Date().toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handlePrintInvoice}
                className="px-6 py-2.5 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
              >
                🖨️ 송장 인쇄
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