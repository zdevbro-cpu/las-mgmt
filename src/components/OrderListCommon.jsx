import React, { useState, useEffect } from 'react'
import { Printer, Download, Search, RotateCcw, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function OrderListCommon({ user, onNavigate, config }) {
  const [searchValue, setSearchValue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [purchases, setPurchases] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState([])
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // 시스템관리자 여부 확인
  const isSystemAdmin = user?.user_type === '시스템관리자'

  useEffect(() => {
    if (config.showBranchFilter) {
      fetchBranches()
    }
    fetchAllPurchases()
  }, [])

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setBranches(data || [])
    } catch (err) {
      console.error('지점 조회 오류:', err)
    }
  }

  const fetchAllPurchases = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })

      if (config.filterByBranch && user?.branch) {
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

      if (config.filterByBranch && user?.branch) {
        query = query.eq('branch_name', user.branch)
      }

      if (config.showBranchFilter && selectedBranch !== 'all') {
        query = query.eq('branch_name', selectedBranch)
      }

      if (searchValue.trim()) {
        const searchConditions = config.searchFields
          .map(field => `${field}.ilike.%${searchValue}%`)
          .join(',')
        query = query.or(searchConditions)
      }

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

      const { data, error } = await query

      if (error) {
        console.error('검색 오류:', error)
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
    setStartDate('')
    setEndDate('')
    setSelectedBranch('all')
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

  const formatPhoneNumber = (phone) => {
    if (!phone) return '-'
    const numbers = phone.replace(/[^\d]/g, '')
    if (numbers.length === 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
    } else if (numbers.length === 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
    }
    return phone
  }

  // 🔴 시스템관리자 전용: 삭제 확인 모달 열기
  const handleDeleteClick = (purchase, e) => {
    if (e) e.stopPropagation() // 체크박스 클릭 이벤트 방지
    setDeleteTarget(purchase)
    setShowDeleteModal(true)
  }

  // 🔴 시스템관리자 전용: 삭제 실행
  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', deleteTarget.id)

      if (error) throw error

      alert('삭제되었습니다.')
      setShowDeleteModal(false)
      setDeleteTarget(null)
      
      // 선택 항목에서 제거
      setSelectedItems(prev => prev.filter(item => item.id !== deleteTarget.id))
      
      // 목록 새로고침
      fetchAllPurchases()
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  const handlePrintInvoice = () => {
    if (selectedItems.length === 0) {
      alert('출력할 항목을 선택해주세요')
      return
    }
    
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
        <title>${config.printTitle}</title>
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
                    <h1>${config.printHeaderTitle}</h1>
                    <div class="invoice-number">No. ${String(j + 1).padStart(4, '0')}</div>
                  </div>
                  <div class="section">
                    <div class="section-title">${config.printSectionTitle}</div>
                    <div class="field"><div class="field-label">성명</div><div class="field-value">${item.customer_name || '-'}</div></div>
                    <div class="field"><div class="field-label">연락처</div><div class="field-value">${formatPhoneNumber(item.customer_phone || item.phone)}</div></div>
                    <div class="field"><div class="field-label">주소</div><div class="field-value">${item.address || '-'}</div></div>
                  </div>
                  <div class="section">
                    <div class="section-title">주문 정보</div>
                    <div class="field"><div class="field-label">주문일</div><div class="field-value">${formatDate(item.created_at)}</div></div>
                    ${config.showBranchInPrint ? `<div class="field"><div class="field-label">지점</div><div class="field-value">${item.branch_name || '-'}</div></div>` : ''}
                    <div class="field"><div class="field-label">수량</div><div class="field-value">${item.quantity || '-'}${config.quantityUnit}</div></div>
                    <div style="margin-top: 1.5mm;"><div class="field-label" style="margin-bottom: 1mm;">주문내역</div><div class="order-box">${item.order_details || '주문 정보 없음'}</div></div>
                  </div>
                  <div class="footer">${config.printFooter}<br/>발행일: ${new Date().toLocaleDateString('ko-KR')}</div>
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

    const csvData = selectedItems.map((item, index) => 
      config.excelColumns.map(col => {
        switch(col) {
          case '번호': return index + 1
          case '주문일': return formatDate(item.created_at)
          case '지점': return item.branch_name || ''
          case '이름': return item.customer_name || ''
          case '연락처': return formatPhoneNumber(item.customer_phone || item.phone)
          case '주소': return item.address || ''
          case '수량': return item.quantity || ''
          case '주문내역': return (item.order_details || '').replace(/\n/g, ' ')
          default: return ''
        }
      })
    )

    let csvContent = '\uFEFF'
    csvContent += config.excelColumns.join(',') + '\n'
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
    const fileName = config.getFileName(user, today)
    
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
      <div className={config.containerClass}>
        <div className={config.cardClass}>
          <div className={config.headerClass}>
            {config.showBackButton && (
              <button
                onClick={() => onNavigate(config.backNavigation)}
                className="flex items-center gap-2 font-bold hover:opacity-70 transition-opacity"
                style={{ color: '#249689', fontSize: '15px' }}
              >
                <span style={{ fontSize: '18px' }}>←</span>
                {config.backButtonText}
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <img 
                src="/images/logo.png" 
                alt="LAS Logo" 
                className="w-10 h-10 object-cover"
                onError={(e) => e.target.style.display = 'none'}
              />
              <h2 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
                {config.title}
              </h2>
            </div>
            <div style={{ width: '100px' }}></div>
          </div>

          {config.showBranchInfo && user?.user_type === '지점관리자' && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm" style={{ color: '#8b5cf6' }}>
                🛡️ <strong>{user.branch}</strong> 지점의 데이터만 표시됩니다
              </p>
            </div>
          )}

          <div className="mb-6">
            <div className="flex gap-2 items-center">
              {config.showBranchFilter && (
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="px-3 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px', width: '150px' }}
                >
                  <option value="all">전체 지점</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              )}
              <label className="font-bold whitespace-nowrap" style={{ color: '#000000', fontSize: '15px' }}>
                📅 주문일자
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '15px', width: '150px' }}
              />
              <span className="font-bold" style={{ color: '#000000', fontSize: '15px' }}>~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '15px', width: '150px' }}
              />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={config.searchPlaceholder}
                className="flex-1 px-4 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '15px' }}
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px', width: '120px', justifyContent: 'center' }}
              >
                <Search size={18} />
                {loading ? '검색 중...' : '검색'}
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="px-6 py-2 font-bold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                style={{ border: '2px solid #249689', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px', color: '#249689', width: '120px', justifyContent: 'center' }}
              >
                <RotateCcw size={18} />
                초기화
              </button>
            </div>
          </div>

          {selectedItems.length > 0 && (
            <div className="mb-4 p-4 rounded-lg flex items-center justify-between" style={{ backgroundColor: '#f0fffe', border: '2px solid #249689' }}>
              <span className="font-bold" style={{ color: '#249689', fontSize: '15px' }}>
                📋 선택된 항목: {selectedItems.length}건
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadExcel}
                  className="px-6 py-2 font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                  style={{ backgroundColor: '#5B7FD4', color: 'white', borderRadius: '10px', fontSize: '15px' }}
                >
                  <Download size={18} />
                  엑셀다운로드({selectedItems.length.toString().padStart(2, '0')})
                </button>
                <button
                  onClick={handlePrintInvoice}
                  className="px-6 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                  style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
                >
                  <Printer size={18} />
                  인쇄
                </button>
              </div>
            </div>
          )}

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
                  {config.tableColumns.map((col, idx) => (
                    <th key={idx} className="px-3 py-3 text-left font-bold" style={{ fontSize: '16px', borderBottom: '2px solid #249689' }}>
                      {col}
                    </th>
                  ))}
                  {isSystemAdmin && (
                    <th className="px-3 py-3 text-center font-bold" style={{ fontSize: '16px', borderBottom: '2px solid #249689', width: '80px' }}>
                      관리
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={config.tableColumns.length + (isSystemAdmin ? 2 : 1)} className="px-4 py-8 text-center" style={{ fontSize: '16px' }}>
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#249689' }}></div>
                        로딩 중...
                      </div>
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={config.tableColumns.length + (isSystemAdmin ? 2 : 1)} className="px-4 py-8 text-center text-gray-500" style={{ fontSize: '16px' }}>
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
                      {config.renderTableRow(purchase, formatDate, formatPhoneNumber)}
                      {isSystemAdmin && (
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={(e) => handleDeleteClick(purchase, e)}
                            className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded inline-flex items-center justify-center transition-colors"
                            title="삭제"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      )}
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

      {/* 🔴 삭제 확인 모달 (시스템관리자 전용) */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" style={{ borderRadius: '10px' }}>
            <h2 className="text-xl font-bold mb-4 text-center text-red-600">
              ⚠️ 삭제 확인
            </h2>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">정말로 이 주문 내역을 삭제하시겠습니까?</p>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <p><span className="font-semibold">고객명:</span> {deleteTarget.customer_name}</p>
                <p><span className="font-semibold">주문일:</span> {formatDate(deleteTarget.created_at)}</p>
                <p><span className="font-semibold">지점:</span> {deleteTarget.branch_name || '-'}</p>
                <p><span className="font-semibold">주문내역:</span> {deleteTarget.order_details || '-'}</p>
              </div>
              <p className="text-red-600 text-sm mt-4 font-semibold">※ 삭제된 데이터는 복구할 수 없습니다.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteTarget(null)
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                style={{ borderRadius: '10px' }}
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                style={{ borderRadius: '10px' }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}