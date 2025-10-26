import React, { useState, useEffect } from 'react'
import { ArrowLeft, Eye, Search, RotateCcw, X, Printer, Package } from 'lucide-react'
import { supabase } from '../../lib/supabase'

/**
 * 구매이력 관리 공통 컴포넌트
 * 
 * @param {Object} user - 로그인한 사용자 정보
 * @param {Function} onNavigate - 페이지 이동 함수
 * @param {Boolean} isAdminView - 관리자 뷰 여부 (true: 전체 조회, false: 지점별 조회)
 * @param {String} title - 페이지 타이틀
 * @param {Boolean} showBranchFilter - 지점 필터 표시 여부
 * @param {Boolean} showDateFilter - 날짜 필터 표시 여부
 * @param {Boolean} showPrintButton - 출력 버튼 표시 여부
 * @param {String} navigateBack - 뒤로가기 페이지 (기본: 'Dashboard')
 */
export default function PurchaseHistoryBase({
  user,
  onNavigate,
  isAdminView = false,
  title = '구매이력',
  showBranchFilter = true,
  showDateFilter = true,
  showPrintButton = true,
  navigateBack = 'Dashboard'
}) {
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
    if (showBranchFilter && isAdminView) {
      fetchBranches()
    }
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

      // 🔑 핵심: 관리자가 아니면 자신의 지점만 조회
      if (!isAdminView && user?.branch) {
        query = query.eq('branch_name', user.branch)
      }

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

      // 관리자가 아니면 자신의 지점만
      if (!isAdminView && user?.branch) {
        query = query.eq('branch_name', user.branch)
      }

      // 지점 필터
      if (isAdminView && selectedBranch !== 'all') {
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
        query = query.or(`customer_name.ilike.%${searchValue}%,phone.ilike.%${searchValue}%,email.ilike.%${searchValue}%,customer_phone.ilike.%${searchValue}%,customer_email.ilike.%${searchValue}%,order_details.ilike.%${searchValue}%`)
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

      // 관리자가 아니면 자신의 지점만
      if (!isAdminView && user?.branch) {
        query = query.eq('branch_name', user.branch)
      }

      const customerPhone = customer.phone || customer.customer_phone
      const customerEmail = customer.email || customer.customer_email

      if (customer.customer_name && customerPhone) {
        query = query
          .eq('customer_name', customer.customer_name)
          .or(`phone.eq.${customerPhone},customer_phone.eq.${customerPhone}`)
      } else if (customerEmail) {
        query = query.or(`email.eq.${customerEmail},customer_email.eq.${customerEmail}`)
      } else if (customerPhone) {
        query = query.or(`phone.eq.${customerPhone},customer_phone.eq.${customerPhone}`)
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
        <title>구매이력상세</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Malgun Gothic', sans-serif; 
            padding: 20mm; 
            line-height: 1.6;
          }
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
          .field { display: flex; margin-bottom: 8px; }
          .field-label { 
            font-weight: bold; 
            width: 120px; 
            color: #666; 
          }
          @media print { 
            body { margin: 0; padding: 10mm; } 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>구매이력상세</h1>
          <p>출력일: ${new Date().toLocaleDateString('ko-KR')}</p>
        </div>

        <div class="section">
          <div class="section-title">판매정보</div>
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
            <div class="field-value">${selectedPurchase.quantity || 0}권</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">구매자 정보</div>
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
            <div class="field-value">${selectedPurchase.phone || selectedPurchase.customer_phone || '-'}</div>
          </div>
          <div class="field">
            <div class="field-label">이메일</div>
            <div class="field-value">${selectedPurchase.email || selectedPurchase.customer_email || '-'}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">결제 정보</div>
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

        ${selectedPurchase.order_details ? `
        <div class="section">
          <div class="section-title">주문 내역</div>
          <div>${selectedPurchase.order_details}</div>
        </div>
        ` : ''}

        <script>
          window.print();
        </script>
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()
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

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => onNavigate(navigateBack)}
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
                {title}
              </h2>
            </div>
            <div style={{ width: '100px' }}></div>
          </div>

          {/* 검색 및 필터 - 1줄로 통합 */}
          <div className="mb-6">
            <div className="flex gap-2 items-center flex-wrap">
              {/* 지점 필터 (관리자만) */}
              {showBranchFilter && isAdminView && (
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 bg-white disabled:bg-gray-100"
                  style={{ borderRadius: '10px', fontSize: '15px', minWidth: '150px' }}
                >
                  <option value="all">전체 지점</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.name}>{branch.name}</option>
                  ))}
                </select>
              )}

              {/* 날짜 필터 (관리자만) */}
              {showDateFilter && isAdminView && (
                <>
                  <span className="text-sm font-bold" style={{ color: '#249689' }}>구매기간</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 disabled:bg-gray-100"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                  />
                  <span className="flex items-center">~</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 disabled:bg-gray-100"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                  />
                </>
              )}

              {/* 검색 조건 */}
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="이름, 전화번호, 이메일로 검색"
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 disabled:bg-gray-100"
                style={{ borderRadius: '10px', fontSize: '15px', minWidth: '200px' }}
              />

              {/* 검색 버튼 */}
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px', width: '120px', justifyContent: 'center' }}
              >
                <Search size={18} />
                검색
              </button>

              {/* 초기화 버튼 */}
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

          {/* 테이블 */}
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
                  {isAdminView && (
                    <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '15px', borderBottom: '2px solid #249689' }}>
                      지점
                    </th>
                  )}
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '15px', borderBottom: '2px solid #249689' }}>
                    주문정보
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '15px', borderBottom: '2px solid #249689' }}>
                    구매일
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isAdminView ? "6" : "5"} className="px-4 py-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#249689' }}></div>
                        로딩 중...
                      </div>
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={isAdminView ? "6" : "5"} className="px-4 py-8 text-center text-gray-500">
                      <Package size={48} className="mx-auto mb-2 opacity-30" />
                      <p className="mb-2">등록된 구매이력이 없습니다</p>
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
                      <td className="px-3 py-3 text-center">
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
                      <td className="px-3 py-3 font-bold" style={{ fontSize: '15px' }}>
                        {purchase.customer_name || '-'}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '15px' }}>
                        {purchase.phone || purchase.customer_phone || '-'}
                      </td>
                      {isAdminView && (
                        <td className="px-3 py-3" style={{ fontSize: '15px' }}>
                          {purchase.branch_name || '-'}
                        </td>
                      )}
                      <td className="px-3 py-3" style={{ fontSize: '15px' }}>
                        {purchase.order_details ? (
                          purchase.order_details.length > 30 ? purchase.order_details.substring(0, 30) + '...' : purchase.order_details
                        ) : '-'}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '15px' }}>
                        {formatDate(purchase.created_at)}
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
            className="bg-white rounded-lg shadow-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: '10px' }}
          >
            {/* 로고 + 타이틀 */}
            <div className="flex items-center justify-center mb-6">
              <img 
                src="/images/logo.png" 
                alt="LAS Logo" 
                className="w-8 h-8 object-cover mr-2"
                onError={(e) => e.target.style.display = 'none'}
              />
              <h3 className="font-bold" style={{ color: '#249689', fontSize: '24px' }}>
                구매이력상세
              </h3>
            </div>

            <div className="space-y-4">
              {/* 판매정보 */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f0f9ff', border: '2px solid #3b82f6' }}>
                <h4 className="font-bold mb-3" style={{ color: '#1e40af', fontSize: '16px' }}>
                  판매정보
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-bold text-xs text-gray-600 mb-1">구매일시</p>
                    <p>{formatDateTime(selectedPurchase.created_at)}</p>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-600 mb-1">지점</p>
                    <p className="font-bold" style={{ color: '#249689' }}>{selectedPurchase.branch_name || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-600 mb-1">판매자</p>
                    <p>{selectedPurchase.user_name || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-600 mb-1">판매수량</p>
                    <p className="font-bold">{selectedPurchase.quantity || 0}권</p>
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
                    <p className="font-bold text-xs text-gray-600 mb-1">이름</p>
                    <p>{selectedPurchase.customer_name || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-600 mb-1">나이</p>
                    <p>{selectedPurchase.age ? `${selectedPurchase.age}세` : '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-600 mb-1">전화번호</p>
                    <p>{selectedPurchase.phone || selectedPurchase.customer_phone || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-600 mb-1">이메일</p>
                    <p className="break-all">{selectedPurchase.email || selectedPurchase.customer_email || '-'}</p>
                  </div>
                  {selectedPurchase.address && (
                    <div className="col-span-2">
                      <p className="font-bold text-xs text-gray-600 mb-1">주소</p>
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
                    <p className="font-bold text-xs text-gray-600 mb-1">결제방법</p>
                    <p className="font-bold">{selectedPurchase.payment_method || '-'}</p>
                  </div>
                  {selectedPurchase.depositor && (
                    <div>
                      <p className="font-bold text-xs text-gray-600 mb-1">입금자</p>
                      <p>{selectedPurchase.depositor}</p>
                    </div>
                  )}
                  {selectedPurchase.deposit_bank && (
                    <div>
                      <p className="font-bold text-xs text-gray-600 mb-1">입금기관</p>
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
                          <p><span className="font-bold">수량:</span> {purchase.quantity || '-'}권</p>
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
                      총 구매수량: {customerPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0)}권
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 출력과 닫기 버튼 - 최하단 우측 정렬 */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
              {showPrintButton && (
                <button
                  onClick={handlePrintDetails}
                  className="px-6 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                  style={{ backgroundColor: '#249689', fontSize: '15px', borderRadius: '10px', width: '120px', justifyContent: 'center' }}
                >
                  <Printer size={18} />
                  출력
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                style={{ border: '2px solid #249689', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px', color: '#249689', width: '120px', justifyContent: 'center' }}
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