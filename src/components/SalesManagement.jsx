import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'
import { Plus, Trash2, CheckCircle2, AlertCircle, ShoppingCart, CreditCard, Banknote, FileUp, X, Check, Trophy, Award, User, Store, BarChart3, Search, RotateCcw, Download, ChevronLeft, ChevronRight, Calendar, Package, Medal } from 'lucide-react'

// SalesDashboard Component
const SalesDashboard = ({ user, viewMode }) => {
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState([])
  const [stats, setStats] = useState({ totalAmount: 0, totalCount: 0, todayAmount: 0, weekAmount: 0, lastWeekAmount: 0, monthAmount: 0, weekRange: '', lastWeekRange: '' })
  const [topBranches, setTopBranches] = useState([])
  const [topPerformers, setTopPerformers] = useState([])
  const [seriesStats, setSeriesStats] = useState({})
  const [filters, setFilters] = useState({ branch: '', userName: '', startDate: '', endDate: '' })
  const [availableBranches, setAvailableBranches] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => { if (viewMode) fetchData() }, [filters, viewMode])

  const fetchData = async () => {
    setLoading(true)
    try {
      let query = supabase.from('sales').select('*').order('created_at', { ascending: false })
      if (viewMode === 'user') query = query.eq('user_id', user.id)
      else if (viewMode === 'admin') query = query.eq('branch_name', user.branch)
      if (filters.branch) query = query.eq('branch_name', filters.branch)
      if (filters.userName) query = query.ilike('user_name', `%${filters.userName}%`)
      if (filters.startDate) query = query.gte('created_at', `${filters.startDate}T00:00:00`)
      if (filters.endDate) query = query.lte('created_at', `${filters.endDate}T23:59:59`)
      const { data, error } = await query
      if (error) throw error
      setSalesData(data || [])
      calculateStats(data || [])
      if (viewMode === 'system') setAvailableBranches([...new Set(data?.map(s => s.branch_name).filter(Boolean))].sort())
    } catch (err) { console.error('Data load error:', err) }
    finally { setLoading(false) }
  }

  const calculateStats = (data) => {
    // 로컬 날짜 문자열 (YYYY-MM-DD) - timezone 안전
    const toLocalStr = (d) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${dd}`
    }
    const now = new Date()
    const today = toLocalStr(now)
    const day = now.getDay()
    // 이번 주 월요일 (로컬)
    const monday = new Date(now)
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
    monday.setHours(0, 0, 0, 0)
    // 이번 주 일요일
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    // 지난 주
    const lastMonday = new Date(monday)
    lastMonday.setDate(monday.getDate() - 7)
    const lastSunday = new Date(monday)
    lastSunday.setDate(monday.getDate() - 1)
    // 이번 달 1일
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const mondayStr = toLocalStr(monday)
    const sundayStr = toLocalStr(sunday)
    const lastMondayStr = toLocalStr(lastMonday)
    const lastSundayStr = toLocalStr(lastSunday)
    const firstDayOfMonth = toLocalStr(firstOfMonth)
    const fmtD = (d) => `${d.getMonth()+1}/${d.getDate()}`

    let totalAmount = 0, todayAmount = 0, weekAmount = 0, lastWeekAmount = 0, monthAmount = 0
    const branchMap = {}, userMap = {}, sMap = {}
    data.forEach(item => {
      const amount = parseInt(item.deposit_amount || 0)
      // UTC created_at → 로컬 날짜로 변환
      const localDate = toLocalStr(new Date(item.created_at))
      totalAmount += amount
      if (localDate === today) todayAmount += amount
      if (localDate >= mondayStr && localDate <= sundayStr) weekAmount += amount
      if (localDate >= lastMondayStr && localDate <= lastSundayStr) lastWeekAmount += amount
      if (localDate >= firstDayOfMonth) monthAmount += amount
      if (item.branch_name) branchMap[item.branch_name] = (branchMap[item.branch_name] || 0) + amount
      if (item.user_name) {
        const key = `${item.user_name} (${item.user_branch || item.branch_name || '-'})`
        userMap[key] = (userMap[key] || 0) + amount
      }
      try {
        const info = typeof item.payment_info === 'string' ? JSON.parse(item.payment_info) : item.payment_info
        if (info && info.items) info.items.forEach(pkg => { sMap[pkg.series] = (sMap[pkg.series] || 0) + (parseInt(pkg.quantity) || 0) })
      } catch (e) {}
    })
    setStats({ totalAmount, totalCount: data.length, todayAmount, weekAmount, lastWeekAmount, monthAmount, weekRange: `${fmtD(monday)}~${fmtD(sunday)}`, lastWeekRange: `${fmtD(lastMonday)}~${fmtD(lastSunday)}` })
    setSeriesStats(sMap)
    setTopBranches(Object.entries(branchMap).map(([n, a]) => ({ name: n, amount: a })).sort((a, b) => b.amount - a.amount).slice(0, 12))
    setTopPerformers(Object.entries(userMap).map(([n, a]) => ({ name: n, amount: a })).sort((a, b) => b.amount - a.amount).slice(0, 12))
  }

  const fmt = (num) => new Intl.NumberFormat('ko-KR').format(num) + '원'
  const totalPages = Math.ceil(salesData.length / itemsPerPage)
  const currentItems = salesData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleDownloadExcel = () => {
    const exportData = salesData.map(s => ({
      '일시': new Date(s.created_at).toLocaleString(), '지점': s.branch_name, '담당자': s.user_name,
      '구매자': s.customer_name, '연락처': s.phone, '결제수단': s.payment_method,
      '수량': s.quantity, '금액': s.deposit_amount, '상세내용': s.order_details
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '매출내역')
    XLSX.writeFile(wb, `매출현황_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const RankItem = ({ item, idx, color }) => (
    <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-400' : 'bg-gray-200 text-gray-500'}`}>{idx + 1}</div>
      <span className="flex-1 font-bold text-gray-700 text-sm truncate">{item.name}</span>
      <span className={`font-black text-sm shrink-0 ${color}`}>{fmt(item.amount)}</span>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5 pb-20">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><BarChart3 className="text-teal-600" size={22} />매출 현황</h2>
          <p className="text-gray-400 text-xs mt-0.5">실시간 판매 데이터 분석</p>
        </div>
        <button onClick={handleDownloadExcel} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl font-bold shadow-md hover:bg-green-700 transition-all text-xs">
          <Download size={14} /> 엑셀 다운로드
        </button>
      </div>

      {/* 총 누적 매출 */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute -right-3 -bottom-3 opacity-10"><ShoppingCart size={80} /></div>
        <p className="text-teal-100 text-xs font-bold mb-1">총 누적 매출</p>
        <h3 className="text-2xl font-black">{fmt(stats.totalAmount)}</h3>
        <p className="text-[10px] text-teal-200 mt-2">총 {stats.totalCount}건</p>
      </div>

      {/* 2x2 매출 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-gray-400 text-xs font-bold">오늘</p>
            <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg"><Calendar size={14} /></div>
          </div>
          <h3 className="text-base font-black text-gray-800">{fmt(stats.todayAmount)}</h3>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-gray-400 text-xs font-bold">이번 달</p>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><Trophy size={14} /></div>
          </div>
          <h3 className="text-base font-black text-gray-800">{fmt(stats.monthAmount)}</h3>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
          <div className="flex justify-between items-start mb-0.5">
            <p className="text-gray-400 text-xs font-bold">이번 주</p>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><BarChart3 size={14} /></div>
          </div>
          <p className="text-[10px] text-gray-300 mb-1">{stats.weekRange}</p>
          <h3 className="text-base font-black text-gray-800">{fmt(stats.weekAmount)}</h3>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
          <div className="flex justify-between items-start mb-0.5">
            <p className="text-gray-400 text-xs font-bold">지난 주</p>
            <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg"><BarChart3 size={14} /></div>
          </div>
          <p className="text-[10px] text-gray-300 mb-1">{stats.lastWeekRange}</p>
          <h3 className="text-base font-black text-gray-800">{fmt(stats.lastWeekAmount)}</h3>
        </div>
      </div>

      {/* 시리즈별 */}
      {Object.keys(seriesStats).length > 0 && (
        <div>
          <h4 className="text-sm font-black text-gray-600 mb-2 flex items-center gap-1.5"><Package size={14} className="text-teal-500" /> 시리즈별 판매</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(seriesStats).sort().map(([series, count]) => (
              <div key={series} className="bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-2">
                <span className="font-black text-gray-800 text-sm">{series}</span>
                <span className="bg-teal-100 text-teal-700 text-xs font-black px-2 py-0.5 rounded-full">{count}개</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 랭킹: 지점별=system, 개인별=system+admin */}
      {(viewMode === 'system' || viewMode === 'admin') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {viewMode === 'system' && (
            <div>
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-3"><Trophy className="text-yellow-500" size={16} /> 지점별 매출 Top 12</h3>
              <div className="space-y-2">{topBranches.map((item, idx) => <RankItem key={item.name} item={item} idx={idx} color="text-teal-700" />)}</div>
            </div>
          )}
          <div>
            <h3 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-3">
              <Award className="text-blue-500" size={16} />
              {viewMode === 'admin' ? '지점 소속 개인별 Top 12' : '개인별 매출 Top 12'}
            </h3>
            <div className="space-y-2">{topPerformers.map((item, idx) => <RankItem key={item.name} item={item} idx={idx} color="text-blue-700" />)}</div>
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {viewMode === 'system' && (
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-black text-gray-400 mb-1">지점</label>
              <select value={filters.branch} onChange={e => setFilters(p => ({ ...p, branch: e.target.value }))}
                className="w-full h-9 px-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">모든 지점</option>
                {availableBranches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}
          {(viewMode === 'system' || viewMode === 'admin') && (
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-black text-gray-400 mb-1">담당자</label>
              <div className="relative">
                <input type="text" value={filters.userName} onChange={e => setFilters(p => ({ ...p, userName: e.target.value }))}
                  placeholder="이름" className="w-full h-9 pl-7 pr-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-[10px] font-black text-gray-400 mb-1">시작일</label>
            <input type="date" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))}
              className="w-full h-9 px-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 mb-1">종료일</label>
            <input type="date" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))}
              className="w-full h-9 px-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
        </div>
        <div className="flex justify-between items-center mt-3">
          <div className="bg-teal-50 px-3 py-1.5 rounded-lg">
            <span className="text-[10px] font-black text-teal-600">필터 합계: </span>
            <span className="font-black text-teal-700 text-sm">{fmt(stats.totalAmount)}</span>
            <span className="text-[10px] text-gray-400 ml-1.5">({salesData.length}건)</span>
          </div>
          <button onClick={() => { setFilters({ branch: '', userName: '', startDate: '', endDate: '' }); setCurrentPage(1) }}
            className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-teal-600 transition-colors">
            <RotateCcw size={12} /> 초기화
          </button>
        </div>
      </div>

      {/* 모바일 카드 */}
      <div className="md:hidden space-y-3">
        {currentItems.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-black text-sm">{item.customer_name?.[0] || '익'}</div>
                <div>
                  <p className="font-black text-gray-800 text-sm">{item.customer_name || '비회원'}</p>
                  <p className="text-[10px] text-gray-400">{item.phone || '-'}</p>
                </div>
              </div>
              <span className="font-black text-teal-700">{fmt(item.deposit_amount)}</span>
            </div>
            <p className="text-[11px] text-gray-500 bg-gray-50 rounded-lg p-2 line-clamp-2">{item.order_details}</p>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-gray-400">{item.branch_name} / {item.user_name}</span>
              <span className="text-[10px] text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {salesData.length === 0 && !loading && <p className="text-center text-gray-400 py-10 text-sm">판매 내역이 없습니다.</p>}
      </div>

      {/* PC 테이블 */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['일시','지점/담당자','구매자','내용','금액'].map(h => <th key={h} className="px-5 py-3.5 text-[11px] font-black text-gray-400 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {currentItems.map(item => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5 text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</td>
                <td className="px-5 py-3.5"><p className="text-xs font-black text-gray-800">{item.branch_name}</p><p className="text-[10px] text-teal-600 font-bold">{item.user_name}</p></td>
                <td className="px-5 py-3.5"><p className="text-xs font-bold text-gray-800">{item.customer_name}</p><p className="text-[10px] text-gray-400">{item.phone}</p></td>
                <td className="px-5 py-3.5 max-w-xs"><span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-[9px] font-bold">{item.payment_method}</span><p className="text-[11px] text-gray-500 truncate mt-0.5">{item.order_details}</p></td>
                <td className="px-5 py-3.5 text-right font-black text-teal-700 text-sm">{fmt(item.deposit_amount)}</td>
              </tr>
            ))}
            {salesData.length === 0 && !loading && <tr><td colSpan="5" className="px-5 py-16 text-center text-gray-400 text-sm">판매 내역이 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 bg-white text-gray-400 disabled:opacity-30 hover:bg-gray-50"><ChevronLeft size={18} /></button>
          {[...Array(Math.min(totalPages, 10))].map((_, i) => (
            <button key={i+1} onClick={() => setCurrentPage(i+1)} className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${currentPage===i+1?'bg-teal-600 text-white shadow-md':'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}>{i+1}</button>
          ))}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 bg-white text-gray-400 disabled:opacity-30 hover:bg-gray-50"><ChevronRight size={18} /></button>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-teal-800 animate-pulse text-sm">매출 집계 중...</p>
          </div>
        </div>
      )}
    </div>
  )
}


export default function SalesManagement({ user, onNavigate }) {
  const [formData, setFormData] = useState({
    customerName: '',
    age: '',
    address: '',
    phone: '',
    paymentMethod: '카드',
    needsShipping: false,
    privacyAgreed: false,
    marketingAgreed: false
  })

  // 신규 상태 추가
  const [orderItems, setOrderItems] = useState([
    { id: Date.now(), language: '한글', series: 'K2', quantity: 1, price: 0 }
  ])
  const [cardInfo, setCardInfo] = useState({
    number: ['', '', '', ''],
    cvc: '',
    issuer: '',
    approvalNo: ''
  })
  const [cashInfo, setCashInfo] = useState({
    bank: '',
    depositor: '',
    amount: ''
  })

  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showCardValidationModal, setShowCardValidationModal] = useState(false)
  const [cardValidationResult, setCardValidationResult] = useState({ success: false, message: '' })
  const [excelPreview, setExcelPreview] = useState(null)
  const [showExcelPreview, setShowExcelPreview] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // 탭 및 권한 상태
  const [activeTab, setActiveTab] = useState('input') // 'input' | 'stats'
  const [viewMode, setViewMode] = useState('')

  useEffect(() => {
    if (user?.user_type === '시스템관리자') setViewMode('system')
    else if (user?.user_type === '지점장' || user?.user_type === '지점관리자') setViewMode('admin')
    else setViewMode('user')
  }, [user])

  // 가격 정보 로드
  useEffect(() => {
    fetchPrices()
  }, [])

  const fetchPrices = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('product_prices')
        .select('*')
        .lte('start_date', today)
        .or(`end_date.is.null,end_date.gte.${today}`)

      if (error) throw error
      setPrices(data || [])

      // 초기 아이템 가격 설정
      if (data && data.length > 0) {
        setOrderItems(prev => prev.map(item => {
          const priceObj = data.find(p => p.series === item.series && p.language === item.language)
          return { ...item, price: priceObj ? priceObj.price : 0 }
        }))
      }
    } catch (err) {
      console.error('가격 정보 로드 오류:', err)
    }
  }

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  // 금액 포맷팅 함수
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0원'
    const numbers = value.toString().replace(/[^\d]/g, '')
    if (!numbers) return '0원'
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원'
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let finalValue = type === 'checkbox' ? checked : value

    if (name === 'phone') {
      finalValue = formatPhoneNumber(value)
    }

    setFormData({
      ...formData,
      [name]: finalValue
    })
  }

  // 상품 항목 관리
  const addOrderItem = () => {
    const newId = Date.now()
    setOrderItems([...orderItems, {
      id: newId,
      language: '한글',
      series: 'K2',
      quantity: 1,
      price: getPrice('K2', '한글')
    }])
  }

  const removeOrderItem = (id) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter(item => item.id !== id))
    }
  }

  const updateOrderItem = (id, field, value) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value }
        if (field === 'series' || field === 'language') {
          newItem.price = getPrice(newItem.series, newItem.language)
        }
        return newItem
      }
      return item
    }))
  }

  const getPrice = (series, language) => {
    const priceObj = prices.find(p => p.series === series && p.language === language)
    return priceObj ? priceObj.price : 0
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  // 카드 정보 관리
  const handleCardNumberChange = (index, value) => {
    const numbers = value.replace(/[^\d]/g, '').slice(0, 4)
    const newNumbers = [...cardInfo.number]
    newNumbers[index] = numbers
    setCardInfo({ ...cardInfo, number: newNumbers })

    // 자동 다음 칸 이동
    if (numbers.length === 4 && index < 3) {
      const nextInput = document.getElementById(`card-number-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const validateCardNumber = () => {
    const fullNumber = cardInfo.number.join('')
    if (fullNumber.length !== 16) {
      setCardValidationResult({ success: false, message: '카드번호 16자리를 모두 입력해주세요.' })
    } else {
      setCardValidationResult({ success: true, message: '유효한 카드 번호 형식입니다.' })
    }
    setShowCardValidationModal(true)
  }

  // 엑셀 업로드
  const handleExcelUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const bstr = evt.target.result
      const wb = XLSX.read(bstr, { type: 'binary' })
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      const data = XLSX.utils.sheet_to_json(ws)

      setExcelPreview(data)
      setShowExcelPreview(true)
    }
    reader.readAsBinaryString(file)
  }

  const applyExcelData = () => {
    if (!excelPreview) return

    const newItems = excelPreview.map((row, index) => {
      const language = row['언어'] || row['language'] || '한글'
      const series = row['시리즈'] || row['series'] || 'K2'
      const quantity = parseInt(row['수량'] || row['quantity'] || 1)

      return {
        id: Date.now() + index,
        language,
        series,
        quantity,
        price: getPrice(series, language)
      }
    })

    setOrderItems(newItems)
    setShowExcelPreview(false)
    setExcelPreview(null)
  }

  // 필수 입력 검증
  const validateForm = () => {
    if (orderItems.length === 0) {
      alert('상품을 하나 이상 선택해주세요.')
      return false
    }

    if (formData.needsShipping) {
      if (!formData.customerName?.trim()) { alert('배송을 위해 구매자 이름을 입력해주세요'); return false }
      if (!formData.address?.trim()) { alert('배송을 위해 주소를 입력해주세요'); return false }
      if (!formData.phone?.trim()) { alert('배송을 위해 연락처를 입력해주세요'); return false }
    }

    if (formData.paymentMethod === '카드') {
      if (!cardInfo.issuer) { alert('카드사를 입력해주세요'); return false }
      if (!cardInfo.approvalNo) { alert('승인번호를 입력해주세요'); return false }
    } else {
      if (!cashInfo.bank) { alert('입금기관명을 입력해주세요'); return false }
      if (!cashInfo.depositor) { alert('입금자명을 입력해주세요'); return false }
      if (!cashInfo.amount) { alert('입금액을 입력해주세요'); return false }
    }

    if (!formData.privacyAgreed) {
      alert('개인정보 수집 및 이용에 동의해주세요')
      return false
    }

    return true
  }

  const handleSubmit = () => {
    if (!validateForm()) return
    setShowConfirmModal(true)
  }

  const handleConfirmSave = async () => {
    setShowConfirmModal(false)
    setLoading(true)
    try {
      const totalAmount = calculateTotal()
      const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0)
      const orderSummary = orderItems.map(item => `${item.language} ${item.series} ${item.quantity}개`).join(', ')

      const insertData = {
        user_id: user?.id || null,
        branch_name: user?.branch || null,
        user_name: user?.name || null,
        user_branch: user?.branch || null,
        customer_name: formData.customerName?.trim() || null,
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        payment_method: formData.paymentMethod || null,
        quantity: totalQuantity,
        deposit_amount: totalAmount,
        order_details: orderSummary,
        age: formData.age ? parseInt(formData.age) : null,
        needs_shipping: formData.needsShipping,
        privacy_agreed: formData.privacyAgreed,
        marketing_agreed: formData.marketingAgreed,
        payment_info: JSON.stringify({
          card: formData.paymentMethod === '카드' ? cardInfo : null,
          cash: formData.paymentMethod === '입금' ? cashInfo : null,
          items: orderItems
        })
      }

      const { data, error } = await supabase
        .from('sales')
        .insert([insertData])
        .select()

      if (error) throw error

      alert('저장되었습니다!')
      onNavigate?.('Dashboard')

    } catch (err) {
      console.error('저장 오류:', err)
      alert('저장 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 pb-10">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg relative overflow-hidden" style={{ padding: '12px', paddingBottom: activeTab === 'input' ? '24px' : '0px' }}>

        {/* 헤더 섹션 */}
        <div className="flex flex-col items-center justify-center mb-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <img
              src="/images/logo.png"
              alt="LAS Logo"
              className="w-8 h-8 object-cover"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="font-bold" style={{ color: '#249689', fontSize: '24px' }}>
              LAS Book Store
            </h1>
          </div>
          <p className="text-gray-500 text-xs font-medium tracking-wide">판매관리 시스템</p>
        </div>

        {/* 탭 네비게이션 - 헤더 바로 아래 */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-3">
          <button
            onClick={() => setActiveTab('input')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'input'
                ? 'bg-white text-teal-600 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            구매정보
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'stats'
                ? 'bg-white text-teal-600 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            매출현황
          </button>
        </div>

        {activeTab === 'stats' ? (
          <SalesDashboard user={user} viewMode={viewMode} />
        ) : (
          <>
            {/* 지점 정보 */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                <label className="block text-xs font-bold text-gray-500 mb-1">지점명</label>
                <div className="font-bold text-gray-800">{user?.branch || '-'}</div>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                <label className="block text-xs font-bold text-gray-500 mb-1">이름</label>
                <div className="font-bold text-gray-800">{user?.name || '-'}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="border border-teal-200 rounded-xl p-2 bg-teal-50/20 transition-all">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="needsShipping"
                    checked={formData.needsShipping}
                    onChange={handleChange}
                    className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                  />
                  <span className="font-bold text-teal-800" style={{ fontSize: '15px' }}>
                    📦 배송이 필요합니다
                  </span>
                </label>
                <p className="text-[11px] text-teal-600 mt-1 ml-7 font-medium leading-tight">
                  {formData.needsShipping
                    ? '✓ 배송 선택: 이름, 연락처, 주소가 필수입니다'
                    : '배송을 선택하지 않으면 구매자 정보는 선택사항입니다'}
                </p>
              </div>

              {/* 구매자 기본정보 */}
              <div className="border border-gray-200 rounded-xl p-2.5 shadow-sm">
                <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: '#249689', fontSize: '16px' }}>
                  <div className="w-1 h-5 bg-teal-500 rounded-full"></div>
                  구매자 기본정보
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block mb-0.5 text-xs font-bold text-gray-700">
                      이름 {formData.needsShipping && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      placeholder="성함"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:border-teal-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block mb-0.5 text-xs font-bold text-gray-700">생년월일</label>
                    <input
                      type="text"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      placeholder="19900101"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:border-teal-500 font-medium text-center"
                    />
                  </div>
                  <div>
                    <label className="block mb-0.5 text-xs font-bold text-gray-700">
                      연락처 {formData.needsShipping && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="010-0000-0000"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:border-teal-500 font-medium text-center"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block mb-0.5 text-xs font-bold text-gray-700">
                      주소 {formData.needsShipping && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="구매자 주소 입력"
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* 구매상품 섹션 */}
              <div className="border border-gray-200 rounded-xl p-2.5 shadow-sm bg-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold flex items-center gap-2" style={{ color: '#249689', fontSize: '16px' }}>
                    <div className="w-1 h-5 bg-teal-500 rounded-full"></div>
                    구매상품
                  </h3>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold cursor-pointer hover:bg-blue-100 transition-colors border border-blue-100">
                      <FileUp size={14} />
                      엑셀업로드
                      <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelUpload} />
                    </label>
                    <button
                      onClick={addOrderItem}
                      className="flex items-center gap-1 px-2 py-1 bg-teal-50 text-teal-600 rounded-lg text-xs font-bold hover:bg-teal-100 transition-colors border border-teal-100"
                    >
                      <Plus size={14} />
                      추가
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {orderItems.map((item, index) => (
                    <div key={item.id} className="p-3 border border-gray-100 rounded-xl bg-gray-50/50 relative group">
                      <button
                        onClick={() => removeOrderItem(item.id)}
                        className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-20"
                        title="항목 삭제"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                      <div className="flex items-center gap-1.5 mb-1.5 overflow-x-auto">
                        <div className="flex-1 min-w-[60px]">
                          <label className="block mb-0.5 text-[12px] font-bold text-gray-600">언어</label>
                          <select
                            value={item.language}
                            onChange={(e) => updateOrderItem(item.id, 'language', e.target.value)}
                            className="w-full px-1 py-1 border border-gray-200 rounded-lg bg-white text-sm outline-none focus:ring-1 focus:ring-teal-500 transition-all font-bold"
                          >
                            <option value="한글">한글</option>
                            <option value="영문">영문</option>
                          </select>
                        </div>
                        <div className="flex-[1.2] min-w-[70px]">
                          <label className="block mb-0.5 text-[12px] font-bold text-gray-600">시리즈</label>
                          <select
                            value={item.series}
                            onChange={(e) => updateOrderItem(item.id, 'series', e.target.value)}
                            className="w-full px-1 py-1 border border-gray-200 rounded-lg bg-white text-sm outline-none focus:ring-1 focus:ring-teal-500 transition-all font-bold"
                          >
                            {Array.from({ length: 6 }, (_, i) => `K${i + 2}`).map(s => <option key={s} value={s}>{s}</option>)}
                            {Array.from({ length: 6 }, (_, i) => `G${i + 1}`).map(s => <option key={s} value={s}>{s}</option>)}
                            {Array.from({ length: 4 }, (_, i) => `S${i + 2}`).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="w-[50px]">
                          <label className="block mb-0.5 text-[12px] font-bold text-gray-600">수량</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-1 py-1 border border-gray-200 rounded-lg bg-white text-sm text-center font-bold outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                        <div className="flex-[1.5] text-right">
                          <label className="block mb-0.5 text-[12px] font-bold text-gray-600">금액</label>
                          <div className="text-sm font-bold text-teal-700 leading-tight">
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-dashed border-gray-200 flex items-center justify-between">
                  <span className="font-bold text-gray-800" style={{ fontSize: '16px' }}>총 합계금액</span>
                  <span className="font-black text-2xl text-teal-600 tracking-tight">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              {/* 결제정보 섹션 */}
              <div className="border border-gray-200 rounded-xl p-2.5 shadow-sm bg-white">
                <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: '#249689', fontSize: '16px' }}>
                  <div className="w-1 h-5 bg-teal-500 rounded-full"></div>
                  결제정보
                </h3>
                <div className="flex gap-1.5 mb-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                  <label
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg cursor-pointer transition-all ${formData.paymentMethod === '카드'
                        ? 'bg-white text-teal-600 shadow-sm border border-teal-100 font-bold'
                        : 'text-gray-400 font-medium'
                      }`}
                  >
                    <input type="radio" name="paymentMethod" value="카드" checked={formData.paymentMethod === '카드'} onChange={handleChange} className="hidden" />
                    <CreditCard size={18} />
                    <span>카드</span>
                  </label>
                  <label
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg cursor-pointer transition-all ${formData.paymentMethod === '입금'
                        ? 'bg-white text-teal-600 shadow-sm border border-teal-100 font-bold'
                        : 'text-gray-400 font-medium'
                      }`}
                  >
                    <input type="radio" name="paymentMethod" value="입금" checked={formData.paymentMethod === '입금'} onChange={handleChange} className="hidden" />
                    <Banknote size={18} />
                    <span>현금</span>
                  </label>
                </div>

                {formData.paymentMethod === '카드' ? (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-3 gap-1.5">
                      <div>
                        <label className="block mb-0.5 text-xs font-bold text-gray-700">단말기번호</label>
                        <input type="text" value={cardInfo.cvc} onChange={(e) => setCardInfo({ ...cardInfo, cvc: e.target.value })} placeholder="번호 입력" className="w-full px-1.5 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-teal-500 font-bold text-sm bg-white text-center" />
                      </div>
                      <div>
                        <label className="block mb-0.5 text-xs font-bold text-gray-700">카드사</label>
                        <input type="text" value={cardInfo.issuer} onChange={(e) => setCardInfo({ ...cardInfo, issuer: e.target.value })} placeholder="현대" className="w-full px-1.5 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-teal-500 font-bold text-sm bg-white text-center" />
                      </div>
                      <div>
                        <label className="block mb-0.5 text-xs font-bold text-gray-700">승인번호</label>
                        <input type="text" value={cardInfo.approvalNo} onChange={(e) => setCardInfo({ ...cardInfo, approvalNo: e.target.value })} placeholder="번호" className="w-full px-1.5 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-teal-500 font-bold text-sm bg-white text-center" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="block mb-0.5 text-xs font-bold text-gray-700">입금액</label>
                      <input type="text" value={cashInfo.amount} onChange={(e) => setCashInfo({ ...cashInfo, amount: formatCurrency(e.target.value).replace('원', '') })} placeholder="0" className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-teal-500 font-bold text-right text-base bg-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block mb-0.5 text-xs font-bold text-gray-700">입금기관명</label>
                        <input type="text" value={cashInfo.bank} onChange={(e) => setCashInfo({ ...cashInfo, bank: e.target.value })} placeholder="예: 우리은행" className="w-full px-2 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-teal-500 font-bold text-sm bg-white" />
                      </div>
                      <div>
                        <label className="block mb-0.5 text-xs font-bold text-gray-700">입금자명</label>
                        <input type="text" value={cashInfo.depositor} onChange={(e) => setCashInfo({ ...cashInfo, depositor: e.target.value })} placeholder="성함 입력" className="w-full px-2 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-teal-500 font-bold text-sm bg-white" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 개인정보 및 제출 섹션 */}
              <div className="space-y-2">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-gray-700">
                      <input type="checkbox" name="privacyAgreed" checked={formData.privacyAgreed} onChange={handleChange} className="w-4 h-4 accent-teal-600" />
                      개인정보 수집 및 이용 동의 <span className="text-red-500">*</span>
                    </label>
                    <button onClick={() => setShowPrivacyModal(true)} className="text-xs text-teal-600 underline">내용보기</button>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-500">
                    <input type="checkbox" name="marketingAgreed" checked={formData.marketingAgreed} onChange={handleChange} className="w-4 h-4 accent-teal-600" />
                    (선택) 마케팅 정보 수신 동의
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-[2] py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-700/10 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    {loading ? '저장 중...' : <><Check size={18} /> 확인 및 제출</>}
                  </button>
                  <button
                    onClick={() => onNavigate?.('Dashboard')}
                    disabled={loading}
                    className="flex-1 py-2.5 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    나가기
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 모달: 개인정보 PDF */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ height: '85vh' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-2xl">
              <h2 className="font-bold text-teal-700 text-base">개인정보 수집·이용 동의서</h2>
              <button onClick={() => setShowPrivacyModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src="/docs/개인정보수집이용동의서_근무관리시스템.pdf"
                className="w-full h-full"
                title="개인정보수집이용동의서"
              />
            </div>
            <div className="p-3 bg-gray-50 border-t rounded-b-2xl">
              <button onClick={() => setShowPrivacyModal(false)} className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700">
                확인
              </button>
            </div>
          </div>
        </div>
      )}


      {/* 모달: 제출 확인 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[115] animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
            <div className="px-5 py-4 bg-teal-600 flex items-center justify-between">
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <CheckCircle2 size={18} /> 구매 정보 확인
              </h2>
              <button onClick={() => setShowConfirmModal(false)} className="text-white/70 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto" style={{ maxHeight: '65vh' }}>
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-bold text-teal-600 mb-2">구매자 정보</p>
                <div className="flex justify-between text-sm"><span className="text-gray-500">이름</span><span className="font-bold">{formData.customerName || '-'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">연락처</span><span className="font-bold">{formData.phone || '-'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">생년월일</span><span className="font-bold">{formData.age || '-'}</span></div>
                {formData.needsShipping && <div className="flex justify-between text-sm"><span className="text-gray-500">주소</span><span className="font-bold text-right max-w-[180px]">{formData.address || '-'}</span></div>}
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-bold text-teal-600 mb-2">구매 상품</p>
                {orderItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-0.5">
                    <span className="text-gray-600">{item.language} {item.series}</span>
                    <span className="font-bold">{item.quantity}세트 · {(item.price * item.quantity).toLocaleString()}원</span>
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between">
                  <span className="font-bold text-gray-700">합계</span>
                  <span className="font-black text-teal-600 text-lg">{calculateTotal().toLocaleString()}원</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-bold text-teal-600 mb-2">결제 정보</p>
                <div className="flex justify-between text-sm"><span className="text-gray-500">결제수단</span><span className="font-bold">{formData.paymentMethod}</span></div>
                {formData.paymentMethod === '카드' ? (
                  <>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">단말기번호</span><span className="font-bold">{cardInfo.cvc || '-'}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">카드사</span><span className="font-bold">{cardInfo.issuer || '-'}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">승인번호</span><span className="font-bold">{cardInfo.approvalNo || '-'}</span></div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">입금기관</span><span className="font-bold">{cashInfo.bank || '-'}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">입금자명</span><span className="font-bold">{cashInfo.depositor || '-'}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">입금액</span><span className="font-bold">{cashInfo.amount || '-'}</span></div>
                  </>
                )}
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">수정하기</button>
              <button onClick={handleConfirmSave} disabled={loading} className="flex-[2] py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                <Check size={18} /> 확인 및 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모달: 카드 유효성 결과 */}
      {showCardValidationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110] animate-in zoom-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl border border-gray-100">
            {cardValidationResult.success ? (
              <div className="mb-6 flex flex-col items-center">
                <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-2">확인 완료</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{cardValidationResult.message}</p>
              </div>
            ) : (
              <div className="mb-6 flex flex-col items-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-2">확인 실패</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{cardValidationResult.message}</p>
              </div>
            )}
            <button
              onClick={() => setShowCardValidationModal(false)}
              className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all ${cardValidationResult.success ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-500/20' : 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'}`}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 모달: 엑셀 미리보기 */}
      {showExcelPreview && excelPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[120] animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[70vh] flex flex-col overflow-hidden border border-gray-100">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FileUp size={20} className="text-blue-500" />
                업로드 내용 확인
              </h3>
              <button onClick={() => setShowExcelPreview(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-sm">
                <thead className="text-gray-400 font-bold bg-gray-50/50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left">언어</th>
                    <th className="px-2 py-2 text-left">시리즈</th>
                    <th className="px-2 py-2 text-center">수량</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {excelPreview.map((row, i) => (
                    <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-2 py-3 font-medium">{row['언어'] || row['language'] || '한글'}</td>
                      <td className="px-2 py-3 font-black text-teal-600">{row['시리즈'] || row['series'] || 'K2'}</td>
                      <td className="px-2 py-3 text-center font-bold">{row['수량'] || row['quantity'] || 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 p-3 bg-blue-50 rounded-xl text-blue-600 text-xs font-medium flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                위의 정보를 확인해 주세요. 적용 버튼을 누르면 목록에 반영됩니다.
              </div>
            </div>
            <div className="p-4 border-t flex gap-2 bg-gray-50">
              <button onClick={() => setShowExcelPreview(false)} className="flex-1 py-3 font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">취소</button>
              <button onClick={applyExcelData} className="flex-1 py-3 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20">적용하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}




