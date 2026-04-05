import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'
import { ShoppingCart, Trophy, Award, BarChart3, Search, RotateCcw, Download, ChevronLeft, ChevronRight, Calendar, Package, X } from 'lucide-react'

// ══════════════════════════════════════════════
// 매출 현황 대시보드 - 재사용 가능 컴포넌트
// Props:
//   user     - 로그인 유저 (id, branch, user_type 등)
//   viewMode - 'user' | 'admin' | 'system'
//   branchFilter - 특정 지점명을 강제 필터링 (매장관리에서 호출 시)
// ══════════════════════════════════════════════
export default function SalesDashboard({ user, viewMode, branchFilter, hideIndividualRanking = false }) {
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
  const [filters, setFilters] = useState({
    branch: branchFilter || "",
    userName: "전체",
    series: "",
    startDate: "",
    endDate: "",
  });
  const [availableBranches, setAvailableBranches] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
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
      if (filters.userName && filters.userName !== "전체") query = query.or(`user_name.ilike.%${filters.userName}%,seller_name.ilike.%${filters.userName}%`)
      if (filters.startDate) query = query.gte('created_at', `${filters.startDate}T00:00:00`)
      if (filters.endDate) query = query.lte('created_at', `${filters.endDate}T23:59:59`)
      const { data, error } = await query
      if (error) throw error
      setSalesData(data || [])
      calculateStats(data || [])
      if (viewMode === 'system' && !branchFilter) {
        const branches = [...new Set(data?.map(s => s.branch_name).filter(Boolean))].sort()
        setAvailableBranches(branches)
      }
      
      // 판매자 목록 추출 (가나다순)
      if (data) {
        const users = [...new Set(data.map(s => s.user_name).filter(Boolean))].sort()
        setAvailableUsers(users)
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
    const exportData = salesData.map(s => {
      let cardInfo = '', cashInfo = '';
      try {
        const info = typeof s.payment_info === 'string' ? JSON.parse(s.payment_info) : s.payment_info;
        if (info?.card) cardInfo = `[카드] ${new Intl.NumberFormat('ko-KR').format(info.card.amount.toString().replace(/[^0-9]/g, ''))}원 (${info.card.issuer || '-'})`;
        if (info?.cash) cashInfo = `[현금] ${new Intl.NumberFormat('ko-KR').format(info.cash.amount.toString().replace(/[^0-9]/g, ''))}원 (${info.cash.bank || '-'})`;
      } catch (e) {}

      return {
        '일시': new Date(s.created_at).toLocaleString(),
        '지점': s.branch_name,
        '담당자(판매자)': s.user_name,
        '구매자': s.customer_name,
        '연락처': s.phone,
        '결제수단': s.payment_method,
        '카드상세': cardInfo,
        '현금상세': cashInfo,
        '수량이름': s.order_details,
        '수량': s.quantity,
        '총금액': s.deposit_amount
      }
    })
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
      {/* 타이틀 및 헤더 */}
      <div className="flex justify-between items-center mb-1">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-teal-600" size={22} />
            매출 현황
          </h2>
          <p className="text-gray-400 text-xs mt-0.5 font-bold">
            실시간 판매 데이터 분석
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#10b981] text-white rounded-xl font-bold shadow-sm hover:bg-[#059669] transition-all text-xs"
          >
            <Download size={14} /> 엑셀 다운로드
          </button>
        </div>
      </div>

      {/* 필터 (상단 2row 배치) */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="block text-xs font-black text-gray-500 mb-2 ml-1">
              시리즈
            </label>
            <select
              value={filters.series}
              onChange={(e) =>
                setFilters((p) => ({ ...p, series: e.target.value }))
              }
              className="w-full h-11 px-3 bg-gray-50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer appearance-none"
            >
              <option value="">전체</option>
              {[
                "K2", "K3", "K4", "K5", "K6", "K7",
                "G1", "G2", "G3", "G4", "G5", "G6",
                "S2", "S3", "S4", "S5",
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="block text-xs font-black text-gray-500 mb-2 ml-1">
              담당자(판매자)
            </label>
            <div className="relative">
              <select
                value={filters.userName}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, userName: e.target.value }))
                }
                className="w-full h-11 px-3 bg-gray-50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer appearance-none"
              >
                <option value="전체">전체</option>
                {availableUsers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="block text-xs font-black text-gray-500 mb-2 ml-1">
              시작일
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((p) => ({ ...p, startDate: e.target.value }))
              }
              className="w-full h-11 px-3 bg-gray-50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 transition-all font-bold"
            />
          </div>

          <div className="flex flex-col">
            <label className="block text-xs font-black text-gray-500 mb-2 ml-1">
              종료일
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((p) => ({ ...p, endDate: e.target.value }))
              }
              className="w-full h-11 px-3 bg-gray-50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 transition-all font-bold"
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-50">
          <div className="bg-[#effefb] px-4 py-2.5 rounded-2xl flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#249689]">
              검색 필터 합계:{" "}
            </span>
            <span className="font-black text-[#249689] text-base">
              {fmt(stats.totalAmount)}
            </span>
            <span className="text-[10px] text-gray-300 ml-1">
              ({salesData.length}건)
            </span>
          </div>
          <button
            onClick={() => {
              setFilters({
                branch: branchFilter || "",
                userName: user?.name || "",
                series: "",
                startDate: "",
                endDate: "",
              });
              setCurrentPage(1);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-teal-600 transition-colors mr-1"
          >
            <RotateCcw size={14} /> 초기화
          </button>
        </div>
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

      {/* 랭킹 섹션 - hideIndividualRanking이 false일 때만 표시 */}
      {!hideIndividualRanking &&
        (viewMode === "system" || viewMode === "admin") && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-4">
            {viewMode === "system" && !branchFilter && (
              <div>
                <h3 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-3">
                  <Trophy className="text-yellow-500" size={16} /> 지점별 매출 Top
                  12
                </h3>
                <div className="space-y-2">
                  {topBranches.map((item, idx) => (
                    <RankItem
                      key={item.name}
                      item={item}
                      idx={idx}
                      color="text-teal-700"
                    />
                  ))}
                </div>
              </div>
            )}
            <div>
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-3">
                <Award className="text-blue-500" size={16} />
                개인매출현황
              </h3>
              <div className="space-y-2">
                {topPerformers.map((item, idx) => (
                  <RankItem
                    key={item.name}
                    item={item}
                    idx={idx}
                    color="text-blue-700"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

      {/* 모바일 카드 */}
      <div className="md:hidden space-y-3">
        {currentItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm active:bg-gray-50 transition-colors"
          >
            {/* 1행: 시간, 구매자, 금액 */}
            <div className="flex justify-between items-center mb-1.5 pb-1.5 border-b border-gray-50">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                   {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-xs font-black text-gray-800">{item.customer_name || '비회원'}</span>
              </div>
              <span className="text-[13px] font-black text-[#249689]">
                {fmt(item.deposit_amount)}
              </span>
            </div>
            {/* 2행: 상세내용 */}
            <div className="flex justify-between items-end">
              <div className="flex-1 overflow-hidden mr-2">
                <div className="flex items-center gap-1.5">
                  <Package size={10} className="text-teal-400 shrink-0" />
                  <p className="text-[11px] font-bold text-gray-600 truncate">{item.order_details}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {salesData.length === 0 && !loading && <p className="text-center text-gray-400 py-10 text-sm">판매 내역이 없습니다.</p>}
      </div>

      {/* PC 테이블 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 hidden md:table-header-group">
            <tr>
              <th className="px-5 py-3 text-[11px] font-black text-gray-400">매출 내역</th>
              <th className="px-5 py-3 text-[11px] font-black text-gray-400 text-right">금액</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {currentItems.map((item) => (
              <tr key={item.id} className="hover:bg-teal-50/30 transition-colors group">
                <td className="px-5 py-4" colSpan="2">
                   {/* 1행: 일시 및 구매자 */}
                   <div className="flex justify-between items-start mb-1.5">
                     <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded leading-tight">
                           {new Date(item.created_at).toLocaleString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-sm font-black text-gray-800 flex items-center gap-1.5">
                           <ShoppingCart size={14} className="text-blue-500" />
                           {item.customer_name || "구매자 미입력"}
                        </span>
                     </div>
                     <div className="text-right">
                        <span className="text-base font-black text-[#249689]">
                          {fmt(item.deposit_amount)}
                        </span>
                     </div>
                   </div>
                   {/* 2행: 주문 상세 */}
                   <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-xl border border-gray-100 mt-1">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Package size={14} className="text-teal-400 shrink-0" />
                        <span className="text-xs text-gray-600 font-bold truncate">
                          {item.order_details || "-"}
                        </span>
                      </div>
                   </div>
                </td>
              </tr>
            ))}
            {salesData.length === 0 && !loading && <tr><td colSpan="2" className="px-5 py-16 text-center text-gray-400 text-sm font-bold">판매 내역이 없습니다.</td></tr>}
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
