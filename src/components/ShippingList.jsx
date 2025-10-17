import { useState, useEffect } from 'react'

export default function ShippingList() {
  const [searchValue, setSearchValue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState([])
  const [showPreview, setShowPreview] = useState(false)

  // 데모 사용자 정보
  const user = {
    branch: '강남지점',
    name: '홍길동'
  }

  // 데모 데이터
  const demoData = [
    {
      id: '1',
      customer_name: '김철수',
      customer_phone: '010-1234-5678',
      customer_email: 'kim@example.com',
      address: '서울시 강남구 테헤란로 123',
      order_info: 'LAS Book 기초편 2권\nLAS Book 심화편 1권',
      quantity: 3,
      created_at: new Date('2025-10-15').toISOString()
    },
    {
      id: '2',
      customer_name: '이영희',
      customer_phone: '010-2345-6789',
      customer_email: 'lee@example.com',
      address: '서울시 서초구 서초대로 456',
      order_info: 'LAS Book 실전편 1권',
      quantity: 1,
      created_at: new Date('2025-10-16').toISOString()
    },
    {
      id: '3',
      customer_name: '박민수',
      customer_phone: '010-3456-7890',
      customer_email: 'park@example.com',
      address: '서울시 송파구 올림픽로 789',
      order_info: 'LAS Book 종합세트 1세트',
      quantity: 1,
      created_at: new Date('2025-10-17').toISOString()
    }
  ]

  useEffect(() => {
    fetchAllPurchases()
  }, [])

  const fetchAllPurchases = async () => {
    setLoading(true)
    setTimeout(() => {
      setPurchases(demoData)
      setLoading(false)
    }, 500)
  }

  const handleSearch = async () => {
    setLoading(true)
    setTimeout(() => {
      let filtered = [...demoData]

      if (searchValue.trim()) {
        filtered = filtered.filter(item => 
          item.customer_name.includes(searchValue) ||
          item.customer_phone.includes(searchValue) ||
          item.customer_email.includes(searchValue)
        )
      }

      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        filtered = filtered.filter(item => new Date(item.created_at) >= start)
      }

      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        filtered = filtered.filter(item => new Date(item.created_at) <= end)
      }

      setPurchases(filtered)
      setLoading(false)

      if (filtered.length === 0) {
        alert('검색 결과가 없습니다')
      }
    }, 500)
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

  const handlePreview = () => {
    if (selectedItems.length === 0) {
      alert('출력할 항목을 선택해주세요')
      return
    }
    setShowPreview(true)
  }

  const handlePrintInvoice = () => {
    alert('인쇄 기능은 실제 환경에서 작동합니다')
  }

  // 엑셀 다운로드 - 파일명에 지점명과 사용자 이름 포함
  const handleDownloadExcel = () => {
    if (selectedItems.length === 0) {
      alert('다운로드할 항목을 선택해주세요')
      return
    }

    // CSV 형식으로 데이터 생성
    const headers = ['번호', '주문일', '이름', '연락처', '주소', '수량', '주문내역']
    const csvData = selectedItems.map((item, index) => [
      index + 1,
      formatDate(item.created_at),
      item.customer_name || '',
      item.customer_phone || '',
      item.address || '',
      item.quantity || '',
      (item.order_info || '').replace(/\n/g, ' ')
    ])

    // CSV 문자열 생성
    let csvContent = '\uFEFF' // UTF-8 BOM
    csvContent += headers.join(',') + '\n'
    csvData.forEach(row => {
      const escapedRow = row.map(cell => {
        const cellStr = String(cell)
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return '"' + cellStr.replace(/"/g, '""') + '"'
        }
        return cellStr
      })
      csvContent += escapedRow.join(',') + '\n'
    })

    // Blob 생성 및 다운로드
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    // 파일명: 주문발송목록_지점명_이름_날짜.csv
    const today = new Date().toISOString().slice(0, 10)
    const fileName = `주문발송목록_${user.branch}_${user.name}_${today}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
              onClick={() => alert('대시보드로 이동')}
              className="flex items-center gap-2 font-bold hover:opacity-70 transition-opacity"
              style={{ color: '#249689', fontSize: '15px' }}
            >
              <span style={{ fontSize: '18px' }}>←</span>
              뒤로가기
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-10 h-10 bg-teal-600 rounded flex items-center justify-center text-white font-bold text-xl">
                LAS
              </div>
              <h2 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
                주문발송목록
              </h2>
            </div>
            <div style={{ width: '100px' }}></div>
          </div>

          {/* 사용자 정보 표시 */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-bold" style={{ color: '#249689' }}>📍 지점:</span>
              <span>{user.branch}</span>
              <span className="font-bold ml-4" style={{ color: '#249689' }}>👤 담당자:</span>
              <span>{user.name}</span>
            </div>
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
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadExcel}
                  className="px-6 py-2 font-bold rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#28a745', color: 'white', borderRadius: '10px', fontSize: '15px' }}
                >
                  📊 엑셀 다운로드
                </button>
                <button
                  onClick={handlePreview}
                  className="px-6 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
                >
                  📄 미리보기 및 출력
                </button>
              </div>
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
            className="bg-white rounded-lg shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-2xl" style={{ color: '#249689' }}>
                📄 배송 송장 미리보기
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-center font-bold" style={{ color: '#249689' }}>
                총 {selectedItems.length}건의 송장이 생성됩니다
              </p>
              <p className="text-center text-sm text-gray-600 mt-1">
                파일명: 주문발송목록_{user.branch}_{user.name}_{new Date().toISOString().slice(0, 10)}.csv
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 max-h-[50vh] overflow-y-auto p-2">
              {selectedItems.map((item, index) => (
                <div key={item.id} className="border-2 rounded-lg p-4" style={{ borderColor: '#249689' }}>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-gray-200">
                    <h4 className="font-bold text-lg" style={{ color: '#249689' }}>
                      📦 배송 송장 #{index + 1}
                    </h4>
                    <span className="text-sm text-gray-500">주문일: {formatDate(item.created_at)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold mb-2" style={{ color: '#249689' }}>📍 수취인 정보</p>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-bold">성명:</span> {item.customer_name}</p>
                        <p><span className="font-bold">연락처:</span> {item.customer_phone}</p>
                        <p><span className="font-bold">주소:</span> {item.address}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-bold mb-2" style={{ color: '#249689' }}>📝 주문 정보</p>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-bold">수량:</span> {item.quantity}개</p>
                        <div>
                          <p className="font-bold mb-1">주문내역:</p>
                          <div className="bg-gray-50 p-2 rounded border border-gray-200 text-xs">
                            {item.order_info || '주문 정보 없음'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={handlePrintInvoice}
                className="px-6 py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#249689' }}
              >
                🖨️ 송장 인쇄
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-3 font-bold rounded-lg hover:bg-gray-100 transition-colors border-2"
                style={{ borderColor: '#7f95eb' }}
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