import React, { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, Clock, User, Search, ClipboardList } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { canAccessAllBranches } from '../constants/roles'

export default function AdminWorkDiary({ user, onNavigate }) {
  const [diaries, setDiaries] = useState([])
  const [selectedDiary, setSelectedDiary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState('date')
  const [searchName, setSearchName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    loadDiaries()
  }, [])

  const loadDiaries = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('work_diaries')
        .select('*')
        .order('created_at', { ascending: false })

      if (!canAccessAllBranches(user)) {
        query = query.eq('branch_name', user.branch)
      }

      const { data, error } = await query

      if (error) throw error

      setDiaries(data || [])
      
      if (data && data.length > 0) {
        setSelectedDiary(data[0])
      }
    } catch (err) {
      console.error('근무일지 로드 오류:', err)
      alert('근무일지를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadDiaries()
  }

  const handleReset = () => {
    setSearchName('')
    setStartDate('')
    setEndDate('')
    loadDiaries()
  }

  // 필터링된 일지 목록
  const filteredDiaries = diaries.filter(diary => {
    // 이름 검색
    const matchesName = !searchName.trim() || 
      diary.user_name?.toLowerCase().includes(searchName.toLowerCase())
    
    // 날짜 범위 검색
    let matchesDateRange = true
    if (startDate || endDate) {
      const diaryDate = new Date(diary.work_date)
      
      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        if (diaryDate < start) matchesDateRange = false
      }
      
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        if (diaryDate > end) matchesDateRange = false
      }
    }
    
    return matchesName && matchesDateRange
  })

  const sortedDiaries = [...filteredDiaries].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.created_at)
      const dateB = new Date(b.created_at)
      return dateB - dateA
    } else {
      const dateA = new Date(a.created_at)
      const dateB = new Date(b.created_at)
      return dateA - dateB
    }
  })

  // 총 근무시간 계산 함수
  const calculateTotalHours = (diaryList) => {
    return diaryList.reduce((total, diary) => {
      const hours = parseFloat(diary.work_hours) || 0
      return total + hours
    }, 0)
  }

  const totalWorkHours = calculateTotalHours(sortedDiaries)

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'short'
    }).replace('일일', '일')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-md p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => onNavigate('AdminDashboard')}
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
            <h1 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
              {canAccessAllBranches(user) ? '근무일지 관리' : '우리지점 근무일지'}
            </h1>
          </div>
          <div style={{ width: '100px' }}></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="w-80 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
            {/* 검색 및 필터 */}
            <div className="p-4 border-b bg-gray-50 space-y-3">
              {/* 이름 검색 */}
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600">
                  <User size={12} className="inline mr-1" />
                  이름 검색
                </label>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="이름 입력"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {/* 날짜 범위 */}
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600">
                  <Calendar size={12} className="inline mr-1" />
                  근무일자
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                  <span className="text-xs">~</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* 검색 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="flex-1 px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-bold"
                >
                  <Search size={14} className="inline mr-1" />
                  검색
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
                >
                  초기화
                </button>
              </div>

              {/* 정렬 */}
              <div className="pt-2 border-t">
                <label className="block text-xs font-bold mb-1 text-gray-600">정렬</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="date">최근 순</option>
                  <option value="old">오래된 순</option>
                </select>
              </div>

              {/* 검색 결과 수 */}
              <div className="text-xs text-gray-600 text-center pt-2 border-t space-y-1">
                <div>총 <strong className="text-teal-600">{sortedDiaries.length}</strong>건</div>
                <div className="font-bold text-teal-600">총 근무시간: {totalWorkHours.toFixed(1)}시간</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  로딩 중...
                </div>
              ) : sortedDiaries.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchName || startDate || endDate ? '검색 결과가 없습니다.' : '근무일지가 없습니다.'}
                </div>
              ) : (
                sortedDiaries.map((diary) => (
                  <div
                    key={diary.id}
                    onClick={() => setSelectedDiary(diary)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedDiary?.id === diary.id ? 'bg-teal-50 border-l-4 border-teal-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <User size={16} style={{ color: '#249689' }} />
                      <span className="font-bold" style={{ fontSize: '15px' }}>
                        {diary.branch_name || '-'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {diary.user_name || '이름 없음'}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={12} />
                      {diary.work_date || '-'}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Clock size={12} />
                      {diary.start_time} - {diary.end_time} ({diary.work_hours}h)
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden">
            {selectedDiary ? (
              <div className="h-full overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <ClipboardList size={28} style={{ color: '#249689' }} />
                      <h2 className="text-2xl font-bold" style={{ color: '#249689' }}>
                        근무일지 상세
                      </h2>
                    </div>
                    <div className="text-lg font-bold" style={{ color: '#249689' }}>
                      (총근무시간 {totalWorkHours.toFixed(1)}시간)
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">지점명</label>
                        <p className="font-medium">{selectedDiary.branch_name || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">작성자</label>
                        <p className="font-medium">{selectedDiary.user_name || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">근무일자</label>
                        <p className="font-medium">{formatDate(selectedDiary.work_date)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">근무시간</label>
                        <p className="font-medium">
                          {selectedDiary.start_time} - {selectedDiary.end_time}
                          <span className="ml-2 text-teal-600">({selectedDiary.work_hours}시간)</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {(selectedDiary.daily_check_clean || selectedDiary.daily_check_training || selectedDiary.daily_check_list) && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-3" style={{ fontSize: '17px' }}>
                        일일 확인목록
                      </h3>
                      <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                        {selectedDiary.daily_check_clean && (
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span>매장 청결점검</span>
                          </div>
                        )}
                        {selectedDiary.daily_check_training && (
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span>직원 업무교육</span>
                          </div>
                        )}
                        {selectedDiary.daily_check_list && (
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span>직원 체크리스트 점검</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedDiary.out_content && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-3" style={{ fontSize: '17px' }}>
                        외근 내용
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="whitespace-pre-wrap">
                          {selectedDiary.out_content}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedDiary.exemplary_content && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-3" style={{ fontSize: '17px' }}>
                        주인형 모집내용
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="whitespace-pre-wrap">
                          {selectedDiary.exemplary_content}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedDiary.memorable_customer && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-3" style={{ fontSize: '17px' }}>
                        고객 상담내용
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="whitespace-pre-wrap">
                          {selectedDiary.memorable_customer}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedDiary.suggestions && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-3" style={{ fontSize: '17px' }}>
                        특이사항
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="whitespace-pre-wrap">
                          {selectedDiary.suggestions}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-500 text-right mt-8">
                    작성일시: {new Date(selectedDiary.created_at).toLocaleString('ko-KR')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                좌측 목록에서 근무일지를 선택해주세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}