import React, { useState, useEffect } from 'react'
import { ArrowLeft, Search, RotateCcw, Eye, Package, Printer } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function SystemAdminPurchases({ user, onNavigate }) {
  const [purchases, setPurchases] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [customerPurchases, setCustomerPurchases] = useState([])

  useEffect(() => {
    fetchBranches()
    fetchPurchases()
  }, [])

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name')

      if (error) throw error

      setBranches(data || [])
    } catch (err) {
      console.error('❌ 지점 조회 오류:', err)
    }
  }

  const fetchPurchases = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      console.log('✅ 구매이력:', data)
      setPurchases(data || [])
    } catch (err) {
      console.error('❌ 구매이력 조회 오류:', err)
      alert('구매이력을 불러오는 중 오류가 발생했습니다: ' + err.message)
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
        query = query.or(`customer_name.ilike.%${searchValue}%,customer_phone.ilike.%${searchValue}%,customer_email.ilike.%${searchValue}%,order_details.ilike.%${searchValue}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setPurchases(data || [])

      if (!data || data.length === 0) {
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
    setStartDate('')
    setEndDate('')
    setSelectedBranch('all')
    fetchPurchases()
  }

  const fetchCustomerPurchaseHistory = async (customer) => {
    try {
      let query = supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })

      // 이름과 전화번호로 동일인 찾기
      if (customer.customer_name && customer.customer_phone) {
        query = query
          .eq('customer_name', customer.customer_name)
          .eq('customer_phone', customer.customer_phone)
      } else if (customer.customer_email) {
        query = query.eq('customer_email', customer.customer_email)
      } else if (customer.customer_phone) {
        query = query.eq('customer_phone', customer.customer_phone)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (err) {
      console.error('❌ 구매이력 조회 오류:', err)
      return []
    }
  }

  const handleViewDetails = async (purchase) => {
    setSelectedPurchase(purchase)
    setShowModal(true)

    // 동일인의 모든 구매이력 조회
    const history = await fetchCustomerPurchaseHistory(purchase)
    setCustomerPurchases(history)
  }

  const handlePrintDetails = () => {
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
        <title>구매 상세정보</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Malgun Gothic', sans-serif; 
            padding: 20mm; 
            line-height: 1.6;
          }
          @page { size: A4; margin: 15mm; }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #249689; 
            padding-bottom: 10px; 
            margin-bottom: 20px; 
          }
          .header h1 { 
            font-size: 24pt; 
            color: #249689; 
            margin-bottom: 5px; 
          }
          .header p { 
            font-size: 10pt; 
            color: #666; 
          }
          .section { 
            margin-bottom: 20px; 
            border: 2px solid #ddd; 
            border-radius: 8px; 
            padding: 15px; 
          }
          .section-title { 
            font-size: 14pt; 
            font-weight: bold; 
            margin-bottom: 10px; 
            padding-bottom: 8px; 
            border-bottom: 2px solid #249689; 
          }
          .section.sales { background-color: #f0f9ff; border-color: #3b82f6; }
          .section.customer { background-color: #f0fffe; border-color: #249689; }
          .section.payment { background-color: #fef3c7; border-color: #f59e0b; }
          .section.order { background-color: #f3f4f6; border-color: #9ca3af; }
          .section.history { background-color: #fef2f2; border-color: #ef4444; }
          .sales .section-title { color: #1e40af; }
          .customer .section-title { color: #249689; }
          .payment .section-title { color: #92400e; }
          .order .section-title { color: #374151; }
          .history .section-title { color: #991b1b; }
          .field { 
            display: flex; 
            padding: 5px 0; 
            font-size: 11pt; 
          }
          .field-label { 
            font-weight: bold; 
            width: 100px; 
            flex-shrink: 0; 
          }
          .field-value { 
            flex: 1; 
            word-break: break-word; 
          }
          .grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 10px; 
          }
          .history-item { 
            border: 1px solid #ddd; 
            border-radius: 5px; 
            padding: 10px; 
            margin-bottom: 10px; 
            background-color: white; 
          }
          .history-item.current { 
            background-color: #fef3c7; 
            border-color: #f59e0b; 
            border-width: 2px; 
          }
          .history-header { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px; 
            font-weight: bold; 
          }
          .history-total { 
            margin-top: 15px; 
            padding-top: 15px; 
            border-top: 2px solid #ef4444; 
            text-align: center; 
            font-size: 12pt; 
            font-weight: bold; 
          }
          .footer { 
            margin-top: 30px; 
            padding-top: 15px; 
            border-top: 1px solid #ddd; 
            text-align: center; 
            font-size: 9pt; 
            color: #666; 
          }
          @media print { 
            body { margin: 0; padding: 10mm; } 
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📦 구매 상세정보</h1>
          <p>LAS Book Store · 구매내역서</p>
          <p>발행일: ${new Date().toLocaleString('ko-KR')}</p>
        </div>

        <div class="section sales">
          <div class="section-title">판매정보</div>
          <div class="grid">
            <div class="field">
              <div class="field-label">구매일시</div>
              <div class="field-value">${formatDateTime(selectedPurchase.created_at)}</div>
            </div>
            <div class="field">
              <div class="field-label">지점</div>
              <div class="field-value">${selectedPurchase.branch_name || '-'}</div>
            </div>
            <div class="field">
              <div class="field-label">판매자</div>
              <div class="field-value">${selectedPurchase.user_name || '-'}</div>
            </div>
            <div class="field">
              <div class="field-label">판매수량</div>
              <div class="field-value">${selectedPurchase.quantity || 0}개</div>
            </div>
          </div>
        </div>

        <div class="section customer">
          <div class="section-title">구매자 정보</div>
          <div class="grid">
            <div class="field">
              <div class="field-label">이름</div>
              <div class="field-value">${selectedPurchase.customer_name || '-'}</div>
            </div>
            <div class="field">
              <div class="field-label">나이</div>
              <div class="field-value">${selectedPurchase.age ? selectedPurchase.age + '세' : '-'}</div>
            </div>
            <div class="field">
              <div class="field-label">전화번호</div>
              <div class="field-value">${selectedPurchase.customer_phone || '-'}</div>
            </div>
            <div class="field">
              <div class="field-label">이메일</div>
              <div class="field-value">${selectedPurchase.customer_email || '-'}</div>
            </div>
          </div>
          ${selectedPurchase.address ? `
            <div class="field">
              <div class="field-label">주소</div>
              <div class="field-value">${selectedPurchase.address}</div>
            </div>
          ` : ''}
        </div>

        <div class="section payment">
          <div class="section-title">결제 정보</div>
          <div class="grid">
            <div class="field">
              <div class="field-label">결제방법</div>
              <div class="field-value">${selectedPurchase.payment_method || '-'}</div>
            </div>
            ${selectedPurchase.depositor ? `
              <div class="field">
                <div class="field-label">입금자</div>
                <div class="field-value">${selectedPurchase.depositor}</div>
              </div>
            ` : ''}
            ${selectedPurchase.deposit_bank ? `
              <div class="field">
                <div class="field-label">입금기관</div>
                <div class="field-value">${selectedPurchase.deposit_bank}</div>
              </div>
            ` : ''}
          </div>
        </div>

        ${selectedPurchase.order_details ? `
          <div class="section order">
            <div class="section-title">주문 내역</div>
            <div style="white-space: pre-wrap; font-size: 10pt;">${selectedPurchase.order_details}</div>
          </div>
        ` : ''}

        ${customerPurchases.length > 1 ? `
          <div class="section history">
            <div class="section-title">📊 이 구매자의 전체 구매이력 (${customerPurchases.length}건)</div>
            ${customerPurchases.map((purchase, index) => `
              <div class="history-item ${purchase.id === selectedPurchase.id ? 'current' : ''}">
                <div class="history-header">
                  <span>구매 #${index + 1} ${purchase.id === selectedPurchase.id ? '(현재)' : ''}</span>
                  <span>${formatDate(purchase.created_at)}</span>
                </div>
                <div style="font-size: 9pt;">
                  <p><strong>지점:</strong> ${purchase.branch_name || '-'}</p>
                  <p><strong>수량:</strong> ${purchase.quantity || '-'}개</p>
                  <p><strong>결제:</strong> ${purchase.payment_method || '-'}</p>
                  ${purchase.order_details ? `<p style="margin-top: 5px; padding-top: 5px; border-top: 1px solid #ddd;"><strong>내역:</strong> ${purchase.order_details}</p>` : ''}
                </div>
              </div>
            `).join('')}
            <div class="history-total">
              총 구매수량: ${customerPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0)}개
            </div>
          </div>
        ` : ''}

        <div class="footer">
          LAS Book Store · 구매내역서<br/>
          본 문서는 구매 정보 확인용으로 발행되었습니다.
        </div>

        <script>
          window.onload = function() { 
            setTimeout(function() { window.print(); }, 500); 
          }
          window.onafterprint = function() { window.close(); };
        </script>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
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

  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 통계 계산
  const totalQuantity = purchases.reduce((sum, p) => sum + (p.quantity || 0), 0)
  const totalSales = purchases.length

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
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
                구매이력
              </h2>
            </div>
            <div style={{ width: '100px' }}></div>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f0f9ff', border: '2px solid #3b82f6' }}>
              <p className="text-sm font-bold mb-1" style={{ color: '#1e40af' }}>총 판매건수</p>
              <p className="text-2xl font-bold" style={{ color: '#1e40af' }}>{totalSales}건</p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f0fdf4', border: '2px solid #10b981' }}>
              <p className="text-sm font-bold mb-1" style={{ color: '#065f46' }}>총 판매수량</p>
              {/* 여기에 toLocaleString() 적용 */}
              <p className="text-2xl font-bold" style={{ color: '#065f46' }}>{totalQuantity.toLocaleString()}권</p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#fef3c7', border: '2px solid #f59e0b' }}>
              <p className="text-sm font-bold mb-1" style={{ color: '#92400e' }}>조회 지점</p>
              <p className="text-2xl font-bold" style={{ color: '#92400e' }}>
                {selectedBranch === 'all' ? '전체' : selectedBranch}
              </p>
            </div>
          </div>

          {/* 검색 및 필터 */}
          <div className="mb-6 space-y-3">
            {/* 지점 선택 */}
            <div className="flex items-center gap-2">
              <label className="font-bold text-sm" style={{ minWidth: '80px' }}>
                🏢 지점
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
              <label className="font-bold text-sm" style={{ minWidth: '80px' }}>
                📅 구매일자
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
                placeholder="구매자 이름, 전화번호, 이메일, 주문내역 검색"
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
                className="px-6 py-2 font-bold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                style={{ border: '2px solid #249689', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px', color: '#249689' }}
              >
                <RotateCcw size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              💡 지점, 날짜, 검색어를 조합하여 검색할 수 있습니다
            </p>
          </div>

          {/* 구매이력 목록 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th className="px-2 py-3 text-center font-bold" style={{ fontSize: '14px', borderBottom: '2px solid #249689', width: '50px' }}>
                    상세
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px', borderBottom: '2px solid #249689' }}>
                    구매일시
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px', borderBottom: '2px solid #249689' }}>
                    지점
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px', borderBottom: '2px solid #249689' }}>
                    구매자
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px', borderBottom: '2px solid #249689' }}>
                    연락처
                  </th>
                  <th className="px-3 py-3 text-center font-bold" style={{ fontSize: '14px', borderBottom: '2px solid #249689' }}>
                    수량
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '14px', borderBottom: '2px solid #249689' }}>
                    결제방법
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
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      <Package size={48} className="mx-auto mb-2 opacity-30" />
                      <p className="mb-2">구매이력이 없습니다</p>
                      <p className="text-sm">판매 데이터가 생성되면 자동으로 표시됩니다</p>
                    </td>
                  </tr>
                ) : (
                  purchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleViewDetails(purchase)}
                    >
                      <td className="px-2 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewDetails(purchase)
                          }}
                          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                          style={{ color: '#249689' }}
                          title="상세보기"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '13px' }}>
                        {formatDate(purchase.created_at)}
                      </td>
                      <td className="px-3 py-3 font-bold" style={{ fontSize: '13px', color: '#249689' }}>
                        {purchase.branch_name || '-'}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '13px' }}>
                        {purchase.customer_name || '-'}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '13px' }}>
                        {purchase.customer_phone || '-'}
                      </td>
                      <td className="px-3 py-3 text-center font-bold" style={{ fontSize: '13px' }}>
                        {purchase.quantity || 0}권
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '13px' }}>
                        {purchase.payment_method || '-'}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '13px' }}>
                        {purchase.order_details ? (
                          purchase.order_details.length > 20 
                            ? purchase.order_details.substring(0, 20) + '...' 
                            : purchase.order_details
                        ) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 총 개수 */}
          {purchases.length > 0 && (
            <div className="mt-4 text-right text-gray-600" style={{ fontSize: '13px' }}>
              총 <strong style={{ color: '#249689' }}>{purchases.length}</strong>건
            </div>
          )}
        </div>
      </div>

      {/* 구매 상세정보 모달 */}
      {showModal && selectedPurchase && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: '10px' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: '#249689', fontSize: '20px' }}>
                📦 구매 상세정보
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintDetails}
                  className="px-4 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                  style={{ backgroundColor: '#249689', fontSize: '14px', borderRadius: '10px' }}
                  title="출력"
                >
                  <Printer size={16} />
                  출력
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-bold rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px', fontSize: '14px' }}
                >
                  닫기
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* 판매정보 */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f0f9ff', border: '2px solid #3b82f6' }}>
                <h4 className="font-bold mb-3" style={{ color: '#1e40af', fontSize: '16px' }}>
                  판매정보
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-bold text-gray-600 mb-1">구매일시</p>
                    <p>{formatDateTime(selectedPurchase.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600 mb-1">지점</p>
                    <p className="font-bold" style={{ color: '#249689' }}>{selectedPurchase.branch_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600 mb-1">판매자</p>
                    <p>{selectedPurchase.user_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600 mb-1">판매수량</p>
                    <p className="font-bold">{selectedPurchase.quantity || 0}개</p>
                  </div>
                </div>
              </div>

              {/* 구매자 정보 */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f0fffe', border: '2px solid #249689' }}>
                <h4 className="font-bold mb-3" style={{ color: '#249689', fontSize: '16px' }}>
                  구매자 정보
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-bold text-gray-600 mb-1">이름</p>
                    <p>{selectedPurchase.customer_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600 mb-1">나이</p>
                    <p>{selectedPurchase.age ? `${selectedPurchase.age}세` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600 mb-1">전화번호</p>
                    <p>{selectedPurchase.customer_phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600 mb-1">이메일</p>
                    <p className="break-all">{selectedPurchase.customer_email || '-'}</p>
                  </div>
                  {selectedPurchase.address && (
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-gray-600 mb-1">주소</p>
                      <p>{selectedPurchase.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 결제 정보 */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#fef3c7', border: '2px solid #f59e0b' }}>
                <h4 className="font-bold mb-3" style={{ color: '#92400e', fontSize: '16px' }}>
                  결제 정보
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-bold text-gray-600 mb-1">결제방법</p>
                    <p className="font-bold">{selectedPurchase.payment_method || '-'}</p>
                  </div>
                  {selectedPurchase.depositor && (
                    <div>
                      <p className="text-xs font-bold text-gray-600 mb-1">입금자</p>
                      <p>{selectedPurchase.depositor}</p>
                    </div>
                  )}
                  {selectedPurchase.deposit_bank && (
                    <div>
                      <p className="text-xs font-bold text-gray-600 mb-1">입금기관</p>
                      <p>{selectedPurchase.deposit_bank}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 주문 내역 */}
              {selectedPurchase.order_details && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#f3f4f6', border: '2px solid #9ca3af' }}>
                  <h4 className="font-bold mb-3" style={{ color: '#374151', fontSize: '16px' }}>
                    주문 내역
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedPurchase.order_details}</p>
                </div>
              )}

              {/* 동일 구매자의 전체 구매이력 */}
              {customerPurchases.length > 1 && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#fef2f2', border: '2px solid #ef4444' }}>
                  <h4 className="font-bold mb-3" style={{ color: '#991b1b', fontSize: '16px' }}>
                    📊 이 구매자의 전체 구매이력 ({customerPurchases.length}건)
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {customerPurchases.map((purchase, index) => (
                      <div
                        key={purchase.id}
                        className={`p-3 rounded-lg border-2 ${
                          purchase.id === selectedPurchase.id 
                            ? 'bg-yellow-50 border-yellow-400' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-sm" style={{ color: '#249689' }}>
                            구매 #{index + 1}
                            {purchase.id === selectedPurchase.id && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded">
                                현재
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(purchase.created_at)}
                          </span>
                        </div>
                        <div className="text-xs space-y-1">
                          <p><span className="font-bold">지점:</span> {purchase.branch_name || '-'}</p>
                          <p><span className="font-bold">수량:</span> {purchase.quantity || '-'}개</p>
                          <p><span className="font-bold">결제:</span> {purchase.payment_method || '-'}</p>
                          {purchase.order_details && (
                            <p className="mt-2 pt-2 border-t border-gray-200">
                              <span className="font-bold">내역:</span> {purchase.order_details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-sm font-bold text-center" style={{ color: '#991b1b' }}>
                      총 구매수량: {customerPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0)}개
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}