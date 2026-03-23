import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'
import { ShoppingCart, Trophy, Award, BarChart3, Search, RotateCcw, Download, ChevronLeft, ChevronRight, Calendar, Package } from 'lucide-react'

// ══════════════════════════════════════════════
// 매출 현황 대시보드 - 재사용 가능 컴포넌트
// Props:
//   user     - 로그인 유저 (id, branch, user_type 등)
//   viewMode - 'user' | 'admin' | 'system'
//   branchFilter - 특정 지점명을 강제 필터링 (매장관리에서 호출 시)
// ══════════════════════════════════════════════
export default function SalesDashboard({ user, viewMode, branchFilter }) {
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState([])
  const [stats, setStats] = useState({
    totalAmount: 0, totalCount: 0,
    todayAmount: 0, weekAmount: 0, lastWeekAmount: 0, monthAmount: 0,
    weekRange: '', lastWeekRange: ''
  })
  const [topBranches, setTopBranches] = useState([])
  const [topPerformers, setTopPerformers] = useState([])
  const [seriesStats, setSeriesStats] = useState({})
  const [filters, setFilters] = useState({ branch: branchFilter || '', userName: '', startDate: '', endDate: '' })
  const [availableBranches, setAvailableBranches] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => { if (viewMode) fetchData() }, [filters, viewMode])

  // branchFilter prop이 바뀌면 필터 동기화
  useEffect(() => {
    if (branchFilter !== undefined) setFilters(p => ({ ...p, branch: branchFilter }))
  }, [branchFilter])

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
      if (viewMode === 'system' && !branchFilter) {
        setAvailableBranches([...new Set(data?.map(s => s.branch_name).filter(Boolean))].sort())
      }
    } catch (err) { console.error('Data load error:', err) }
    finally { setLoading(false) }
  }

  const calculateStats = (data) => {
    const toLocalStr = (d) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${dd}`
    }
    const now = new Date()
    const today = toLocalStr(now)
    const day = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
    const lastMonday = new Date(monday); lastMonday.setDate(monday.getDate() - 7)
    const lastSunday = new Date(monday); lastSunday.setDate(monday.getDate() - 1)
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
        if (info?.items) info.items.forEach(pkg => { sMap[pkg.series] = (sMap[pkg.series] || 0) + (parseInt(pkg.quantity) || 0) })
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
    <div className="space-y-5 pb-10">
      {/* 헤더: branchFilter 없을 때만 타이틀 표시 */}
      {!branchFilter ? (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <BarChart3 className="text-teal-600" size={22} />
              매출 현황
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">실시간 판매 데이터 분석</p>
          </div>
          <button onClick={handleDownloadExcel} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl font-bold shadow-md hover:bg-green-700 transition-all text-xs">
            <Download size={14} /> 엑셀 다운로드
          </button>
        </div>
      ) : (
        <div className="flex justify-end">
          <button onClick={handleDownloadExcel} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl font-bold shadow-md hover:bg-green-700 transition-all text-xs">
            <Download size={14} /> 엑셀 다운로드
          </button>
        </div>
      )}

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

      {/* 랭킹 */}
      {(viewMode === 'system' || viewMode === 'admin') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {viewMode === 'system' && !branchFilter && (
            <div>
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-3"><Trophy className="text-yellow-500" size={16} /> 지점별 매출 Top 12</h3>
              <div className="space-y-2">{topBranches.map((item, idx) => <RankItem key={item.name} item={item} idx={idx} color="text-teal-700" />)}</div>
            </div>
          )}
          <div>
            <h3 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-3">
              <Award className="text-blue-500" size={16} />
              {branchFilter ? `${branchFilter} 소속 Top 12` : viewMode === 'admin' ? '지점 소속 개인별 Top 12' : '개인별 매출 Top 12'}
            </h3>
            <div className="space-y-2">{topPerformers.map((item, idx) => <RankItem key={item.name} item={item} idx={idx} color="text-blue-700" />)}</div>
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {viewMode === 'system' && !branchFilter && (
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-black text-gray-400 mb-1">지점</label>
              <select value={filters.branch} onChange={e => setFilters(p => ({ ...p, branch: e.target.value }))}
                className="w-full h-9 px-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">모든 지점</option>
                {availableBranches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}
          {(viewMode === 'system' || viewMode === 'admin') && !branchFilter && (
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
          <button onClick={() => { setFilters({ branch: branchFilter || '', userName: '', startDate: '', endDate: '' }); setCurrentPage(1) }}
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

      {/* 페이지네이션 */}
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
