import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'
import {
  ChevronLeft, RotateCcw, Search, Download, X,
  Trophy, Award, Medal, Store, User,
  BarChart3, Users, Calendar, TrendingUp, Package,
  Edit2, Trash2, Check, Save, FileText
} from 'lucide-react'
import { generateDailySalesReport } from '../utils/excelReportUtils'

const formatNumber = (n) => {
  if (n === null || n === undefined || n === "") return "0";
  const num = typeof n === 'string' ? parseFloat(n.replace(/[^0-9.-]/g, "")) : n;
  return new Intl.NumberFormat('ko-KR').format(isNaN(num) ? 0 : num);
}
const formatWon = (n) => formatNumber(n) + '원'

const toLocalStr = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

// ── 수직 막대 시리즈 패널 ─────────────────────────────────
function SeriesBarPanel({ label, color, keys, seriesAgg }) {
  const groupData = keys.map(key => {
    const found = seriesAgg.find(s => s.series === key)
    return { key, qty: found?.qty || 0, count: found?.count || 0 }
  })
  const maxQty = Math.max(...groupData.map(d => d.qty), 1)
  const totalQty = groupData.reduce((s, d) => s + d.qty, 0)
  const totalCount = groupData.reduce((s, d) => s + d.count, 0)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold flex items-center gap-2" style={{ color }}>
          <Package className="w-5 h-5" /> {label}
        </h3>
        <span className="text-sm text-gray-400 font-medium">합계 {formatNumber(totalQty)}세트</span>
      </div>

      {/* 수직 막대 */}
      <div className="flex items-end justify-center gap-3" style={{ height: '130px' }}>
        {groupData.map(({ key, qty }) => {
          const heightPct = maxQty > 0 ? (qty / maxQty) * 100 : 0
          return (
            <div key={key} className="flex flex-col items-center gap-0.5" style={{ width: '28px' }}>
              <span className="text-xs font-bold text-gray-600 leading-none">
                {qty > 0 ? formatNumber(qty) : ''}
              </span>
              <div className="w-full flex items-end" style={{ height: '96px' }}>
                <div
                  className="w-full rounded-t-sm transition-all duration-500"
                  style={{
                    height: qty > 0 ? `${Math.max(heightPct, 5)}%` : '2px',
                    backgroundColor: qty > 0 ? color : '#e5e7eb',
                    opacity: qty > 0 ? 1 : 0.35
                  }}
                />
              </div>
              <span className="text-xs font-black text-gray-600 leading-none">{key}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-3 pt-2.5 border-t border-gray-50 text-center">
        <span className="text-sm text-gray-400">
          {formatNumber(totalQty)}세트 · {formatNumber(totalCount)}건
        </span>
      </div>
    </div>
  )
}

// ── 랭킹 카드 ──────────────────────────────────────────────
function RankCard({ item, idx, onClick, titleKey, subKey, valueKey, isBlue }) {
  let borderColor = isBlue ? 'border-blue-500' : 'border-teal-500'
  let badgeColor  = isBlue ? 'bg-blue-600' : 'bg-teal-600'
  let IconComp    = isBlue ? User : Store
  let iconColor   = 'text-gray-400'

  if (idx === 0) { borderColor = 'border-yellow-400'; badgeColor = 'bg-yellow-400'; IconComp = Medal; iconColor = 'text-yellow-500' }
  else if (idx === 1) { borderColor = 'border-gray-400'; badgeColor = 'bg-gray-400'; IconComp = Medal; iconColor = 'text-gray-500' }
  else if (idx === 2) { borderColor = 'border-orange-400'; badgeColor = 'bg-orange-400'; IconComp = Medal; iconColor = 'text-orange-500' }

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-xl border-2 ${borderColor} p-3 flex items-center justify-between shadow-sm cursor-pointer hover:scale-105 transition-transform overflow-visible h-16`}
    >
      <div className={`absolute -top-3 -left-3 w-7 h-7 ${badgeColor} rounded-full flex items-center justify-center text-white font-bold shadow-md z-10 text-xs`}>
        {idx + 1}
      </div>
      <div className="flex items-center gap-2 ml-3 overflow-hidden flex-1">
        <IconComp className={`w-4 h-4 ${iconColor} shrink-0`} />
        <div className="flex flex-col overflow-hidden">
          <span className="font-bold text-gray-800 text-sm truncate">{item[titleKey]}</span>
          {subKey && <span className="text-[10px] text-gray-400 truncate">{item[subKey]}</span>}
        </div>
      </div>
      <div className="text-right shrink-0 ml-2">
        <div className={`font-bold text-sm ${isBlue ? 'text-blue-600' : 'text-teal-600'}`}>
          {formatWon(item[valueKey])}
        </div>
        <div className="text-[10px] text-gray-400">{formatNumber(item.count)}건</div>
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────
export default function SystemSalesDashboard({ user, onNavigate }) {
  const [allData, setAllData]         = useState([])
  const [salesData, setSalesData]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [topBranches, setTopBranches] = useState([])
  const [topPersons, setTopPersons]   = useState([])
  const [branches, setBranches]       = useState([])
  const DEFAULT_SERIES = [
    "K2", "K3", "K4", "K5", "K6", "K7",
    "G1", "G2", "G3", "G4", "G5", "G6",
    "S2", "S3", "S4", "S5",
  ]
  const [seriesList, setSeriesList]   = useState(DEFAULT_SERIES)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS = 30

  // 수정/삭제 상태
  const [editRow, setEditRow]       = useState(null)   // 수정 중인 row 복사본
  const [deleteTarget, setDeleteTarget] = useState(null) // 삭제 확인 대상 row

  const [pending, setPending] = useState({ branch: '', userName: '', series: '', startDate: '', endDate: '' })

  useEffect(() => { loadAll() }, [])

  const loadAll = async (f = {}) => {
    setLoading(true)
    try {
      let query = supabase.from('sales').select('*').order('created_at', { ascending: false })
      
      if (f.branch && f.branch !== "전체") query = query.eq('branch_name', f.branch)
      if (f.userName && f.userName.trim() !== "") query = query.or(`user_name.ilike.%${f.userName}%,seller_name.ilike.%${f.userName}%`)
      if (f.startDate) query = query.gte('created_at', `${f.startDate}T00:00:00+09:00`)
      if (f.endDate) query = query.lte('created_at', `${f.endDate}T23:59:59+09:00`)

      const { data, error } = await query
      if (error) throw error
      const rows = data || []
      
      // 시리즈 필터는 JSON 내부에 있어 서버 사이드 처리가 복잡하므로 클라이언트에서 추가 필터링
      let filteredRows = rows
      if (f.series) {
        filteredRows = rows.filter(r => {
          try {
            const info = typeof r.payment_info === 'string' ? JSON.parse(r.payment_info) : r.payment_info
            return info?.items?.some(i => i.series === f.series)
          } catch { return false }
        })
      }

      setSalesData(filteredRows)
      if (!f.startDate && !f.endDate && !f.branch && !f.userName) {
        // 초기 로드 시에만 메타/랭킹 계산 (전체 데이터 기준)
        setAllData(rows)
        computeMeta(rows)
        computeRankings(rows)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const computeMeta = (rows) => {
    setBranches([...new Set(rows.map(r => r.branch_name).filter(Boolean))].sort())
    const sSet = new Set()
    rows.forEach(r => {
      try {
        const info = typeof r.payment_info === 'string' ? JSON.parse(r.payment_info) : r.payment_info
        if (info?.items) info.items.forEach(i => { if (i.series) sSet.add(i.series) })
      } catch {}
    })
    setSeriesList([...new Set([...DEFAULT_SERIES, ...sSet])].sort())
  }

  const computeRankings = (rows) => {
    const bMap = {}, pMap = {}
    rows.forEach(r => {
      const amt = parseInt(r.deposit_amount || 0)
      if (r.branch_name) {
        if (!bMap[r.branch_name]) bMap[r.branch_name] = { count: 0, amount: 0 }
        bMap[r.branch_name].count++; bMap[r.branch_name].amount += amt
      }
      if (r.user_name) {
        const key = r.user_name
        if (!pMap[key]) pMap[key] = { count: 0, amount: 0, branch: r.branch_name || '-' }
        pMap[key].count++; pMap[key].amount += amt
      }
    })
    setTopBranches(
      Object.entries(bMap).map(([branch, v]) => ({ branch, ...v }))
        .sort((a, b) => b.amount - a.amount).slice(0, 12)
    )
    setTopPersons(
      Object.entries(pMap).map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.amount - a.amount).slice(0, 12)
    )
  }

  const applyFilters = (f) => {
    loadAll(f)
    setCurrentPage(1)
  }

  const handleSearch = () => applyFilters(pending)

  const resetFilters = () => {
    const empty = { branch: '', userName: '', series: '', startDate: '', endDate: '' }
    setPending(empty)
    setSalesData(allData)
    // 초기화 시에는 전체 데이터 기준 랭킹 복구
    computeRankings(allData)
    setCurrentPage(1)
  }

  const handleCardBranch = (branch) => {
    const f = { ...pending, branch }
    setPending(f)
    applyFilters(f)
  }

  const handleCardPerson = (name) => {
    const f = { ...pending, userName: name }
    setPending(f)
    applyFilters(f)
  }

  // 날짜 기준값
  const now = new Date()
  const todayStr   = toLocalStr(now)
  const day        = now.getDay()
  const mon        = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1)); mon.setHours(0,0,0,0)
  const sun        = new Date(mon); sun.setDate(mon.getDate() + 6)
  const weekStart  = toLocalStr(mon)
  const weekEnd    = toLocalStr(sun)
  const monthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`

  const totalAmt = salesData.reduce((s, r) => s + parseInt(r.deposit_amount || 0), 0)
  const todayAmt = salesData.filter(r => toLocalStr(new Date(r.created_at)) === todayStr).reduce((s, r) => s + parseInt(r.deposit_amount || 0), 0)
  const weekAmt  = salesData.filter(r => { const d = toLocalStr(new Date(r.created_at)); return d >= weekStart && d <= weekEnd }).reduce((s, r) => s + parseInt(r.deposit_amount || 0), 0)
  const monthAmt = salesData.filter(r => toLocalStr(new Date(r.created_at)) >= monthStart).reduce((s, r) => s + parseInt(r.deposit_amount || 0), 0)

  // 시리즈 집계
  const seriesAgg = useMemo(() => {
    const map = {}
    salesData.forEach(r => {
      try {
        const info = typeof r.payment_info === 'string' ? JSON.parse(r.payment_info) : r.payment_info
        if (info?.items) info.items.forEach(i => {
          if (!i.series) return
          if (!map[i.series]) map[i.series] = { qty: 0, count: 0 }
          map[i.series].qty += parseInt(i.quantity || 0)
          map[i.series].count++
        })
      } catch {}
    })
    return Object.entries(map).map(([s, v]) => ({ series: s, ...v }))
  }, [salesData])

  // 페이지네이션
  const totalPages = Math.ceil(salesData.length / ITEMS)
  const startIdx   = (currentPage - 1) * ITEMS
  const pageItems  = salesData.slice(startIdx, startIdx + ITEMS)

  const getPageNumbers = () => {
    const max = 10, pages = []
    if (totalPages <= max) { for (let i = 1; i <= totalPages; i++) pages.push(i) }
    else {
      let start = Math.max(1, currentPage - 4)
      let end   = Math.min(totalPages, start + max - 1)
      if (end - start < max - 1) start = Math.max(1, end - max + 1)
      for (let i = start; i <= end; i++) pages.push(i)
    }
    return pages
  }

  const downloadExcel = () => {
    const rows = salesData.map(r => ({
      '일시': new Date(r.created_at).toLocaleString('ko-KR'),
      '지점': r.branch_name, '담당자': r.user_name,
      '구매자': r.customer_name, '연락처': r.phone,
      '결제수단': r.payment_method, '수량': r.quantity,
      '금액': r.deposit_amount, '상세': r.order_details
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '전사매출')
    XLSX.writeFile(wb, `전사매출현황_${todayStr}.xlsx`)
  }

  // ── 수정 저장 ─────────────────────────────────────────
  const handleEditSave = async () => {
    if (!editRow) return
    try {
      const { error } = await supabase
        .from('sales')
        .update({
          customer_name:  editRow.customer_name,
          phone:          editRow.phone,
          branch_name:    editRow.branch_name,
          user_name:      editRow.user_name,
          payment_method: editRow.payment_method,
          deposit_amount: editRow.deposit_amount,
          order_details:  editRow.order_details,
        })
        .eq('id', editRow.id)
      if (error) throw error
      // 로컬 상태 반영
      const update = (arr) => arr.map(r => r.id === editRow.id ? { ...r, ...editRow } : r)
      setAllData(prev => update(prev))
      setSalesData(prev => update(prev))
      setEditRow(null)
    } catch (err) {
      alert('수정 중 오류가 발생했습니다: ' + err.message)
    }
  }

  // ── 삭제 ─────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', deleteTarget.id)
      if (error) throw error
      const remove = (arr) => arr.filter(r => r.id !== deleteTarget.id)
      const newAll  = remove(allData)
      const newSale = remove(salesData)
      setAllData(newAll)
      setSalesData(newSale)
      computeRankings(newSale)
      setDeleteTarget(null)
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다: ' + err.message)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4" />
        <p className="text-gray-600">데이터를 불러오는 중...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => onNavigate('SystemAdminDashboard')}
            className="flex items-center text-teal-600 hover:text-teal-700">
            <ChevronLeft className="w-5 h-5 mr-1" /><span>나가기</span>
          </button>
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="LAS Logo" className="h-10 w-10"
              onError={e => e.target.style.display = 'none'} />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-teal-700 flex items-center gap-2">
                <BarChart3 className="w-6 h-6" /> 전사 매출 현황
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">전체 판매 실적 현황</p>
            </div>
          </div>
          <div className="w-20" />
        </div>

        {/* 요약 카드 4개 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: '총 누적 매출', val: totalAmt, sub: `${formatNumber(salesData.length)}건`, bg: 'bg-blue-600', icon: <TrendingUp className="w-8 h-8 text-white" />, ibg: 'bg-blue-500' },
            { label: '이번 달',     val: monthAmt, bg: 'bg-purple-600', icon: <Calendar className="w-8 h-8 text-white" />,   ibg: 'bg-purple-500' },
            { label: '이번 주',     val: weekAmt,  bg: 'bg-[#0090D4]',  icon: <BarChart3 className="w-8 h-8 text-white" />,  ibg: 'bg-blue-400' },
            { label: '오늘',        val: todayAmt, bg: 'bg-[#249689]',  icon: <Users className="w-8 h-8 text-white" />,      ibg: 'bg-teal-500' },
          ].map((c, i) => (
            <div key={i} className={`${c.bg} rounded-xl shadow-lg p-6 text-white relative overflow-hidden`}>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <div className="text-white/70 text-sm font-medium mb-1">{c.label}</div>
                  <div className="text-2xl font-bold">{formatWon(c.val)}</div>
                  {c.sub && <div className="text-white/60 text-xs mt-1">{c.sub}</div>}
                </div>
                <div className={`p-2 ${c.ibg} rounded-lg bg-opacity-50`}>{c.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 시리즈별 수직 막대그래프 3개 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <SeriesBarPanel label="K 시리즈" color="#0090D4" keys={['K2','K3','K4','K5','K6','K7']} seriesAgg={seriesAgg} />
          <SeriesBarPanel label="G 시리즈" color="#249689" keys={['G1','G2','G3','G4','G5','G6']} seriesAgg={seriesAgg} />
          <SeriesBarPanel label="S 시리즈" color="#E91E63" keys={['S2','S3','S4','S5']}           seriesAgg={seriesAgg} />
        </div>

        {/* Top 12 지점 */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-teal-800 flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-yellow-500" /> 지점별 매출 Top 12
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topBranches.length === 0
              ? <p className="text-gray-400 text-sm col-span-4 text-center py-4">데이터가 없습니다.</p>
              : topBranches.map((item, idx) => (
                <RankCard key={idx} item={item} idx={idx}
                  onClick={() => handleCardBranch(item.branch)}
                  titleKey="branch" valueKey="amount" isBlue={false} />
              ))
            }
          </div>
        </div>

        {/* Top 12 개인 */}
        <div className="mb-10">
          <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2 mb-4 mt-8">
            <Award className="w-6 h-6 text-blue-500" /> 개인별 매출 Top 12
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topPersons.length === 0
              ? <p className="text-gray-400 text-sm col-span-4 text-center py-4">데이터가 없습니다.</p>
              : topPersons.map((item, idx) => (
                <RankCard key={idx} item={item} idx={idx}
                  onClick={() => handleCardPerson(item.name)}
                  titleKey="name" subKey="branch" valueKey="amount" isBlue={true} />
              ))
            }
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">지점</label>
              <select value={pending.branch} onChange={e => setPending(p => ({ ...p, branch: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">전체 지점</option>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">시리즈</label>
              <select value={pending.series} onChange={e => setPending(p => ({ ...p, series: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">전체 시리즈</option>
                {seriesList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">담당자</label>
              <div className="relative">
                <input type="text" value={pending.userName}
                  onChange={e => setPending(p => ({ ...p, userName: e.target.value }))}
                  placeholder="담당자 이름"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 pr-8" />
                {pending.userName && (
                  <button onClick={() => setPending(p => ({ ...p, userName: '' }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">시작일</label>
              <input type="date" value={pending.startDate}
                onChange={e => setPending(p => ({ ...p, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">종료일</label>
              <input type="date" value={pending.endDate}
                onChange={e => setPending(p => ({ ...p, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <button onClick={resetFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1">
              <RotateCcw className="w-4 h-4" /> 초기화
            </button>
            <button onClick={handleSearch}
              className="px-4 py-2 text-sm text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-1">
              <Search className="w-4 h-4" /> 검색
            </button>
          </div>
        </div>

        {/* 결과 건수 + 엑셀 */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            검색 결과 <span className="font-bold text-gray-800">{formatNumber(salesData.length)}</span>건
            &nbsp;|&nbsp; 합계 <span className="font-bold text-teal-700">{formatWon(totalAmt)}</span>
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const targetDate = pending.startDate || todayStr;
                generateDailySalesReport(salesData, targetDate);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" /> 매출보고서
            </button>
            <button onClick={downloadExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm">
              <Download className="w-4 h-4" /> 엑셀 다운로드
            </button>
          </div>
        </div>

        {/* 목록 테이블 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['No.','일시','지점','담당자','구매자','연락처','결제수단','시리즈','금액','관리'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageItems.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-16 text-center text-gray-400 text-sm">
                    조건에 맞는 판매 내역이 없습니다.
                  </td></tr>
                ) : pageItems.map((r, i) => {
                  const seriesLabel = (() => {
                    try {
                      const info = typeof r.payment_info === 'string' ? JSON.parse(r.payment_info) : r.payment_info
                      return info?.items?.map(it => it.series).filter(Boolean).join(', ') || '-'
                    } catch { return '-' }
                  })()
                  return (
                    <tr key={r.id} className={`hover:bg-teal-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="px-4 py-3 text-sm text-gray-400 font-bold">{startIdx + i + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString('ko-KR', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-800 whitespace-nowrap">{r.branch_name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-teal-700 font-bold whitespace-nowrap">{r.user_name || '-'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700">{r.customer_name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{r.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs font-bold text-gray-600">{r.payment_method || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[120px] truncate">{seriesLabel}</td>
                      <td className="px-4 py-3 text-right font-black text-teal-700 text-sm whitespace-nowrap">{formatWon(r.deposit_amount)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditRow({ ...r })}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="수정">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(r)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="삭제">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {formatNumber(startIdx + 1)}–{formatNumber(Math.min(startIdx + ITEMS, salesData.length))} / {formatNumber(salesData.length)}건
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-400 disabled:opacity-30 hover:bg-gray-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {getPageNumbers().map(pg => (
                  <button key={pg} onClick={() => { setCurrentPage(pg); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${currentPage === pg ? 'bg-teal-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
                    {pg}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-400 disabled:opacity-30 hover:bg-gray-50">
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── 수정 모달 ── */}
      {editRow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-blue-600 flex items-center justify-between">
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <Edit2 className="w-4 h-4" /> 판매 내역 수정
              </h2>
              <button onClick={() => setEditRow(null)} className="text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto" style={{ maxHeight: '65vh' }}>
              {[['구매자', 'customer_name'], ['연락처', 'phone'], ['지점', 'branch_name'], ['담당자', 'user_name'], ['결제수단', 'payment_method']].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-gray-500 mb-1">{label}</label>
                  <input type="text" value={editRow[key] || ''}
                    onChange={e => setEditRow(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">금액</label>
                <input type="number" value={editRow.deposit_amount || ''}
                  onChange={e => setEditRow(prev => ({ ...prev, deposit_amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">주문 상세</label>
                <textarea value={editRow.order_details || ''} rows={2}
                  onChange={e => setEditRow(prev => ({ ...prev, order_details: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setEditRow(null)} className="flex-1 py-2.5 font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">취소</button>
              <button onClick={handleEditSave} className="flex-[2] py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 삭제 확인 모달 ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs text-center overflow-hidden">
            <div className="p-6">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="font-black text-gray-800 text-lg mb-2">삭제 확인</h3>
              <p className="text-sm text-gray-600 mb-1"><span className="font-bold">{deleteTarget.customer_name || '-'}</span> 님의</p>
              <p className="text-sm text-gray-600 mb-1"><span className="font-bold text-teal-600">{formatWon(deleteTarget.deposit_amount)}</span> 판매 내역을</p>
              <p className="text-sm text-gray-600 mb-4">삭제하시겠습니까?</p>
              <p className="text-xs text-red-400 font-medium">※ 삭제된 데이터는 복구할 수 없습니다.</p>
            </div>
            <div className="border-t flex">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3.5 font-bold text-gray-600 hover:bg-gray-50 border-r">취소</button>
              <button autoFocus onClick={handleDelete} className="flex-1 py-3.5 font-black text-red-500 hover:bg-red-50">삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}