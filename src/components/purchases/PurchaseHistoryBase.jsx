import { useState, useEffect } from 'react'
import { ArrowLeft, Search, RotateCcw, Eye, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

/**
 * 구매이력 조회 공통 컴포넌트
 * - 시스템관리자와 지점관리자가 동일한 UI/UX로 사용
 * - props로 권한과 표시 옵션 제어
 */
export default function PurchaseHistoryBase({ 
  user, 
  onNavigate,
  isAdminView = false,           // 🔑 전체 지점 조회 여부
  title = "구매이력조회",        // 페이지 타이틀
  showBranchFilter = false,      // 지점 필터 표시 여부
  navigateBack = "Dashboard"     // 뒤로가기 경로
}) {
  const [purchases, setPurchases] = useState([])
  const [branches, setBranches] = useState([])
  const [filteredPurchases, setFilteredPurchases] = useState([])
  const [loading, setLoading] = useState(false)
  
  // 필터 상태
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchValue, setSearchValue] = useState('')
  
  // 모달 상태
  const [showModal, setShowModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // 통계 데이터
  const totalCount = filteredPurchases.length
  const totalQuantity = filteredPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0)
  
  // 조회 지점 계산
  const displayBranch = isAdminView 
    ? (selectedBranch === 'all' ? '전체' : selectedBranch)
    : (user?.branch || '-')

  useEffect(() => {
    if (showBranchFilter) {
      fetchBranches()
    }
    fetchPurchases()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [purchases, selectedBranch, startDate, endDate, searchValue])

  // 지점 목록 조회 (시스템관리자만)
  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('branch')
        .not('branch', 'is', null)
        .order('branch')

      if (error) throw error
      
      // 중복 제거
      const uniqueBranches = [...new Set(data.map(item => item.branch))]
      setBranches(uniqueBranches.map(branch => ({ branch_name: branch })))
    } catch (error) {
      console.error('지점 조회 실패:', error)
      alert('지점 목록을 불러오는데 실패했습니다.')
    }
  }

  // 구매이력 조회
  const fetchPurchases = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })

      // 🔑 지점관리자는 자신의 지점만 조회
      if (!isAdminView && user?.branch) {
        query = query.eq('user_branch', user.branch)
      }

      const { data, error } = await query

      if (error) throw error
      setPurchases(data || [])
      setFilteredPurchases(data || [])
    } catch (error) {
      console.error('구매이력 조회 실패:', error)
      alert('구매이력을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 필터 적용
  const applyFilters = () => {
    let filtered = [...purchases]

    // 지점명 필터 (시스템관리자만)
    if (showBranchFilter && selectedBranch !== 'all') {
      filtered = filtered.filter(p => p.user_branch === selectedBranch)
    }

    // 날짜 필터
    if (startDate) {
      filtered = filtered.filter(p => {
        const purchaseDate = new Date(p.created_at).toISOString().split('T')[0]
        return purchaseDate >= startDate
      })
    }
    if (endDate) {
      filtered = filtered.filter(p => {
        const purchaseDate = new Date(p.created_at).toISOString().split('T')[0]
        return purchaseDate <= endDate
      })
    }

    // 검색어 필터
    if (searchValue.trim()) {
      const search = searchValue.toLowerCase().trim()
      filtered = filtered.filter(p =>
        p.customer_name?.toLowerCase().includes(search) ||
        p.phone?.includes(search) ||
        p.depositor?.toLowerCase().includes(search)
      )
    }

    setFilteredPurchases(filtered)
  }

  const handleSearch = () => {
    applyFilters()
  }

  const handleReset = () => {
    setSelectedBranch('all')
    setStartDate('')
    setEndDate('')
    setSearchValue('')
  }

  const handleViewDetail = (purchase) => {
    setSelectedPurchase(purchase)
    setShowModal(true)
  }

  // 🔴 시스템관리자 전용: 삭제 확인 모달 열기
  const handleDeleteClick = (purchase) => {
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
      
      // 목록 새로고침
      fetchPurchases()
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  // 시스템관리자 여부 확인
  const isSystemAdmin = user?.user_type === '시스템관리자'

  // 포맷 함수들
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  const formatPhone = (phone) => {
    if (!phone) return '-'
    const cleaned = phone.toString().replace(/\D/g, '')
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    }
    return phone
  }

  const formatPrice = (price) => {
    if (!price) return '0원'
    return `${price.toLocaleString()}원`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between relative">
            {/* 왼쪽: 나가기 버튼 */}
            <button
              onClick={() => {
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
                console.log('🔙 PurchaseHistoryBase - 나가기 버튼 클릭됨')
                console.log('📌 navigateBack 원본 값:', navigateBack)
                console.log('📌 navigateBack 타입:', typeof navigateBack)
                console.log('📌 navigateBack 길이:', navigateBack?.length)
                console.log('📌 navigateBack 문자코드:', [...navigateBack].map(c => c.charCodeAt(0)))
                console.log('📌 isAdminView:', isAdminView)
                console.log('📌 title:', title)
                console.log('📌 showBranchFilter:', showBranchFilter)
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
                onNavigate(navigateBack)
              }}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={20} />
              <span>나가기</span>
            </button>
            
            {/* 중앙: 로고 + 타이틀 */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
              <img 
                src="/images/logo.png" 
                alt="LAS Logo" 
                className="w-10 h-10"
                onError={(e) => e.target.style.display = 'none'}
              />
              <h1 className="text-4xl font-bold" style={{ color: '#249689' }}>
                {title}
              </h1>
            </div>

            {/* 오른쪽: 빈 공간 (균형 맞추기) */}
            <div style={{ width: '120px' }}></div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
            <div className="text-sm text-blue-600 mb-1">📦 총 판매건수</div>
            <div className="text-2xl font-bold text-blue-700">{totalCount}건</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
            <div className="text-sm text-green-600 mb-1">📚 총 판매수량</div>
            <div className="text-2xl font-bold text-green-700">{totalQuantity}권</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
            <div className="text-sm text-yellow-600 mb-1">🏢 조회지점</div>
            <div className="text-2xl font-bold text-yellow-700">{displayBranch}</div>
          </div>
        </div>

        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-3">
            {/* 지점명 드롭다운 (시스템관리자만 표시) */}
            {showBranchFilter ? (
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">전체 지점</option>
                {branches.map((branch) => (
                  <option key={branch.branch_name} value={branch.branch_name}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-medium" style={{ color: '#249689' }}>
                {user?.branch || '-'}
              </div>
            )}

            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">구매일자</span>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <span className="text-gray-500">~</span>

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="이름, 연락처, 입금자명 검색"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 whitespace-nowrap"
            >
              <Search size={18} />
              검색
            </button>

            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 whitespace-nowrap"
            >
              <RotateCcw size={18} />
              초기화
            </button>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">로딩 중...</p>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">조회된 구매이력이 없습니다.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">실명</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">구매일자</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">지점</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">연락처</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">수량</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">결제정보</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">주문내역</th>
                  {isSystemAdmin && (
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">관리</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPurchases.map((purchase, idx) => (
                  <tr key={purchase.id || idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{purchase.customer_name || '-'}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(purchase.created_at)}</td>
                    <td className="px-4 py-3 text-sm">{purchase.user_branch || '-'}</td>
                    <td className="px-4 py-3 text-sm">{formatPhone(purchase.phone)}</td>
                    <td className="px-4 py-3 text-sm text-center">{purchase.quantity || 0}개</td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <div className="font-medium">{purchase.payment_method || '-'}</div>
                        {purchase.payment_method === '입금' && (
                          <div className="text-gray-600 text-xs">
                            {purchase.depositor && `${purchase.depositor} / `}
                            {purchase.deposit_amount && `${purchase.deposit_amount.toLocaleString()}원`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="max-w-xs truncate text-gray-600">
                        {purchase.order_details || '-'}
                      </div>
                    </td>
                    {isSystemAdmin && (
                      <td className="px-4 py-3 text-sm text-center">
                        <button
                          onClick={() => handleDeleteClick(purchase)}
                          className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded inline-flex items-center justify-center transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-lg font-bold" style={{ color: '#249689' }}>
            검색결과: {filteredPurchases.length.toLocaleString()}건
          </div>
        </div>
      </div>

      {/* 상세보기 모달 */}
      {showModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#249689' }}>
                🏢 구매이력상세
              </h2>

              {/* 판매 정보 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-gray-800">📋 판매 정보</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-600">판매일자</span>
                    <p className="font-medium">{formatDate(selectedPurchase.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">판매 지점</span>
                    <p className="font-medium">{selectedPurchase.user_branch || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">수량</span>
                    <p className="font-medium">{selectedPurchase.quantity || 0}개</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">주문내역</span>
                    <p className="font-medium">{selectedPurchase.order_details || '-'}</p>
                  </div>
                </div>
              </div>

              {/* 구매자 정보 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-gray-800">👤 구매자 정보</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-600">이름</span>
                    <p className="font-medium">{selectedPurchase.customer_name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">전화번호</span>
                    <p className="font-medium">{formatPhone(selectedPurchase.phone)}</p>
                  </div>
                </div>
              </div>

              {/* 결제 정보 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-gray-800">💳 결제 정보</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-600">결제 방법</span>
                    <p className="font-medium">{selectedPurchase.payment_method || '-'}</p>
                  </div>
                  {selectedPurchase.payment_method === '입금' && (
                    <>
                      <div>
                        <span className="text-sm text-gray-600">입금자명</span>
                        <p className="font-medium">{selectedPurchase.depositor || '-'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">입금액</span>
                        <p className="font-bold text-lg" style={{ color: '#249689' }}>
                          {selectedPurchase.deposit_amount ? `${selectedPurchase.deposit_amount.toLocaleString()}원` : '-'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
                >
                  🖨️ 출력
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  ❌ 닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 삭제 확인 모달 (시스템관리자 전용) */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4 text-center text-red-600">
              ⚠️ 삭제 확인
            </h2>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">정말로 이 구매이력을 삭제하시겠습니까?</p>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <p><span className="font-semibold">고객명:</span> {deleteTarget.customer_name}</p>
                <p><span className="font-semibold">구매일자:</span> {formatDate(deleteTarget.created_at)}</p>
                <p><span className="font-semibold">지점:</span> {deleteTarget.user_branch}</p>
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
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
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