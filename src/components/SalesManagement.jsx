import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import * as XLSX from "xlsx";
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  CreditCard,
  Banknote,
  FileUp,
  X,
  Check,
  Trophy,
  Award,
  User,
  Store,
  BarChart3,
  Search,
  RotateCcw,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Package,
  Medal,
  Users,
  FileText,
} from "lucide-react";

// SalesDashboard Component
const SalesDashboard = ({ user, viewMode, onNavigate, setActiveTab }) => {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalCount: 0,
    todayAmount: 0,
    weekAmount: 0,
    lastWeekAmount: 0,
    monthAmount: 0,
    weekRange: "",
    lastWeekRange: "",
  });
  const [seriesStats, setSeriesStats] = useState({});
  const [filters, setFilters] = useState({
    userName: "전체",
    series: "",
    startDate: "",
    endDate: "",
  });
  const [availableBranches, setAvailableBranches] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const itemsPerPage = 20;

  const handleRowClick = (record) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  useEffect(() => {
    if (viewMode) fetchData();
  }, [filters, viewMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false });
      if (viewMode === "user") query = query.eq("user_id", user.id);
      else if (viewMode === "admin")
        query = query.eq("branch_name", user.branch);
      if (filters.branch) query = query.eq("branch_name", filters.branch);
      if (filters.userName && filters.userName !== "전체")
        query = query.or(
          `user_name.ilike.%${filters.userName}%,seller_name.ilike.%${filters.userName}%`,
        );
      if (filters.series) {
        // 시리즈 필터링: JSONB 타입인 payment_info 내의 items 배열에서 series 확인
        // 클라이언트 사이드 필터링이 더 정확할 수 있으나, 일단 raw 데이터 가져온 후 필터링하는 로직으로 보완
      }
      if (filters.startDate)
        query = query.gte("created_at", `${filters.startDate}T00:00:00`);
      if (filters.endDate)
        query = query.lte("created_at", `${filters.endDate}T23:59:59`);

      let { data, error } = await query;
      if (error) throw error;

      // 시리즈 필터링 보완 (서버 사이드에서 JSONB 복합 쿼리가 까다로우므로 가져온 후 한 번 더 필터링)
      if (filters.series && data) {
        data = data.filter((r) => {
          try {
            const info =
              typeof r.payment_info === "string"
                ? JSON.parse(r.payment_info)
                : r.payment_info;
            return info?.items?.some((i) => i.series === filters.series);
          } catch {
            return false;
          }
        });
      }

      setSalesData(data || []);
      calculateStats(data || []);
      if (viewMode === "system")
        setAvailableBranches(
          [...new Set(data?.map((s) => s.branch_name).filter(Boolean))].sort(),
        );
      
      // 판매자 목록 추출 (가나다순)
      if (data) {
        setAvailableUsers([...new Set(data.map(s => s.user_name).filter(Boolean))].sort());
      }
    } catch (err) {
      console.error("Data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    // 로컬 날짜 문자열 (YYYY-MM-DD) - timezone 안전
    const toLocalStr = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    };
    const now = new Date();
    const today = toLocalStr(now);
    const day = now.getDay();
    // 이번 주 월요일 (로컬)
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    // 이번 주 일요일
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    // 지난 주
    const lastMonday = new Date(monday);
    lastMonday.setDate(monday.getDate() - 7);
    const lastSunday = new Date(monday);
    lastSunday.setDate(monday.getDate() - 1);
    // 이번 달 1일
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const mondayStr = toLocalStr(monday);
    const sundayStr = toLocalStr(sunday);
    const lastMondayStr = toLocalStr(lastMonday);
    const lastSundayStr = toLocalStr(lastSunday);
    const firstDayOfMonth = toLocalStr(firstOfMonth);
    const fmtD = (d) => `${d.getMonth() + 1}/${d.getDate()}`;

    let totalAmount = 0,
      todayAmount = 0,
      weekAmount = 0,
      lastWeekAmount = 0,
      monthAmount = 0;
    const branchMap = {},
      userMap = {},
      sMap = {};
    data.forEach((item) => {
      const amount = parseInt(item.deposit_amount || 0);
      // UTC created_at → 로컬 날짜로 변환
      const localDate = toLocalStr(new Date(item.created_at));
      totalAmount += amount;
      if (localDate === today) todayAmount += amount;
      if (localDate >= mondayStr && localDate <= sundayStr)
        weekAmount += amount;
      if (localDate >= lastMondayStr && localDate <= lastSundayStr)
        lastWeekAmount += amount;
      if (localDate >= firstDayOfMonth) monthAmount += amount;
      if (item.branch_name)
        branchMap[item.branch_name] =
          (branchMap[item.branch_name] || 0) + amount;
      if (item.user_name) {
        const key = `${item.user_name} (${item.user_branch || item.branch_name || "-"})`;
        userMap[key] = (userMap[key] || 0) + amount;
      }
      try {
        const info =
          typeof item.payment_info === "string"
            ? JSON.parse(item.payment_info)
            : item.payment_info;
        if (info && info.items)
          info.items.forEach((pkg) => {
            sMap[pkg.series] =
              (sMap[pkg.series] || 0) + (parseInt(pkg.quantity) || 0);
          });
      } catch (e) {}
    });
    setStats({
      totalAmount,
      totalCount: data.length,
      todayAmount,
      weekAmount,
      lastWeekAmount,
      monthAmount,
      weekRange: `${fmtD(monday)}~${fmtD(sunday)}`,
      lastWeekRange: `${fmtD(lastMonday)}~${fmtD(lastSunday)}`,
    });
    setSeriesStats(sMap);
  };

  const fmt = (num) => new Intl.NumberFormat("ko-KR").format(num) + "원";
  const totalPages = Math.ceil(salesData.length / itemsPerPage);
  const currentItems = salesData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleDownloadExcel = () => {
    const exportData = salesData.map((s) => ({
      일시: new Date(s.created_at).toLocaleString(),
      지점: s.branch_name,
      담당자: s.user_name,
      구매자: s.customer_name,
      연락처: s.phone,
      결제수단: s.payment_method,
      수량: s.quantity,
      금액: s.deposit_amount,
      상세내용: s.order_details,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "매출내역");
    XLSX.writeFile(
      wb,
      `매출현황_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  const RankItem = ({ item, idx, color }) => (
    <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 ${idx === 0 ? "bg-yellow-400" : idx === 1 ? "bg-gray-400" : idx === 2 ? "bg-orange-400" : "bg-gray-200 text-gray-500"}`}
      >
        {idx + 1}
      </div>
      <span className="flex-1 font-bold text-gray-700 text-sm truncate">
        {item.name}
      </span>
      <span className={`font-black text-sm shrink-0 ${color}`}>
        {fmt(item.amount)}
      </span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5 pb-20">
      <div className="flex justify-between items-center bg-white/50 py-2">
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

      {/* 필터 (시리즈/판매자/시작일/종료일 2row 배치) - 상단으로 이동 */}
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
              판매자
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
                branch: "",
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
        <div className="absolute -right-3 -bottom-3 opacity-10">
          <ShoppingCart size={80} />
        </div>
        <p className="text-teal-100 text-xs font-bold mb-1">총 누적 매출</p>
        <h3 className="text-2xl font-black">{fmt(stats.totalAmount)}</h3>
        <p className="text-[10px] text-teal-200 mt-2">
          총 {stats.totalCount}건
        </p>
      </div>

      {/* 2x2 매출 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-gray-400 text-xs font-bold">오늘</p>
            <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
              <Calendar size={14} />
            </div>
          </div>
          <h3 className="text-base font-black text-gray-800">
            {fmt(stats.todayAmount)}
          </h3>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-gray-400 text-xs font-bold">이번 달</p>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <Trophy size={14} />
            </div>
          </div>
          <h3 className="text-base font-black text-gray-800">
            {fmt(stats.monthAmount)}
          </h3>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
          <div className="flex justify-between items-start mb-0.5">
            <p className="text-gray-400 text-xs font-bold">이번 주</p>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <BarChart3 size={14} />
            </div>
          </div>
          <p className="text-[10px] text-gray-300 mb-1">{stats.weekRange}</p>
          <h3 className="text-base font-black text-gray-800">
            {fmt(stats.weekAmount)}
          </h3>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
          <div className="flex justify-between items-start mb-0.5">
            <p className="text-gray-400 text-xs font-bold">지난 주</p>
            <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg">
              <BarChart3 size={14} />
            </div>
          </div>
          <p className="text-[10px] text-gray-300 mb-1">
            {stats.lastWeekRange}
          </p>
          <h3 className="text-base font-black text-gray-800">
            {fmt(stats.lastWeekAmount)}
          </h3>
        </div>
      </div>

      {/* 시리즈별 */}
      {Object.keys(seriesStats).length > 0 && (
        <div className="pt-2">
          <h4 className="text-sm font-black text-gray-600 mb-2 flex items-center gap-1.5">
            <Package size={14} className="text-teal-500" /> 시리즈별 판매
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(seriesStats)
              .sort()
              .map(([series, count]) => (
                <div
                  key={series}
                  className="bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-2"
                >
                  <span className="font-black text-gray-800 text-sm">
                    {series}
                  </span>
                  <span className="bg-teal-100 text-teal-700 text-xs font-black px-2 py-0.5 rounded-full">
                    {count}개
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 개인매출현황 (랭킹) */}
      <div className="pt-4">
        <h3 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-3">
          <Award className="text-blue-500" size={16} />
          개인매출현황
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(
            salesData.reduce((acc, curr) => {
              const name = curr.user_name || "알 수 없음";
              acc[name] = (acc[name] || 0) + (parseInt(curr.deposit_amount) || 0);
              return acc;
            }, {}),
          )
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(([name, amount], idx) => (
              <div
                key={name}
                className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 ${idx === 0 ? "bg-yellow-400" : idx === 1 ? "bg-gray-400" : idx === 2 ? "bg-orange-400" : "bg-gray-200 text-gray-500"}`}
                >
                  {idx + 1}
                </div>
                <span className="flex-1 font-bold text-gray-700 text-sm truncate">
                  {name}
                </span>
                <span className="font-black text-sm shrink-0 text-blue-700">
                  {fmt(amount)}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* 모바일 카드 */}
      <div className="md:hidden space-y-3">
        {currentItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm active:bg-gray-50 transition-colors"
            onClick={() => handleRowClick(item)}
          >
            {/* 1행: 시간, 구매자(변경), 금액 */}
            <div className="flex justify-between items-center mb-1.5 pb-1.5 border-b border-gray-50">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                  {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-xs font-black text-gray-800">{item.customer_name || "구매자 미입력"}</span>
              </div>
              <span className="text-[13px] font-black text-[#249689]">
                {fmt(item.deposit_amount)}
              </span>
            </div>

            {/* 2행: 상세내용, 상세보기 화살표 */}
            <div className="flex justify-between items-end">
              <div className="flex-1 overflow-hidden mr-2">
                <div className="flex items-center gap-1.5">
                  <Package size={10} className="text-teal-400 shrink-0" />
                  <p className="text-[11px] font-bold text-gray-600 truncate">
                    {item.order_details || "-"}
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-0.5 text-[#249689] font-black text-[10px] opacity-80">
                상세보기 <ChevronRight size={10} />
              </div>
            </div>
          </div>
        ))}
        {salesData.length === 0 && !loading && (
          <p className="text-center text-gray-400 py-10 text-sm">
            판매 내역이 없습니다.
          </p>
        )}
      </div>

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
              <tr
                key={item.id}
                className="hover:bg-teal-50/30 transition-colors cursor-pointer group"
                onClick={() => handleRowClick(item)}
              >
                <td className="px-5 py-4" colSpan="2">
                  {/* 1행: 일시 및 구매자 */}
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-3">
                       <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded leading-tight">
                         {new Date(item.created_at).toLocaleString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                       </span>
                       <span className="text-sm font-black text-gray-800 flex items-center gap-1.5">
                         <User size={14} className="text-blue-500" />
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
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                           <Package size={14} className="text-teal-400 shrink-0" />
                           <span className="text-xs text-gray-600 font-bold truncate max-w-[200px] md:max-w-md">
                             {item.order_details || "-"}
                           </span>
                        </div>
                     </div>
                     <div className="flex items-center gap-1 text-[#249689] font-black text-[11px] group-hover:translate-x-1 transition-transform">
                        상세보기 <ChevronRight size={14} />
                     </div>
                  </div>
                </td>
              </tr>
            ))}
            {salesData.length === 0 && !loading && (
              <tr>
                <td
                  colSpan="2"
                  className="px-5 py-20 text-center text-gray-400 text-sm font-bold"
                >
                  판매 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이징 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-400 disabled:opacity-30 hover:bg-gray-50"
          >
            <ChevronLeft size={18} />
          </button>
          {[...Array(Math.min(totalPages, 10))].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${currentPage === i + 1 ? "bg-teal-600 text-white shadow-md" : "bg-white text-gray-400 border border-gray-100 hover:bg-gray-50"}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-400 disabled:opacity-30 hover:bg-gray-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}



      {loading && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-teal-800 animate-pulse text-sm">
              매출 집계 중...
            </p>
          </div>
        </div>
      )}

      {/* 매출 상세 모달 */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 bg-[#249689] flex items-center justify-between">
              <div>
                <h2 className="font-black text-white text-base">매출 상세 내역</h2>
                <p className="text-[10px] text-teal-100 font-bold">
                  {new Date(selectedRecord.created_at).toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-white/70 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[75vh]">
              {/* 담당자 섹션 */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-[11px] font-black text-gray-400 mb-2 uppercase tracking-wide">판매 정보</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-bold">지점 / 판매자</span>
                    <span className="font-black text-gray-800">{selectedRecord.branch_name} / {selectedRecord.seller_name || selectedRecord.user_name}</span>
                  </div>
                </div>
              </div>

              {/* 구매자 섹션 */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-[11px] font-black text-gray-400 mb-2 uppercase tracking-wide">구매자 정보</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-bold">성함 / 타입</span>
                    <span className="font-black text-gray-800">{selectedRecord.customer_name || "-"} ({selectedRecord.buyer_type || "일반"})</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-bold">연락처</span>
                    <span className="font-black text-gray-800">{selectedRecord.phone || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-bold">생년월일</span>
                    <span className="font-black text-gray-800">{selectedRecord.age || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-bold">주소</span>
                    <span className="font-black text-gray-800 text-right text-xs max-w-[150px]">{selectedRecord.address || "-"}</span>
                  </div>
                  {selectedRecord.planned_delivery && (
                     <div className="pt-1 mt-1 border-t border-gray-200">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-black">계획배송(일정협의)</span>
                     </div>
                  )}
                  {selectedRecord.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 mb-1">기타</p>
                      <p className="text-xs font-bold text-gray-700 bg-white p-2 rounded-lg border border-gray-100 leading-relaxed whitespace-pre-wrap">
                        {selectedRecord.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 주문 상품 섹션 */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-[11px] font-black text-gray-400 mb-2 uppercase tracking-wide">주문 상품</p>
                <div className="space-y-2">
                  {(() => {
                    try {
                      const info = typeof selectedRecord.payment_info === 'string' 
                        ? JSON.parse(selectedRecord.payment_info) 
                        : selectedRecord.payment_info;
                      return info?.items?.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-sm bg-white p-2 rounded-lg border border-gray-100">
                           <span className="font-bold text-gray-600">{item.language} {item.series}</span>
                           <span className="font-black text-teal-700">{item.quantity}세트</span>
                        </div>
                      ));
                    } catch {
                      return <p className="text-sm font-bold text-gray-500">{selectedRecord.order_details}</p>;
                    }
                  })()}
                   <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-sm font-black text-gray-800">구매 합계</span>
                    <span className="text-base font-black text-[#249689]">{fmt(selectedRecord.deposit_amount)}</span>
                  </div>
                </div>
              </div>

              {/* 결제 상세 섹션 */}
              {(() => {
                try {
                  const info = typeof selectedRecord.payment_info === 'string' 
                    ? JSON.parse(selectedRecord.payment_info) 
                    : selectedRecord.payment_info;
                  if (!info) return null;
                  
                  return (
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                       <p className="text-[11px] font-black text-gray-400 mb-2 uppercase tracking-wide">결제 수단별 상세</p>
                       
                       {/* 카드 내역 */}
                       {info.cards && info.cards.length > 0 && info.cards.map((card, i) => (
                         <div key={i} className="bg-white p-3 rounded-xl border border-gray-200 space-y-1.5 shadow-sm">
                            <div className="flex justify-between items-center pb-1 border-b border-gray-100">
                               <span className="text-xs font-black text-blue-600 flex items-center gap-1"><CreditCard size={12}/> 카드-{i+1}</span>
                               <span className="font-black text-gray-800 text-sm">{fmt(card.amount || 0)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-y-1 text-[11px] pt-1">
                               <div className="flex justify-between pr-2 border-r border-gray-100">
                                 <span className="text-gray-400">단말기:</span> <span className="font-bold">{card.terminalNo || "-"}</span>
                               </div>
                               <div className="flex justify-between pl-2">
                                 <span className="text-gray-400">일련번호:</span> <span className="font-bold">{card.serialNo || "-"}</span>
                               </div>
                               <div className="flex justify-between pr-2 border-r border-gray-100">
                                 <span className="text-gray-400">카드사:</span> <span className="font-bold">{card.issuer || "-"}</span>
                               </div>
                               <div className="flex justify-between pl-2">
                                 <span className="text-gray-400">승인번호:</span> <span className="font-bold">{card.approvalNo || "-"}</span>
                               </div>
                            </div>
                            {card.receiptUrl && (
                               <div className="pt-2 mt-1 border-t border-gray-50 text-right">
                                  <button
                                     onClick={() => window.open(card.receiptUrl, "_blank")}
                                     className="text-[10px] font-black text-teal-600 hover:underline"
                                  >
                                    영수증 보기
                                  </button>
                               </div>
                            )}
                         </div>
                       ))}

                       {/* 현금 내역 */}
                       {info.cash && (
                          <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-1.5 shadow-sm">
                             <div className="flex justify-between items-center pb-1 border-b border-gray-100">
                                <span className="text-xs font-black text-green-600 flex items-center gap-1"><Banknote size={12}/> 현금(입금)</span>
                                <span className="font-black text-gray-800 text-sm">{fmt(info.cash.amount || 0)}</span>
                             </div>
                             <div className="grid grid-cols-1 gap-y-1 text-[11px] pt-1 uppercase">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">입금기관:</span> <span className="font-bold">{info.cash.bank || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">입금자명:</span> <span className="font-bold">{info.cash.depositor || "-"}</span>
                                </div>
                             </div>
                          </div>
                       )}
                    </div>
                  );
                } catch { return null; }
              })()}
            </div>

            <div className="p-4 bg-gray-50 border-t flex gap-2">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full py-3.5 bg-gray-800 text-white font-black rounded-2xl hover:bg-black transition-all shadow-lg shadow-gray-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function SalesManagement({ user, onNavigate }) {
  const [formData, setFormData] = useState({
    customerName: "",
    age: "",
    address: "",
    phone: "",
    paymentMethod: "카드",
    needsShipping: false,
    plannedDelivery: false,
    buyerType: "구독", // 기본값: 구독
    privacyAgreed: false,
    marketingAgreed: false,
    sellerName: user?.name || "",
    notes: "",
  });

  // 신규 상태 추가
  const [orderItems, setOrderItems] = useState([
    { id: Date.now(), language: "한글", series: "K2", quantity: 1, price: 0 },
  ]);
  const [cardInfos, setCardInfos] = useState([
    { 
      id: Date.now(), 
      number: ["", "", "", ""], 
      issuer: "", 
      approvalNo: "", 
      amount: "", 
      terminalNo: "", 
      serialNo: "",
      receiptUrl: "",
      receiptName: ""
    },
  ]);
  const [cashInfo, setCashInfo] = useState({
    bank: "",
    depositor: "",
    amount: "",
  });

  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCardValidationModal, setShowCardValidationModal] = useState(false);
  const [cardValidationResult, setCardValidationResult] = useState({
    success: false,
    message: "",
  });
  const [excelPreview, setExcelPreview] = useState(null);
  const [showExcelPreview, setShowExcelPreview] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const resetForm = () => {
    setFormData((prev) => ({
      customerName: "",
      age: "",
      address: "",
      phone: "",
      paymentMethod: "카드",
      needsShipping: false,
      plannedDelivery: false,
      buyerType: "구독",
      privacyAgreed: false,
      marketingAgreed: false,
      sellerName: prev.sellerName,
      notes: "",
    }));
    setOrderItems([
      { id: Date.now(), language: "한글", series: "K2", quantity: 1, price: getPrice("K2", "한글") },
    ]);
    setCardInfos([
      { 
        id: Date.now(), 
        number: ["", "", "", ""], 
        issuer: "", 
        approvalNo: "", 
        amount: "", 
        terminalNo: "", 
        serialNo: "",
        receiptUrl: "",
        receiptName: ""
      },
    ]);
    setCashInfo({
      bank: "",
      depositor: "",
      amount: "",
    });
  };

  // 탭 및 권한 상태
  const [activeTab, setActiveTab] = useState("input"); // 'input' | 'stats'
  const [viewMode, setViewMode] = useState("");

  useEffect(() => {
    if (user?.user_type === "시스템관리자") setViewMode("system");
    else if (user?.user_type === "지점장" || user?.user_type === "지점관리자")
      setViewMode("admin");
    else setViewMode("user");
  }, [user]);

  // 가격 정보 로드
  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("product_prices")
        .select("*")
        .lte("start_date", today)
        .or(`end_date.is.null,end_date.gte.${today}`);

      if (error) throw error;
      setPrices(data || []);

      // 초기 아이템 가격 설정
      if (data && data.length > 0) {
        setOrderItems((prev) =>
          prev.map((item) => {
            const priceObj = data.find(
              (p) => p.series === item.series && p.language === item.language,
            );
            return { ...item, price: priceObj ? priceObj.price : 0 };
          }),
        );
      }
    } catch (err) {
      console.error("가격 정보 로드 오류:", err);
    }
  };

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7)
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 금액 포맷팅 함수
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "0원";
    const numbers = value.toString().replace(/[^\d]/g, "");
    if (!numbers) return "0원";
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "원";
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === "checkbox" ? checked : value;

    if (name === "phone") {
      finalValue = formatPhoneNumber(value);
    }

    setFormData({
      ...formData,
      [name]: finalValue,
    });
  };

  // 상품 항목 관리
  const addOrderItem = () => {
    const newId = Date.now();
    setOrderItems([
      ...orderItems,
      {
        id: newId,
        language: "한글",
        series: "K2",
        quantity: 1,
        price: getPrice("K2", "한글"),
      },
    ]);
  };

  const removeOrderItem = (id) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((item) => item.id !== id));
    }
  };

  const updateOrderItem = (id, field, value) => {
    setOrderItems(
      orderItems.map((item) => {
        if (item.id === id) {
          const newItem = { ...item, [field]: value };
          if (field === "series" || field === "language") {
            newItem.price = getPrice(newItem.series, newItem.language);
          }
          return newItem;
        }
        return item;
      }),
    );
  };

  const getPrice = (series, language) => {
    const priceObj = prices.find(
      (p) => p.series === series && p.language === language,
    );
    return priceObj ? priceObj.price : 0;
  };

  const calculateTotal = () => {
    return orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  };

  // 카드 정보 관리
  const addCardInfo = () => {
    if (cardInfos.length >= 3) {
      alert("카드는 최대 3개까지만 등록 가능합니다.");
      return;
    }
    setCardInfos([
      ...cardInfos,
      { 
        id: Date.now(), 
        number: ["", "", "", ""], 
        issuer: "", 
        approvalNo: "", 
        amount: "", 
        terminalNo: "", 
        serialNo: "",
        receiptUrl: "",
        receiptName: ""
      },
    ]);
  };

  const removeCardInfo = (id) => {
    if (cardInfos.length > 1) {
      setCardInfos(cardInfos.filter((c) => c.id !== id));
    }
  };

  const handleCardInfoChange = (id, field, value) => {
    setCardInfos(
      cardInfos.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleReceiptUpload = async (id, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `receipts/${fileName}`;

      const { data, error } = await supabase.storage
        .from('sales-receipts')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('sales-receipts')
        .getPublicUrl(filePath);

      setCardInfos(
        cardInfos.map((c) => 
          c.id === id ? { ...c, receiptUrl: publicUrl, receiptName: file.name } : c
        )
      );
    } catch (err) {
      console.error("Receipt upload error:", err);
      const blobUrl = URL.createObjectURL(file);
      setCardInfos(
        cardInfos.map((c) => 
          c.id === id ? { ...c, receiptUrl: blobUrl, receiptName: file.name } : c
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const validateCardNumber = (id) => {
    const card = cardInfos.find(c => c.id === id);
    const fullNumber = card.number.join("");
    if (fullNumber.length !== 16) {
      setCardValidationResult({
        success: false,
        message: "카드번호 16자리를 모두 입력해주세요.",
      });
    } else {
      setCardValidationResult({
        success: true,
        message: "유효한 카드 번호 형식입니다.",
      });
    }
    setShowCardValidationModal(true);
  };

  // 엑셀 업로드
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      if (data && data.length > 0 && data[0]["지점명"]) {
        handleBatchSalesUpload(data);
      } else {
        setExcelPreview(data);
        setShowExcelPreview(true);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBatchSalesUpload = async (rawData) => {
    setLoading(true);
    try {
      const salesMap = new Map();

      rawData.forEach(row => {
        const key = `${row["구매자성함"] || ""}_${row["연락처"] || ""}_${row["지점명"] || ""}`;
        if (!salesMap.has(key)) {
          salesMap.set(key, {
            header: row,
            items: [],
            cards: [],
            cash: null
          });
        }
        
        const entry = salesMap.get(key);

        if (row["상품시리즈"] || row["상품언어"]) {
          entry.items.push({
            language: row["상품언어"] || "한글",
            series: row["상품시리즈"] || "K2",
            quantity: parseInt(row["상품수량"] || 1),
            price: getPrice(row["상품시리즈"] || "K2", row["상품언어"] || "한글")
          });
        }

        const cardAmt = parseInt(row["카드결제액"]?.toString().replace(/[^\d]/g, "") || 0);
        if (cardAmt > 0) {
          entry.cards.push({
            amount: cardAmt.toString(),
            issuer: row["카드사"] || "알수없음",
            approvalNo: row["승인번호"] || "",
            terminalNo: row["단말기번호"] || "",
            serialNo: row["일련번호"] || "",
            number: ["", "", "", ""]
          });
        }

        const cashAmt = parseInt(row["현금입금액"]?.toString().replace(/[^\d]/g, "") || 0);
        if (cashAmt > 0 && !entry.cash) {
          entry.cash = {
            amount: cashAmt.toString(),
            bank: row["입금기관"] || "",
            depositor: row["입금자명"] || ""
          };
        }
      });

      const insertPromises = Array.from(salesMap.values()).map(sale => {
        const { header, items, cards, cash } = sale;
        
        const totalCardAmount = cards.reduce((sum, c) => sum + parseInt(c.amount), 0);
        const totalCashAmount = cash ? parseInt(cash.amount) : 0;
        const depositAmount = totalCardAmount + totalCashAmount;

        const totalQty = items.reduce((sum, it) => sum + it.quantity, 0);
        const orderSummary = items.length > 0 
          ? items.map(it => `${it.language} ${it.series} ${it.quantity}개`).join(", ")
          : "상품 정보 없음";

        let paymentMethodStr = "";
        if (cards.length > 0 && cash) paymentMethodStr = "카드+입금";
        else if (cards.length > 0) paymentMethodStr = cards.length > 1 ? `카드(${cards.length}건)` : "카드";
        else if (cash) paymentMethodStr = "입금";

        return {
          user_id: user?.id || null,
          branch_name: header["지점명"] || user?.branch || null,
          user_name: header["담당자"] || user?.name || null,
          seller_name: header["판매자"] || null,
          user_branch: header["지점명"] || user?.branch || null,
          customer_name: header["구매자성함"] || null,
          phone: header["연락처"] || null,
          address: header["주소"] || null,
          age: header["생년월일"] ? parseInt(header["생년월일"].toString().replace(/[^\d]/g, "")) : null,
          needs_shipping: header["배송여부(Y/N)"] === "Y",
          planned_delivery: header["계획배송(Y/N)"] === "Y",
          buyer_type: header["구매자구분(일반/구독/관리/시리즈구매)"] === "구독" ? "subscription" : 
                      header["구매자구분(일반/구독/관리/시리즈구매)"] === "관리" ? "management" : 
                      header["구매자구분(일반/구독/관리/시리즈구매)"] === "시리즈구매" ? "series" : "normal",
          payment_method: paymentMethodStr,
          quantity: totalQty,
          deposit_amount: depositAmount,
          order_details: orderSummary,
          privacy_agreed: true,
          marketing_agreed: false,
          payment_info: JSON.stringify({
            cards: cards,
            cash: cash,
            items: items
          })
        };
      });

      const { error } = await supabase.from("sales").insert(insertPromises);
      if (error) throw error;

      alert(`${insertPromises.length}건의 매출 데이터가 성공적으로 일괄 업로드되었습니다.`);
      setActiveTab("dashboard"); 
    } catch (err) {
      console.error("Batch upload error:", err);
      alert("일괄 업로드 중 오류가 발생했습니다. 엑셀 파일 형식을 확인 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const applyExcelData = () => {
    if (!excelPreview) return;

    const newItems = excelPreview.map((row, index) => {
      const language = row["언어"] || row["language"] || "한글";
      const series = row["시리즈"] || row["series"] || "K2";
      const quantity = parseInt(row["수량"] || row["quantity"] || 1);

      return {
        id: Date.now() + index,
        language,
        series,
        quantity,
        price: getPrice(series, language),
      };
    });

    setOrderItems(newItems);
    setShowExcelPreview(false);
    setExcelPreview(null);
  };

  // 필수 입력 검증
  const validateForm = () => {
    if (orderItems.length === 0) {
      alert("상품을 하나 이상 선택해주세요.");
      return false;
    }

    if (formData.needsShipping) {
      if (!formData.customerName?.trim()) {
        alert("배송을 위해 구매자 이름을 입력해주세요");
        return false;
      }
      if (!formData.address?.trim()) {
        alert("배송을 위해 주소를 입력해주세요");
        return false;
      }
      if (!formData.phone?.trim()) {
        alert("배송을 위해 연락처를 입력해주세요");
        return false;
      }
    }

    const totalPaidCards = cardInfos.reduce((sum, c) => sum + parseInt(c.amount?.replace(/[^0-9]/g, "") || 0), 0);
    const cashAmount = parseInt(cashInfo.amount.replace(/[^0-9]/g, "") || 0);
    const totalPaid = totalPaidCards + cashAmount;
    const totalOrder = calculateTotal();

    if (totalPaid === 0) {
      alert("결제 금액을 입력해주세요.");
      return false;
    }

    if (totalPaid !== totalOrder) {
      alert(
        `주문 합계(${formatCurrency(totalOrder)})와 결제 합계(${formatCurrency(totalPaid)})가 일치하지 않습니다. 금액을 정확히 입력해주세요.`,
      );
      return false;
    }

    // 카드 정보 검증 (현금으로 전액 결제한 경우 카드 체크 루틴 건너뜀)
    if (cashAmount !== totalOrder) {
      for (let c of cardInfos) {
        const cAmt = parseInt(c.amount?.replace(/[^0-9]/g, "") || 0);
        if (cAmt > 0) {
          if (!c.issuer) {
            alert("카드사를 입력해주세요");
            return false;
          }
          if (!c.approvalNo) {
            alert("승인번호를 입력해주세요");
            return false;
          }
        }
      }
    }

    // 현금 정보 검증 (카드로 전액 결제한 경우 현금 체크 루틴 건너뜀)
    if (totalPaidCards !== totalOrder) {
      if (cashAmount > 0) {
        if (!cashInfo.bank) {
          alert("입금기관명을 입력해주세요");
          return false;
        }
        if (!cashInfo.depositor) {
          alert("입금자명을 입력해주세요");
          return false;
        }
      }
    }

    if (!formData.privacyAgreed) {
      alert("개인정보 수집 및 이용에 동의해주세요");
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const totalAmount = calculateTotal();
      const totalQuantity = orderItems.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      const orderSummary = orderItems
        .map((item) => `${item.language} ${item.series} ${item.quantity}개`)
        .join(", ");

      const cardAmountTotal = cardInfos.reduce((sum, c) => sum + parseInt(c.amount?.replace(/[^0-9]/g, "") || 0), 0);
      const cashAmount = parseInt(cashInfo.amount.replace(/[^0-9]/g, "") || 0);

      let paymentMethodStr = "";
      if (cardAmountTotal > 0 && cashAmount > 0) paymentMethodStr = "카드+입금";
      else if (cardAmountTotal > 0) paymentMethodStr = "카드";
      else if (cashAmount > 0) paymentMethodStr = "입금";

      const insertData = {
        user_id: user?.id || null,
        branch_name: user?.branch || null,
        user_name: formData.sellerName || user?.name || null,
        seller_name: formData.sellerName || null,
        user_branch: user?.branch || null,
        customer_name: formData.customerName?.trim() || null,
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        payment_method: paymentMethodStr,
        quantity: totalQuantity,
        deposit_amount: totalAmount,
        order_details: orderSummary,
        age: formData.age ? parseInt(formData.age) : null,
        needs_shipping: formData.needsShipping,
        planned_delivery: formData.plannedDelivery,
        buyer_type: formData.buyerType,
        privacy_agreed: formData.privacyAgreed,
        marketing_agreed: formData.marketingAgreed,
        notes: formData.notes || null,
        payment_info: JSON.stringify({
          cards: cardInfos.filter(c => parseInt(c.amount?.replace(/[^0-9]/g, "") || 0) > 0),
          cash: cashAmount > 0 ? cashInfo : null,
          items: orderItems,
        }),
      };

      const { data, error } = await supabase
        .from("sales")
        .insert([insertData])
        .select();

      if (error) throw error;

      alert("저장되었습니다!");
      resetForm();
    } catch (err) {
      console.error("저장 오류:", err);
      alert("데이터 저장 중 오류가 발생했습니다. 입력값 확인 후 다시 시도해 주시기 바랍니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 pb-10">
      <div
        className="max-w-md mx-auto bg-white rounded-lg shadow-lg relative overflow-hidden"
        style={{
          padding: "12px",
          paddingBottom: activeTab === "input" ? "24px" : "0px",
        }}
      >
        {/* 헤더 섹션 (시안 반영: 로고 + LAS Book Store) */}
        <div className="flex flex-col items-center justify-center pt-6 pb-4 mb-2 relative">
          <div className="flex items-center gap-3 mb-1">
            <img
              src="/images/logo.png"
              alt="LAS Logo"
              className="w-10 h-10 object-contain"
              onError={(e) => (e.target.style.display = "none")}
            />
            <h1
              className="text-3xl font-black tracking-tight"
              style={{ color: "#1fa193" }}
            >
              LAS Book Store
            </h1>
          </div>
          <button
            onClick={() => onNavigate?.("Dashboard")}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors shadow-sm"
            title="나가기"
          >
            <X size={22} />
          </button>
        </div>

        {/* 탭 네비게이션 - 헤더 바로 아래 */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-3">
          <button
            onClick={() => setActiveTab("input")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === "input"
                ? "bg-white text-teal-600 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            구매정보
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === "stats"
                ? "bg-white text-teal-600 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            매출현황
          </button>
        </div>

        {activeTab === "stats" ? (
          <SalesDashboard
            user={user}
            viewMode="admin"
            onNavigate={onNavigate}
            setActiveTab={setActiveTab}
          />
        ) : (
          <>
            {/* 지점 정보 */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  지점명
                </label>
                <div className="font-bold text-gray-800">
                  {user?.branch || "-"}
                </div>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  이름
                </label>
                <div className="font-bold text-gray-800">
                  {user?.name || "-"}
                </div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-teal-500 group shadow-sm relative">
                <label className="block text-xs font-bold text-teal-600 mb-1">
                  판매자
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="sellerName"
                    value={formData.sellerName}
                    onChange={handleChange}
                    placeholder="판매자 이름"
                    className="w-full h-6 px-1 font-black text-gray-800 outline-none bg-transparent"
                  />
                  {formData.sellerName && (
                    <button
                      onClick={() => setFormData({ ...formData, sellerName: "" })}
                      className="text-gray-400 hover:text-teal-600 p-1"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="border border-teal-200 rounded-xl p-2 bg-teal-50/20 transition-all flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="needsShipping"
                      checked={formData.needsShipping}
                      onChange={handleChange}
                      className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                    />
                    <span
                      className="font-bold text-teal-800"
                      style={{ fontSize: "15px" }}
                    >
                      배송이 필요합니다
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="plannedDelivery"
                      checked={formData.plannedDelivery}
                      onChange={handleChange}
                      className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                    />
                    <span
                      className="font-bold text-teal-800"
                      style={{ fontSize: "15px" }}
                    >
                      계획배송(일정협의)
                    </span>
                  </label>
                </div>
              </div>

              {/* 구매자 기본정보 */}
              <div className="border border-gray-200 rounded-xl p-2.5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3
                    className="font-bold flex items-center gap-2"
                    style={{ color: "#249689", fontSize: "16px" }}
                  >
                    <div className="w-1 h-5 bg-teal-500 rounded-full"></div>
                    구매자 기본정보
                  </h3>
                  <div className="flex items-center gap-2">
                    {["구독", "관리", "시리즈구매"].map((type) => (
                      <label key={type} className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="buyerType"
                          value={type}
                          checked={formData.buyerType === type}
                          onChange={handleChange}
                          className="w-3 h-3 accent-teal-600"
                        />
                        <span className="text-xs font-bold text-gray-600">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block mb-0.5 text-xs font-bold text-gray-700">
                      이름{" "}
                      {formData.needsShipping && (
                        <span className="text-red-500">*</span>
                      )}
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
                    <label className="block mb-0.5 text-xs font-bold text-gray-700">
                      생년월일
                    </label>
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
                      연락처{" "}
                      {formData.needsShipping && (
                        <span className="text-red-500">*</span>
                      )}
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
                      주소{" "}
                      {formData.needsShipping && (
                        <span className="text-red-500">*</span>
                      )}
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
                  <h3
                    className="font-bold flex items-center gap-2"
                    style={{ color: "#249689", fontSize: "16px" }}
                  >
                    <div className="w-1 h-5 bg-teal-500 rounded-full"></div>
                    구매상품
                  </h3>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold cursor-pointer hover:bg-blue-100 transition-colors border border-blue-100">
                      <FileUp size={14} />
                      엑셀업로드
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        className="hidden"
                        onChange={handleExcelUpload}
                      />
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
                    <div
                      key={item.id}
                      className="p-3 border border-gray-100 rounded-xl bg-gray-50/50 relative group"
                    >
                      <button
                        onClick={() => removeOrderItem(item.id)}
                        className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-20"
                        title="항목 삭제"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                      <div className="flex items-center gap-1.5 mb-1.5 overflow-x-auto">
                        <div className="flex-1 min-w-[60px]">
                          <label className="block mb-0.5 text-[12px] font-bold text-gray-600">
                            언어
                          </label>
                          <select
                            value={item.language}
                            onChange={(e) =>
                              updateOrderItem(
                                item.id,
                                "language",
                                e.target.value,
                              )
                            }
                            className="w-full px-1 py-1 border border-gray-200 rounded-lg bg-white text-sm outline-none focus:ring-1 focus:ring-teal-500 transition-all font-bold"
                          >
                            <option value="한글">한글</option>
                            <option value="영문">영문</option>
                          </select>
                        </div>
                        <div className="flex-[1.2] min-w-[70px]">
                          <label className="block mb-0.5 text-[12px] font-bold text-gray-600">
                            시리즈
                          </label>
                          <select
                            value={item.series}
                            onChange={(e) =>
                              updateOrderItem(item.id, "series", e.target.value)
                            }
                            className="w-full px-1 py-1 border border-gray-200 rounded-lg bg-white text-sm outline-none focus:ring-1 focus:ring-teal-500 transition-all font-bold"
                          >
                            {Array.from(
                              { length: 6 },
                              (_, i) => `K${i + 2}`,
                            ).map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                            {Array.from(
                              { length: 6 },
                              (_, i) => `G${i + 1}`,
                            ).map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                            {Array.from(
                              { length: 4 },
                              (_, i) => `S${i + 2}`,
                            ).map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-[50px]">
                          <label className="block mb-0.5 text-[12px] font-bold text-gray-600">
                            수량
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateOrderItem(
                                item.id,
                                "quantity",
                                parseInt(e.target.value) || 1,
                              )
                            }
                            className="w-full px-1 py-1 border border-gray-200 rounded-lg bg-white text-sm text-center font-bold outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                        <div className="flex-[1.5] text-right">
                          <label className="block mb-0.5 text-[12px] font-bold text-gray-600">
                            금액
                          </label>
                          <div className="text-sm font-bold text-teal-700 leading-tight">
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-dashed border-gray-200 flex items-center justify-between">
                  <span
                    className="font-bold text-gray-800"
                    style={{ fontSize: "16px" }}
                  >
                    총 합계금액
                  </span>
                  <span className="font-black text-2xl text-teal-600 tracking-tight">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>

              {/* 결제정보 섹션: 고밀도 레이아웃 (사용자 요청 반영) */}
              <div className="border border-gray-200 rounded-xl p-2.5 shadow-sm bg-white">
                <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                  <h3
                    className="font-bold flex items-center gap-2"
                    style={{ color: "#249689", fontSize: "16px" }}
                  >
                    <div className="w-1 h-5 bg-teal-500 rounded-full"></div>
                    결제정보
                  </h3>
                  {cardInfos.length < 3 && (
                    <button
                      onClick={addCardInfo}
                      className="flex items-center gap-1 px-2 py-1 bg-teal-50 text-teal-600 rounded-lg text-[11px] font-bold hover:bg-teal-100 transition-colors border border-teal-100 shadow-sm pr-2.5"
                    >
                      <Plus size={13} />
                      카드 추가
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {/* 카드 결제 영역 */}
                  {cardInfos.map((card, idx) => (
                    <div key={card.id} className="p-3 border border-gray-100 rounded-xl bg-gray-50/50 relative">
                      {idx > 0 && (
                        <button
                          onClick={() => removeCardInfo(card.id)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm z-10"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                          <CreditCard size={16} className="text-teal-600" />
                          카드결제 {idx + 1}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] font-black text-gray-500">결재금액</label>
                          <input
                            type="text"
                            value={card.amount}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^\d]/g, "");
                              handleCardInfoChange(card.id, "amount", val ? formatCurrency(val).replace("원", "") : "");
                            }}
                            placeholder="0"
                            className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-right font-black text-teal-700 outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-1 pt-2 border-t border-gray-200">
                        <div>
                          <label className="block mb-0.5 text-[10px] font-bold text-gray-400">단말기번호</label>
                          <input
                            type="text"
                            value={card.terminalNo}
                            onChange={(e) => handleCardInfoChange(card.id, "terminalNo", e.target.value)}
                            className="w-full px-1 py-1 border border-gray-200 rounded-lg text-[10px] font-bold text-center outline-none focus:border-teal-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block mb-0.5 text-[10px] font-bold text-gray-400">일련번호</label>
                          <input
                            type="text"
                            value={card.serialNo}
                            onChange={(e) => handleCardInfoChange(card.id, "serialNo", e.target.value)}
                            className="w-full px-1 py-1 border border-gray-200 rounded-lg text-[10px] font-bold text-center outline-none focus:border-teal-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block mb-0.5 text-[10px] font-bold text-gray-400">카드사</label>
                          <input
                            type="text"
                            value={card.issuer}
                            onChange={(e) => handleCardInfoChange(card.id, "issuer", e.target.value)}
                            className="w-full px-1 py-1 border border-gray-200 rounded-lg text-[10px] font-bold text-center outline-none focus:border-teal-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block mb-0.5 text-[10px] font-bold text-gray-400">승인번호</label>
                          <input
                            type="text"
                            value={card.approvalNo}
                            onChange={(e) => handleCardInfoChange(card.id, "approvalNo", e.target.value)}
                            className="w-full px-1 py-1 border border-gray-200 rounded-lg text-[10px] font-bold text-center outline-none focus:border-teal-500 bg-white"
                          />
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 h-8 bg-white border border-gray-200 rounded-lg text-[11px] font-bold text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors">
                          <FileUp size={14} />
                          {card.receiptName ? card.receiptName : "영수증 첨부"}
                          <input
                            type="file"
                            accept="image/*, application/pdf"
                            className="hidden"
                            onChange={(e) => handleReceiptUpload(card.id, e)}
                          />
                        </label>
                        {card.receiptUrl && (
                          <button
                            onClick={() => {
                              setSelectedReceipt({ url: card.receiptUrl, name: card.receiptName });
                              setShowReceiptModal(true);
                            }}
                            className="px-3 h-8 bg-teal-50 text-teal-600 border border-teal-100 rounded-lg text-[11px] font-bold hover:bg-teal-100 transition-colors flex items-center justify-center transition-all shadow-sm active:scale-95"
                          >
                            보기
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* 현금 결제 영역 */}
                  <div className="p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                        <Banknote size={16} className="text-teal-600" />
                        현금결제정보
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-black text-gray-500">입금액</label>
                        <input
                          type="text"
                          value={cashInfo.amount}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^\d]/g, "");
                            setCashInfo({ ...cashInfo, amount: val ? formatCurrency(val).replace("원", "") : "" });
                          }}
                          placeholder="0"
                          className="w-28 px-2 py-1 border border-gray-300 rounded-lg text-right font-black text-teal-700 outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                      <div>
                        <label className="block mb-0.5 text-xs font-bold text-gray-500">입금기관명</label>
                        <input
                          type="text"
                          value={cashInfo.bank}
                          onChange={(e) => setCashInfo({ ...cashInfo, bank: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-teal-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block mb-0.5 text-xs font-bold text-gray-500">입금자이름</label>
                        <input
                          type="text"
                          value={cashInfo.depositor}
                          onChange={(e) => setCashInfo({ ...cashInfo, depositor: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-teal-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 결제 합계 요약 패널 */}
                  <div className="bg-gray-800 text-white p-3 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-[10px] opacity-60">
                      <span>총 주문 금액</span>
                      <span>{formatCurrency(calculateTotal())}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold">결제 합계금액</span>
                      <span className="text-lg font-black text-teal-400">
                        {formatCurrency(
                          cardInfos.reduce((sum, c) => sum + parseInt(c.amount?.toString().replace(/[^\d]/g, "") || 0), 0) +
                          parseInt(cashInfo.amount?.toString().replace(/[^\d]/g, "") || 0)
                        )}
                      </span>
                    </div>
                    {calculateTotal() !== (cardInfos.reduce((sum, c) => sum + parseInt(c.amount?.toString().replace(/[^\d]/g, "") || 0), 0) + parseInt(cashInfo.amount?.toString().replace(/[^\d]/g, "") || 0)) && (
                      <div className="pt-1.5 border-t border-white/10 flex justify-between items-center text-[11px] text-red-400 font-bold animate-pulse">
                        <span>미결제 잔액 (불일치)</span>
                        <span>{formatCurrency(calculateTotal() - (cardInfos.reduce((sum, c) => sum + parseInt(c.amount?.toString().replace(/[^\d]/g, "") || 0), 0) + parseInt(cashInfo.amount?.toString().replace(/[^\d]/g, "") || 0)))}</span>
                      </div>
                    )}
                  </div>

                  {/* 기타(Notes) 입력창 추가 */}
                  <div className="bg-white border-2 border-dashed border-gray-100 p-3 rounded-xl mt-3 shadow-sm hover:border-teal-100 transition-colors">
                    <label 
                      className="flex items-center gap-1.5 font-bold mb-2"
                      style={{ color: "#249689", fontSize: "16px" }}
                    >
                       <FileText size={17} className="text-teal-400" />
                       기타
                    </label>
                    <textarea
                       value={formData.notes}
                       onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                       placeholder="추가적인 요청사항이나 참고사항을 입력하세요."
                       className="w-full h-20 px-3 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-700 placeholder:text-gray-300 outline-none focus:ring-1 focus:ring-teal-500/20 resize-none leading-relaxed transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* 개인정보 및 제출 섹션 */}
              <div className="space-y-2">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-gray-700">
                      <input
                        type="checkbox"
                        name="privacyAgreed"
                        checked={formData.privacyAgreed}
                        onChange={handleChange}
                        className="w-4 h-4 accent-teal-600"
                      />
                      개인정보 수집 및 이용 동의{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <button
                      onClick={() => setShowPrivacyModal(true)}
                      className="text-xs text-teal-600 underline"
                    >
                      내용보기
                    </button>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-500">
                    <input
                      type="checkbox"
                      name="marketingAgreed"
                      checked={formData.marketingAgreed}
                      onChange={handleChange}
                      className="w-4 h-4 accent-teal-600"
                    />
                    (선택) 마케팅 정보 수신 동의
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-[2] py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-700/10 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    {loading ? (
                      "저장 중..."
                    ) : (
                      <>
                        <Check size={18} /> 확인 및 제출
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onNavigate?.("Dashboard")}
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
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col"
            style={{ height: "85vh" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-2xl">
              <h2 className="font-bold text-teal-700 text-base">
                개인정보 수집·이용 동의서
              </h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
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
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700"
              >
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
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-white/70 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div
              className="p-5 space-y-3 overflow-y-auto"
              style={{ maxHeight: "65vh" }}
            >
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-bold text-teal-600 mb-2">
                  구매자 정보
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">이름</span>
                  <span className="font-bold">
                    {formData.customerName || "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">연락처</span>
                  <span className="font-bold">{formData.phone || "-"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">생년월일</span>
                  <span className="font-bold">{formData.age || "-"}</span>
                </div>
                {formData.needsShipping && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">주소</span>
                    <span className="font-bold text-right max-w-[180px]">
                      {formData.address || "-"}
                    </span>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-bold text-teal-600 mb-2">
                  구매 상품
                </p>
                {orderItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-0.5">
                    <span className="text-gray-600">
                      {item.language} {item.series}
                    </span>
                    <span className="font-bold">
                      {item.quantity}세트 ·{" "}
                      {(item.price * item.quantity).toLocaleString()}원
                    </span>
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between">
                  <span className="font-bold text-gray-700">합계</span>
                  <span className="font-black text-teal-600 text-lg">
                    {calculateTotal().toLocaleString()}원
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-bold text-teal-600 mb-2">
                  결제 정보
                </p>
                {cardInfos.filter(c => parseInt(c.amount?.toString().replace(/[^0-9]/g, "") || 0) > 0).map((c, idx) => (
                  <div key={idx} className="border-b border-gray-200 pb-2 mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500 font-bold">카드 결제 {idx + 1}</span>
                      <span className="font-bold text-teal-600">
                        {formatCurrency(c.amount)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-1.5 px-2 py-1.5 bg-white rounded-lg">
                      <div className="flex justify-between">
                        <span>단말기:</span> <span className="font-bold text-gray-700">{c.terminalNo || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>일련번호:</span> <span className="font-bold text-gray-700">{c.serialNo || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>카드사:</span> <span className="font-bold text-gray-700">{c.issuer || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>승인번호:</span> <span className="font-bold text-gray-700">{c.approvalNo || "-"}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {parseInt(cashInfo.amount.replace(/[^0-9]/g, "") || 0) > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">결제수단</span>
                      <span className="font-bold">현금(입금)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">현금결제액</span>
                      <span className="font-bold text-teal-600">
                        {formatCurrency(cashInfo.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">입금기관</span>
                      <span className="font-bold">{cashInfo.bank || "-"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">입금자명</span>
                      <span className="font-bold">
                        {cashInfo.depositor || "-"}
                      </span>
                    </div>
                  </div>
                )}
                {cardInfos.some(c => parseInt(c.amount?.toString().replace(/[^0-9]/g, "") || 0) > 0) &&
                  parseInt(cashInfo.amount?.toString().replace(/[^0-9]/g, "") || 0) > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-300 flex justify-between">
                      <span className="font-bold text-gray-700">결제 합계</span>
                      <span className="font-black text-teal-700">
                        {formatCurrency(
                          cardInfos.reduce((sum, c) => sum + parseInt(c.amount?.toString().replace(/[^0-9]/g, "") || 0), 0) +
                            parseInt(cashInfo.amount.replace(/[^0-9]/g, "") || 0)
                        )}
                      </span>
                    </div>
                  )}
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                수정하기
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={loading}
                className="flex-[2] py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
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
                <h3 className="text-xl font-black text-gray-800 mb-2">
                  확인 완료
                </h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  {cardValidationResult.message}
                </p>
              </div>
            ) : (
              <div className="mb-6 flex flex-col items-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-2">
                  확인 실패
                </h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  {cardValidationResult.message}
                </p>
              </div>
            )}
            <button
              onClick={() => setShowCardValidationModal(false)}
              className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all ${cardValidationResult.success ? "bg-teal-600 text-white hover:bg-teal-700 shadow-teal-500/20" : "bg-red-500 text-white hover:bg-red-600 shadow-red-500/20"}`}
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
              <button
                onClick={() => setShowExcelPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
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
                    <tr
                      key={i}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="px-2 py-3 font-medium">
                        {row["언어"] || row["language"] || "한글"}
                      </td>
                      <td className="px-2 py-3 font-black text-teal-600">
                        {row["시리즈"] || row["series"] || "K2"}
                      </td>
                      <td className="px-2 py-3 text-center font-bold">
                        {row["수량"] || row["quantity"] || 1}
                      </td>
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
              <button
                onClick={() => setShowExcelPreview(false)}
                className="flex-1 py-3 font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={applyExcelData}
                className="flex-1 py-3 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20"
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모달: 영수증 미리보기 */}
      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[150] animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50 rounded-t-2xl">
              <div className="flex flex-col">
                <h2 className="font-bold text-gray-800 text-base">
                  영수증 미리보기
                </h2>
                <p className="text-[11px] text-gray-400 font-medium truncate max-w-[200px]">
                  {selectedReceipt.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedReceipt(null);
                }}
                className="p-1.5 bg-gray-100 text-gray-400 rounded-lg hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-200/50 p-4 flex items-center justify-center">
              {selectedReceipt.url.includes("data:application/pdf") || selectedReceipt.name.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={selectedReceipt.url}
                  className="w-full h-[60vh] rounded-lg shadow-inner bg-white"
                  title="PDF 영수증"
                />
              ) : (
                <img
                  src={selectedReceipt.url}
                  alt="영수증"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                />
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t rounded-b-2xl">
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedReceipt(null);
                }}
                className="w-full py-3.5 bg-teal-600 text-white font-black rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-700/10 active:scale-95 transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
