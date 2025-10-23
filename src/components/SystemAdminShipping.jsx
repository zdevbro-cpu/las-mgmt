import React, { useState, useEffect } from 'react'
import { ArrowLeft, Search, RotateCcw, Printer, Download, Truck, Building2, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function SystemAdminShipping({ user, onNavigate }) {
  const [shipments, setShipments] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedItems, setSelectedItems] = useState([])
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchBranches()
    fetchShipments()
  }, [])

  const fetchBranches = async () => {
    try {
      console.log('Fetching branches...')
      
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Load branches error:', error)
        throw error
      }

      console.log('Branches loaded:', data)
      console.log('Number of branches:', data?.length)
      
      setBranches(data || [])
    } catch (err) {
      console.error('Fetch branches error:', err)
    }
  }

  const fetchShipments = async () => {
    setLoading(true)
    try {
      console.log('Fetching shipments...')
      
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('needs_shipping', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('Shipments loaded:', data)
      setShipments(data || [])
    } catch (err) {
      console.error('Fetch shipments error:', err)
      alert('배송 목록을 불러오는 중 오류가 발생했습니다: ' + err.message)
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
        .eq('needs_shipping', true)
        .order('created_at', { ascending: false })

      // 지점 필터
      if (selectedBranch !== 'all') {
        query = query.eq('branch_name', selectedBranch)
      }

      // 날짜 필터
      if (startDate) {
        const startDateTime = new Date(startDate)
        startDateTime.setHours(0, 0, 0, 0)
        query = query.gte('created_at', startDateTime.toISOString())
      }

      if (endDate) {
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        query = query.lte('created_at', endDateTime.toISOString())
      }

      // 검색어 필터
      if (searchValue.trim()) {
        query = query.or(`customer_name.ilike.%${searchValue}%,customer_phone.ilike.%${searchValue}%,address.ilike.%${searchValue}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setShipments(data || [])

      if (!data || data.length === 0) {
        alert('검색 결과가 없습니다')
      }
    } catch (err) {
      console.error('Search error:', err)
      alert('검색 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSearchValue('')
    setStartDate('')
    setEndDate('')
    setSelectedBranch('all')
    setSelectedItems([])
    fetchShipments()
  }

  const handleCheckboxChange = (shipment) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(item => item.id === shipment.id)
      if (isSelected) {
        return prev.filter(item => item.id !== shipment.id)
      } else {
        return [...prev, shipment]
      }
    })
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems([...shipments])
    } else {
      setSelectedItems([])
    }
  }

  const handlePreview = () => {
    if (selectedItems.length === 0) {
      alert('출력할 항목을 선택해주세요')
      return
    }
    setShowPreview(true)
  }

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
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Malgun Gothic', sans-serif; padding: 0; line-height: 1.4; }
          @page { size: A4; margin: 10mm; }
          .page { width: 100%; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 5mm; page-break-after: always; padding: 5mm; }
          .page:last-child { page-break-after: auto; }
          .invoice { border: 2px solid #249689; padding: 5mm; background: white; border-radius: 3mm; display: flex; flex-direction: column; height: 100%; }
          .invoice-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 3mm; margin-bottom: 3mm; }
          .invoice-header h1 { font-size: 14pt; font-weight: bold; margin-bottom: 1mm; }
          .invoice-number { font-size: 9pt; color: #666; }
          .section { margin-bottom: 3mm; }
          .section-title { font-size: 10pt; font-weight: bold; background-color: #f0f0f0; padding: 1.5mm; margin-bottom: 1.5mm; border-left: 3mm solid #249689; }
          .field { display: flex; padding: 1mm 0; font-size: 9pt; }
          .field-label { font-weight: bold; width: 18mm; flex-shrink: 0; }
          .field-value { flex: 1; word-break: break-all; }
          .order-box { border: 1px solid #ddd; padding: 2mm; background-color: #fafafa; min-height: 15mm; max-height: 25mm; font-size: 8pt; white-space: pre-wrap; word-break: break-word; overflow: hidden; }
          .footer { margin-top: auto; padding-top: 2mm; border-top: 1px dashed #ccc; text-align: center; font-size: 7pt; color: #666; }
          @media print { body { margin: 0; padding: 0; } .page { page-break-after: always; } .page:last-child { page-break-after: auto; } }
        </style>
      </head>
      <body>
        ${(() => {
          let html = ''
          for (let i = 0; i < selectedItems.length; i += 4) {
            html += '<div class="page">'
            for (let j = i; j < Math.min(i + 4, selectedItems.length); j++) {
              const item = selectedItems[j]
              html += `
                <div class="invoice">
                  <div class="invoice-header">
                    <h1>배송 송장</h1>
                    <div class="invoice-number">No. ${String(j + 1).padStart(4, '0')}</div>
                  </div>
                  <div class="section">
                    <div class="section-title">수취인 정보</div>
                    <div class="field"><div class="field-label">성명</div><div class="field-value">${item.customer_name || '-'}</div></div>
                    <div class="field"><div class="field-label">연락처</div><div class="field-value">${item.customer_phone || '-'}</div></div>
                    <div class="field"><div class="field-label">주소</div><div class="field-value">${item.address || '-'}</div></div>
                  </div>
                  <div class="section">
                    <div class="section-title">주문 정보</div>
                    <div class="field"><div class="field-label">주문일</div><div class="field-value">${formatDate(item.created_at)}</div></div>
                    <div class="field"><div class="field-label">지점</div><div class="field-value">${item.branch_name || '-'}</div></div>
                    <div class="field"><div class="field-label">수량</div><div class="field-value">${item.quantity || '-'}개</div></div>
                    <div style="margin-top: 1.5mm;"><div class="field-label" style="margin-bottom: 1mm;">주문내역</div><div class="order-box">${item.order_details || '주문 정보 없음'}</div></div>
                  </div>
                  <div class="footer">LAS Book Store · 배송 송장<br/>발행일: ${new Date().toLocaleDateString('ko-KR')}</div>
                </div>
              `
            }
            html += '</div>'
          }
          return html
        })()}
        <script>
          window.onload = function() { setTimeout(function() { window.print(); }, 500); }
          window.onafterprint = function() { window.close(); };
        </script>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
  }

  const handleDownloadExcel = () => {
    if (selectedItems.length === 0) {
      alert('다운로드할 항목을 선택해주세요')
      return
    }

    const headers = ['번호', '주문일', '지점', '이름', '연락처', '주소', '수량', '주문내역']
    const csvData = selectedItems.map((item, index) => [
      index + 1,
      formatDate(item.created_at),
      item.branch_name || '',
      item.customer_name || '',
      item.customer_phone || '',
      item.address || '',
      item.quantity || '',
      (item.order_details || '').replace(/\n/g, ' ')
    ])

    let csvContent = '\uFEFF'
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

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    const today = new Date().toISOString().slice(0, 10)
    const fileName = `주문목록_전체_${today}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

  const isSelected = (shipment) => {
    return selectedItems.some(item => item.id === shipment.id)
  }

  const allSelected = shipments.length > 0 && selectedItems.length === shipments.length

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => onNavigate('systemAdminDashboard')}
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
                주문목록관리
              </h2>
            </div>
            <div style={{ width: '100px' }}></div>
          </div>

          {/* 검색 및 필터 */}
          <div className="mb-6 space-y-3">
            {/* 지점 선택 */}
            <div className="flex items-center gap-2">
              <label className="font-bold text-sm flex items-center gap-1" style={{ minWidth: '80px' }}>
                <Building2 size={16} />
                지점
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 bg-white disabled:bg-gray-100"
                style={{ borderRadius: '10px', fontSize: '15px' }}
              >
                <option value="all">전체 지점</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 날짜 범위 */}
            <div className="flex items-center gap-2">
              <label className="font-bold text-sm flex items-center gap-1" style={{ minWidth: '80px' }}>
                <Calendar size={16} />
                주문일자
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 disabled:bg-gray-100"
                style={{ borderRadius: '10px', fontSize: '15px' }}
              />
              <span className="font-bold">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 disabled:bg-gray-100"
                style={{ borderRadius: '10px', fontSize: '15px' }}
              />
            </div>

            {/* 검색어 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="이름, 전화번호, 주소로 검색"
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 disabled:bg-gray-100"
                style={{ borderRadius: '10px', fontSize: '15px' }}
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
              >
                <Search size={18} />
                검색
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="px-6 py-2 font-bold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-2"
                style={{ border: '2px solid #249689', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px', color: '#249689' }}
              >
                <RotateCcw size={18} />
                초기화
              </button>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              지점, 날짜, 검색어를 조합하여 검색할 수 있습니다
            </p>
          </div>

          {/* 선택된 항목 액션 */}
          {selectedItems.length > 0 && (
            <div className="mb-4 p-4 rounded-lg flex items-center justify-between" style={{ backgroundColor: '#f0fffe', border: '2px solid #249689' }}>
              <span className="font-bold" style={{ color: '#249689', fontSize: '15px' }}>
                선택된 항목: {selectedItems.length}건
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadExcel}
                  className="px-6 py-2 font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                  style={{ backgroundColor: '#10b981', color: 'white', borderRadius: '10px', fontSize: '15px' }}
                >
                  <Download size={18} />
                  엑셀 다운로드
                </button>
                <button
                  onClick={handlePreview}
                  className="px-6 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                  style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
                >
                  <Printer size={18} />
                  미리보기 및 출력
                </button>
              </div>
            </div>
          )}

          {/* 배송 목록 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th className="px-2 py-3 text-center font-bold" style={{ fontSize: '14px', borderBottom: '2px solid #249689', width: '50px' }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px', borderBottom: '2px solid #249689' }}>
                    주문일
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px', borderBottom: '2px solid #249689' }}>
                    지점
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px', borderBottom: '2px solid #249689' }}>
                    이름
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px', borderBottom: '2px solid #249689' }}>
                    연락처
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px', borderBottom: '2px solid #249689' }}>
                    주소
                  </th>
                  <th className="px-3 py-3 text-center font-bold" style={{ fontSize: '14px', borderBottom: '2px solid #249689' }}>
                    수량
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px', borderBottom: '2px solid #249689' }}>
                    주문내역
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#249689' }}></div>
                        로딩 중...
                      </div>
                    </td>
                  </tr>
                ) : shipments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      <Truck size={48} className="mx-auto mb-2 opacity-30" />
                      <p className="mb-2">배송이 필요한 주문이 없습니다</p>
                      <p className="text-sm">배송 필요 항목이 생성되면 자동으로 표시됩니다</p>
                    </td>
                  </tr>
                ) : (
                  shipments.map((shipment) => (
                    <tr
                      key={shipment.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${isSelected(shipment) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected(shipment)}
                          onChange={() => handleCheckboxChange(shipment)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '13px' }}>
                        {formatDate(shipment.created_at)}
                      </td>
                      <td className="px-3 py-3 font-bold" style={{ fontSize: '13px', color: '#249689' }}>
                        {shipment.branch_name || '-'}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '13px' }}>
                        {shipment.customer_name || '-'}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '13px' }}>
                        {shipment.customer_phone || '-'}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '13px' }}>
                        {shipment.address ? (
                          shipment.address.length > 30 ? shipment.address.substring(0, 30) + '...' : shipment.address
                        ) : '-'}
                      </td>
                      <td className="px-3 py-3 text-center font-bold" style={{ fontSize: '13px' }}>
                        {shipment.quantity || 0}개
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '13px' }}>
                        {shipment.order_details ? (
                          shipment.order_details.length > 20 ? shipment.order_details.substring(0, 20) + '...' : shipment.order_details
                        ) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 총 개수 */}
          {shipments.length > 0 && (
            <div className="mt-4 text-right text-gray-600" style={{ fontSize: '13px' }}>
              총 <strong style={{ color: '#249689' }}>{shipments.length}</strong>건
            </div>
          )}
        </div>
      </div>

      {/* 미리보기 모달 */}
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
                배송 송장 미리보기
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="border-2 border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 max-h-[60vh] overflow-y-auto">
              <p className="text-center text-sm text-gray-600 mb-4">
                총 {selectedItems.length}건의 송장이 생성됩니다 (A4 용지 1장당 4개)
              </p>
              <p className="text-xs text-gray-500 text-center mb-4">
                실제 인쇄 시 더 선명하게 출력됩니다
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handlePrintInvoice}
                className="px-6 py-2.5 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
              >
                <Printer size={18} />
                송장 인쇄
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