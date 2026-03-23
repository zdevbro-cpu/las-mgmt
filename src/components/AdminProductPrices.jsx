import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Save, Calendar, History, Info, Table } from 'lucide-react'

// 천단위 콤마 포맷팅 함수
const formatNumber = (val) => {
  if (!val && val !== 0) return ''
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 콤마 제거 함수
const parseNumber = (val) => {
  return val.replace(/[^\d]/g, '')
}

// 컴포넌트 외부로 이동하여 리렌더링 시 포커스 잃는 문제 해결
const PriceTable = ({ seriesList, title, color, gridData, onPriceChange }) => (
  <div className="flex-1 min-w-[300px] border border-gray-300 rounded overflow-hidden shadow-sm bg-white">
    <div className={`px-3 py-1.5 text-xs font-bold text-white flex items-center gap-2 ${color}`}>
      <Table size={14} />
      {title} 시리즈
    </div>
    <table className="w-full border-collapse text-[12px]">
      <thead>
        <tr className="bg-gray-100 border-b border-gray-300">
          <th className="px-2 py-1 border-r border-gray-300 text-center w-16">시리즈</th>
          <th className="px-2 py-1 border-r border-gray-300 text-center">한글 (원)</th>
          <th className="px-2 py-1 text-center">영문 (원)</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {seriesList.map(s => (
          <tr key={s} className="hover:bg-gray-50">
            <td className="px-2 py-1 border-r border-gray-200 text-center font-bold bg-gray-50/50">{s}</td>
            <td className="px-1 py-1 border-r border-gray-200">
              <input
                type="text"
                value={formatNumber(gridData[s]?.['한글'])}
                onChange={(e) => onPriceChange(s, '한글', parseNumber(e.target.value))}
                className="w-full h-7 px-2 text-right border-none outline-none focus:ring-1 focus:ring-teal-500 font-bold bg-transparent"
                placeholder="0"
              />
            </td>
            <td className="px-1 py-1">
              <input
                type="text"
                value={formatNumber(gridData[s]?.['영문'])}
                onChange={(e) => onPriceChange(s, '영문', parseNumber(e.target.value))}
                className="w-full h-7 px-2 text-right border-none outline-none focus:ring-1 focus:ring-blue-500 font-bold bg-transparent"
                placeholder="0"
              />
            </td>
          </tr>
        ))}
        {seriesList.length < 6 && Array.from({ length: 6 - seriesList.length }).map((_, i) => (
          <tr key={`empty-${i}`} className="h-9 bg-gray-50/20">
            <td className="border-r border-gray-200"></td>
            <td className="border-r border-gray-200"></td>
            <td></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export default function AdminProductPrices({ user, onNavigate }) {
  const [gridData, setGridData] = useState({})
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [history, setHistory] = useState([])

  const kSeries = Array.from({ length: 6 }, (_, i) => `K${i + 2}`)
  const gSeries = Array.from({ length: 6 }, (_, i) => `G${i + 1}`)
  const sSeries = Array.from({ length: 4 }, (_, i) => `S${i + 2}`)
  
  const allSeries = [...kSeries, ...gSeries, ...sSeries]
  const languages = ['한글', '영문']

  useEffect(() => {
    fetchCurrentPrices()
  }, [])

  const fetchCurrentPrices = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('product_prices')
        .select('*')
        .is('end_date', null)
      
      if (error) throw error

      const initialGrid = {}
      allSeries.forEach(s => {
        initialGrid[s] = { '한글': '', '영문': '' }
      })

      if (data && data.length > 0) {
        data.forEach(item => {
          if (initialGrid[item.series]) {
            initialGrid[item.series][item.language] = item.price
          }
        })
      }
      setGridData(initialGrid)

      const { data: histData } = await supabase
        .from('product_prices')
        .select('*')
        .not('end_date', 'is', null)
        .order('end_date', { ascending: false })
        .limit(10)
      
      setHistory(histData || [])

    } catch (err) {
      console.error('가격 조회 오류:', err)
      const initialGrid = {}
      allSeries.forEach(s => {
        initialGrid[s] = { '한글': '', '영문': '' }
      })
      setGridData(initialGrid)
    } finally {
      setLoading(false)
    }
  }

  const handlePriceChange = useCallback((series, lang, value) => {
    setGridData(prev => ({
      ...prev,
      [series]: {
        ...prev[series],
        [lang]: value
      }
    }))
  }, [])

  const handleSave = async () => {
    if (!startDate) {
      alert('적용 기준일을 선택해주세요.')
      return
    }

    if (!window.confirm(`${startDate} 기준으로 단가를 저장하시겠습니까?`)) return

    setLoading(true)
    try {
      const { data: activePrices, error: fetchError } = await supabase
        .from('product_prices')
        .select('*')
        .is('end_date', null)
      
      if (fetchError) throw fetchError

      const inserts = []
      const updates = []

      for (const series of allSeries) {
        for (const lang of languages) {
          const newPrice = gridData[series][lang]
          if (newPrice === '' || newPrice === null) continue

          const numericPrice = parseInt(newPrice)
          const existing = activePrices?.find(p => p.series === series && p.language === lang)
          
          if (!existing || existing.price !== numericPrice) {
            if (existing) updates.push(existing.id)
            inserts.push({
              series,
              language: lang,
              price: numericPrice,
              start_date: startDate,
              end_date: null
            })
          }
        }
      }

      if (inserts.length === 0) {
        alert('변경사항이 없습니다.')
        setLoading(false)
        return
      }

      // 3. 기존 가격 종료 처리 (end_date 업데이트)
      if (updates.length > 0) {
        const { error: updateError } = await supabase
          .from('product_prices')
          .update({ end_date: startDate })
          .in('id', updates)
        
        if (updateError) {
          console.error('Update Error:', updateError)
          throw new Error(`기존 가격 종료 처리 중 오류: ${updateError.message}`)
        }
      }

      // 4. 새 가격 일괄 삽입
      if (inserts.length > 0) {
        const { error: insertError } = await supabase
          .from('product_prices')
          .insert(inserts)
        
        if (insertError) {
          console.error('Insert Error:', insertError)
          throw new Error(`새 가격 등록 중 오류: ${insertError.message}`)
        }
      }

      alert('단가가 적용되었습니다.')
      fetchCurrentPrices()
    } catch (err) {
      console.error('저장 오류:', err)
      alert('오류: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <div className="bg-white border-b border-gray-300 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate(user?.user_type === '시스템관리자' ? 'SystemAdminDashboard' : 'AdminDashboard')}
              className="flex items-center gap-1 text-gray-500 hover:text-teal-600 font-bold transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">나가기</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-lg font-black text-gray-900">상품 단가 마스터 설정</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded border border-gray-300">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-xs font-bold text-gray-500">적용 기준일:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-xs"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 h-9 bg-teal-600 text-white font-bold rounded shadow-sm hover:bg-teal-700 active:bg-teal-800 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Save size={16} />
              데이터 저장
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        <div className="bg-amber-50 border border-amber-200 p-2.5 rounded text-[11px] text-amber-700 font-medium flex items-center gap-2">
          <Info size={14} />
          엑셀 형식 단가표: 모든 시리즈의 단가를 한 화면에서 즉시 수정할 수 있습니다. 수정한 후 우측 상단의 [데이터 저장] 버튼을 클릭하세요.
        </div>

        <div className="flex flex-wrap gap-4 items-start">
          <PriceTable seriesList={kSeries} title="K" color="bg-teal-600" gridData={gridData} onPriceChange={handlePriceChange} />
          <PriceTable seriesList={gSeries} title="G" color="bg-blue-600" gridData={gridData} onPriceChange={handlePriceChange} />
          <PriceTable seriesList={sSeries} title="S" color="bg-indigo-600" gridData={gridData} onPriceChange={handlePriceChange} />
        </div>

        <div className="mt-8 border-t border-gray-300 pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold flex items-center gap-2 text-gray-600">
              <History size={16} />
              최근 변경 이력 로그 (최근 10건)
            </h3>
          </div>
          <div className="bg-white border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-bold">
                  <th className="px-4 py-2 border-r border-gray-200">항목</th>
                  <th className="px-4 py-2 border-r border-gray-200 text-right">단가</th>
                  <th className="px-4 py-2">적용 기간</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-1.5 border-r border-gray-200">
                      <span className={`px-1.5 rounded-sm font-bold mr-2 text-[10px] text-white ${h.language === '한글' ? 'bg-teal-500' : 'bg-blue-500'}`}>{h.language}</span>
                      <span className="font-bold">{h.series}</span>
                    </td>
                    <td className="px-4 py-1.5 border-r border-gray-200 text-right font-black text-gray-600">{h.price.toLocaleString()}원</td>
                    <td className="px-4 py-1.5 text-gray-400">{h.start_date} ~ {h.end_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[100] flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-xl flex items-center gap-4 border border-gray-300">
            <div className="w-8 h-8 border-[3px] border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-gray-800">DB 통신 중...</p>
          </div>
        </div>
      )}
    </div>
  )
}
