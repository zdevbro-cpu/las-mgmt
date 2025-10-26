import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminEventDashboard({ user, onBack }) {
  const [stats, setStats] = useState({
    total: 0,
    thisWeek: 0,
    male: 0,
    female: 0
  })
  const [ageDistribution, setAgeDistribution] = useState([])
  const [topReferrers, setTopReferrers] = useState([])
  const [topBranches, setTopBranches] = useState([])
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  
  // 이벤트 관련 state
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState('')

  // 검색/필터 상태
  const [filters, setFilters] = useState({
    branch: '',
    referrer: '',
    startDate: '',
    endDate: ''
  })

  // 지점 목록
  const [branches, setBranches] = useState([])
  // 추천인 목록
  const [referrers, setReferrers] = useState([])

  useEffect(() => {
    loadEvents()
    // loadData와 loadFilterOptions는 selectedEvent useEffect에서 처리
  }, [])
  
  useEffect(() => {
    loadData()
    loadFilterOptions()
  }, [selectedEvent])
  
  // 천단위 콤마 포맷 함수
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  const loadEvents = async () => {

    try {
      const { data, error } = await supabase
        .from('events')
        .select('name')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setEvents(data || [])
      
      // 초기값은 빈 문자열(전체 이벤트)로 유지
      // 사용자가 명시적으로 선택하도록 함
    } catch (error) {
      console.error('이벤트 목록 로드 실패:', error)
    }
  }

  const loadFilterOptions = async () => {
    try {
      // 지점 목록 로드
      const { data: branchData } = await supabase
        .from('users')
        .select('branch')
        .not('branch', 'is', null)
        .order('branch')

      const uniqueBranches = [...new Set(branchData?.map(b => b.branch) || [])]
      setBranches(uniqueBranches)

      // 추천인 목록 로드 - users 테이블에서 가져오기
      const { data: usersData } = await supabase
        .from('users')
        .select('name, referral_code')
        .not('referral_code', 'is', null)
        .order('name')

      // event_participants에 실제 사용된 추천인만 필터링
      let participantsQuery = supabase
        .from('event_participants')
        .select('referrer_code, event_name')
        .not('referrer_code', 'is', null)
      
      // 이벤트 필터 적용
      if (selectedEvent) {
        participantsQuery = participantsQuery.eq('event_name', selectedEvent)
      }
      
      const { data: participantsData } = await participantsQuery

      const usedReferrerCodes = new Set(participantsData?.map(p => p.referrer_code) || [])
      
      const uniqueReferrers = usersData?.filter(u => usedReferrerCodes.has(u.referral_code))
        .map(u => ({
          referrer_name: u.name,
          referrer_code: u.referral_code
        })) || []

      setReferrers(uniqueReferrers)
    } catch (error) {
      console.error('필터 옵션 로드 실패:', error)
    }
  }

  const loadData = async () => {
    try {
      console.log('🚀 데이터 로드 시작...')
      setLoading(true)

      // 통계 데이터 로드
      console.log('📊 통계 데이터 로드 중...')
      let statsQuery = supabase
        .from('event_participants')
        .select('child_gender, child_age, event_name, created_at')
      
      // 이벤트 필터 적용
      if (selectedEvent) {
        console.log('✅ 이벤트 필터 적용:', selectedEvent)
        statsQuery = statsQuery.eq('event_name', selectedEvent)
      }
      
      const { data: allParticipants, error: statsError } = await statsQuery

      if (statsError) throw statsError

      const totalCount = allParticipants?.length || 0
      const maleCount = allParticipants?.filter(p => p.child_gender === '남').length || 0
      const femaleCount = allParticipants?.filter(p => p.child_gender === '여').length || 0

      // 이번주 참가자 계산 (월요일 기준)
      const now = new Date()
      const dayOfWeek = now.getDay() // 0(일) ~ 6(토)
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 월요일까지의 차이
      const thisMonday = new Date(now)
      thisMonday.setDate(now.getDate() - diff)
      thisMonday.setHours(0, 0, 0, 0)
      
      const thisWeekCount = allParticipants?.filter(p => {
        const createdAt = new Date(p.created_at)
        return createdAt >= thisMonday
      }).length || 0

      console.log('✅ 통계:', { total: totalCount, thisWeek: thisWeekCount, male: maleCount, female: femaleCount })

      setStats({
        total: totalCount,
        thisWeek: thisWeekCount,
        male: maleCount,
        female: femaleCount
      })

      // 연령 분포 계산
      const ageGroups = {}
      allParticipants?.forEach(p => {
        if (p.child_age) {
          const age = parseInt(p.child_age)
          if (age >= 3 && age <= 7) {
            const ageKey = `${age}세`
            if (!ageGroups[ageKey]) {
              ageGroups[ageKey] = { age: age, male: 0, female: 0, total: 0 }
            }
            ageGroups[ageKey].total++
            if (p.child_gender === '남') {
              ageGroups[ageKey].male++
            } else if (p.child_gender === '여') {
              ageGroups[ageKey].female++
            }
          }
        }
      })

      const ageDistArray = Object.keys(ageGroups)
        .map(key => ({ name: key, ...ageGroups[key] }))
        .sort((a, b) => a.age - b.age)

      console.log('✅ 연령 분포:', ageDistArray)
      setAgeDistribution(ageDistArray)

      // 추천인별 통계
      console.log('🏆 추천인 통계 로드 중...')
      let referrerStatsQuery = supabase
        .from('event_participants')
        .select('referrer_name, referrer_code')
        .not('referrer_code', 'is', null)
      
      // 이벤트 필터 적용
      if (selectedEvent) {
        referrerStatsQuery = referrerStatsQuery.eq('event_name', selectedEvent)
      }
      
      const { data: referrerStats, error: referrerError } = await referrerStatsQuery

      if (referrerError) {
        console.error('❌ 추천인 통계 에러:', referrerError)
      }

      // 추천인 코드로 users 정보 가져오기
      const referrerCodes = [...new Set(referrerStats?.map(p => p.referrer_code).filter(Boolean))]
      let referrerUsersData = []
      
      if (referrerCodes.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('referral_code, name, branch')
          .in('referral_code', referrerCodes)
        
        referrerUsersData = users || []
      }

      const referrerMap = {}
      referrerStats?.forEach(p => {
        const key = p.referrer_code
        const user = referrerUsersData.find(u => u.referral_code === p.referrer_code)
        
        if (!referrerMap[key]) {
          referrerMap[key] = {
            name: p.referrer_name || user?.name || '-',
            code: p.referrer_code,
            branch: user?.branch || '-',
            count: 0
          }
        }
        referrerMap[key].count++
      })

      const topReferrersList = Object.values(referrerMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 12)

      console.log('✅ Top 추천인:', topReferrersList)
      setTopReferrers(topReferrersList)

      // 추천지점별 통계 계산
      console.log('🏢 추천지점 통계 계산 중...')
      const branchMap = {}
      referrerStats?.forEach(p => {
        const user = referrerUsersData.find(u => u.referral_code === p.referrer_code)
        const branch = user?.branch || '-'
        
        if (branch !== '-') {
          if (!branchMap[branch]) {
            branchMap[branch] = {
              branch: branch,
              count: 0
            }
          }
          branchMap[branch].count++
        }
      })

      const topBranchesList = Object.values(branchMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 12)

      console.log('✅ Top 지점:', topBranchesList)
      setTopBranches(topBranchesList)

      // 참가자 목록 로드
      console.log('👥 참가자 목록 로드 시작...')
      await loadParticipants()
      
      console.log('✅ 모든 데이터 로드 완료!')
    } catch (error) {
      console.error('❌ 데이터 로드 실패:', error)
      alert('데이터를 불러오는데 실패했습니다: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadParticipants = async (customFilters = null) => {
    try {
      // customFilters가 제공되면 사용, 없으면 현재 state의 filters 사용
      const activeFilters = customFilters !== null ? customFilters : filters
      
      console.log('🔍 참가자 목록 로드 시작...')
      console.log('📋 현재 필터:', activeFilters)
      
      // 1. 참가자 데이터 먼저 가져오기
      let query = supabase
        .from('event_participants')
        .select('*')
        .order('created_at', { ascending: false })

      // 이벤트 필터 적용
      if (selectedEvent) {
        console.log('✅ 이벤트 필터 적용:', selectedEvent)
        query = query.eq('event_name', selectedEvent)
      }

      // 필터 적용
      if (activeFilters.referrer) {
        console.log('✅ 추천인 필터 적용:', activeFilters.referrer)
        query = query.eq('referrer_code', activeFilters.referrer)
      }
      if (activeFilters.startDate) {
        console.log('✅ 시작일 필터 적용:', activeFilters.startDate)
        // 시작일은 해당 날짜의 00:00:00부터
        query = query.gte('created_at', `${activeFilters.startDate}T00:00:00`)
      }
      if (activeFilters.endDate) {
        console.log('✅ 종료일 필터 적용:', activeFilters.endDate)
        // 종료일은 해당 날짜의 23:59:59까지
        query = query.lte('created_at', `${activeFilters.endDate}T23:59:59`)
      }

      const { data: participantsData, error } = await query

      if (error) {
        console.error('❌ 쿼리 에러:', error)
        throw error
      }

      console.log('✅ 참가자 기본 데이터 로드:', participantsData?.length, '명')

      // 2. 추천인 코드 목록 추출
      const referrerCodes = [...new Set(participantsData?.map(p => p.referrer_code).filter(Boolean))]
      
      // 3. users 테이블에서 추천인 정보 가져오기
      let usersData = []
      if (referrerCodes.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('referral_code, name, branch')
          .in('referral_code', referrerCodes)

        if (usersError) {
          console.error('❌ Users 조회 에러:', usersError)
        } else {
          usersData = users || []
          console.log('✅ 추천인 정보 로드:', usersData.length, '명')
        }
      }

      // 4. 데이터 매칭
      const enrichedData = participantsData?.map(participant => {
        const user = usersData.find(u => u.referral_code === participant.referrer_code)
        return {
          ...participant,
          users: user ? { name: user.name, branch: user.branch } : null
        }
      }) || []

      // 5. 지점 필터 적용 (users 정보를 가져온 후)
      let filteredData = enrichedData
      if (activeFilters.branch) {
        console.log('✅ 지점 필터 적용:', activeFilters.branch)
        filteredData = enrichedData.filter(p => p.users?.branch === activeFilters.branch)
      }

      console.log('✅ 최종 참가자 데이터:', filteredData.length, '명')
      console.log('📦 데이터:', filteredData)
      setParticipants(filteredData)
    } catch (error) {
      console.error('❌ 참가자 목록 로드 실패:', error)
      alert('참가자 목록을 불러오는데 실패했습니다: ' + error.message)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleApplyFilters = () => {
    loadParticipants()
  }

  const handleResetFilters = () => {
    const emptyFilters = {
      branch: '',
      referrer: '',
      startDate: '',
      endDate: ''
    }
    setFilters(emptyFilters)
    // 빈 필터를 직접 전달하여 즉시 검색
    loadParticipants(emptyFilters)
  }

  const handleDeleteParticipant = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('삭제되었습니다.')
      loadData()
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  const handleDownloadExcel = () => {
    if (participants.length === 0) {
      alert('다운로드할 데이터가 없습니다.')
      return
    }

    const headers = [
      '신청일시',
      '학부모명',
      '연락처',
      '자녀성별',
      '자녀나이',
      '추천인',
      '추천인코드',
      '지점',
      '문의사항'
    ]

    const rows = participants.map(p => [
      new Date(p.created_at).toLocaleString('ko-KR'),
      p.parent_name || '',
      p.phone || '',
      p.child_gender || '',
      p.child_age || '',
      p.users?.name || p.referrer_name || '',
      p.referrer_code || '',
      p.users?.branch || '',
      p.inquiry || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    const today = new Date()
    const dateStr = today.getFullYear() + 
                    String(today.getMonth() + 1).padStart(2, '0') + 
                    String(today.getDate()).padStart(2, '0')
    
    link.setAttribute('href', url)
    link.setAttribute('download', `이벤트 참가자목록_${dateStr}.xls`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onBack}
              className="flex items-center gap-2 font-bold hover:opacity-70 transition-opacity"
              style={{ color: '#249689', fontSize: '15px' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              나가기
            </button>
            <div className="flex items-center gap-1.5">
              <img 
                src="/images/logo.png" 
                alt="LAS Logo" 
                className="w-10 h-10 object-contain"
              />
              <h2 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
                이벤트 대시보드
              </h2>
            </div>
            <div>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="px-4 py-2 border-2 rounded-lg font-medium"
                style={{ 
                  borderColor: '#249689', 
                  color: '#249689',
                  borderRadius: '10px',
                  fontSize: '15px',
                  minWidth: '200px'
                }}
              >
                <option value="">전체 이벤트</option>
                {events.map((event) => (
                  <option key={event.name} value={event.name}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="mb-6 p-3 rounded-lg" style={{ backgroundColor: '#f0f9ff', border: '2px solid #3b82f6' }}>
            <p className="text-sm" style={{ color: '#1e40af' }}>
              ℹ️ 이벤트 참가자 정보를 조회하고 관리합니다
            </p>
          </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-2">전체 참가자</p>
                <p className="text-4xl font-bold">{stats.total}명</p>
              </div>
              <div className="text-5xl">👥</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-2">이번주 참가자</p>
                <p className="text-4xl font-bold">{stats.thisWeek}명</p>
              </div>
              <div className="text-5xl">📅</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sky-100 text-sm mb-2">남학생</p>
                <p className="text-4xl font-bold">{stats.male}명</p>
              </div>
              <div className="text-5xl">👦</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm mb-2">여학생</p>
                <p className="text-4xl font-bold">{stats.female}명</p>
              </div>
              <div className="text-5xl">👧</div>
            </div>
          </div>
        </div>

        {/* 차트 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 연령 분포 차트 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#249689' }}>📊 연령 분포</h3>
            <div className="space-y-4">
              {ageDistribution.map((age, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{age.name}</span>
                    <span className="text-sm text-gray-600">
                      남 {age.male}명 / 여 {age.female}명 (총 {age.total}명)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden flex">
                    <div 
                      className="bg-sky-500 flex items-center justify-center text-white text-xs font-bold"
                      style={{ width: `${(age.male / age.total) * 100}%` }}
                    >
                      {age.male > 0 && `${age.male}`}
                    </div>
                    <div 
                      className="bg-pink-500 flex items-center justify-center text-white text-xs font-bold"
                      style={{ width: `${(age.female / age.total) * 100}%` }}
                    >
                      {age.female > 0 && `${age.female}`}
                    </div>
                  </div>
                </div>
              ))}
              {ageDistribution.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>연령 데이터가 없습니다</p>
                </div>
              )}
            </div>
          </div>

          {/* 성별 비율 파이차트 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#249689' }}>🎯 성별 비율</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-64 h-64">
                {/* 파이차트 SVG */}
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {stats.total > 0 && (
                    <>
                      {/* 남학생 섹션 */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#0ea5e9"
                        strokeWidth="20"
                        strokeDasharray={`${(stats.male / stats.total) * 251.2} 251.2`}
                      />
                      {/* 여학생 섹션 */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#ec4899"
                        strokeWidth="20"
                        strokeDasharray={`${(stats.female / stats.total) * 251.2} 251.2`}
                        strokeDashoffset={`-${(stats.male / stats.total) * 251.2}`}
                      />
                    </>
                  )}
                </svg>
                {/* 중앙 텍스트 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold" style={{ color: '#249689' }}>{stats.total}</p>
                    <p className="text-sm text-gray-600">총 참가자</p>
                  </div>
                </div>
              </div>
            </div>
            {/* 범례 */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between p-3 bg-sky-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-sky-500 rounded"></div>
                  <span className="font-semibold">남학생</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sky-600">{stats.male}명</p>
                  <p className="text-xs text-gray-600">
                    {stats.total > 0 ? ((stats.male / stats.total) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-pink-500 rounded"></div>
                  <span className="font-semibold">여학생</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-pink-600">{stats.female}명</p>
                  <p className="text-xs text-gray-600">
                    {stats.total > 0 ? ((stats.female / stats.total) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 추천지점 Top 12 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-6" style={{ color: '#249689' }}>🏢 추천지점 Top 12</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {topBranches.map((branch, idx) => (
              <div 
                key={idx} 
                className="relative bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 px-3 py-2 border-2 hover:scale-105"
                style={{ 
                  borderColor: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#249689',
                  backgroundColor: idx < 3 ? '#fffbf0' : 'white'
                }}
              >
                {/* 순위 배지 */}
                <div 
                  className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold shadow-lg text-xs"
                  style={{ 
                    backgroundColor: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#249689'
                  }}
                >
                  {idx + 1}
                </div>

                <div className="flex items-center justify-between">
                  {/* 왼쪽: 아이콘 + 정보 */}
                  <div className="flex items-center gap-2 flex-1">
                    <span style={{ fontSize: '20px' }}>
                      {idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏪'}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{ color: '#1f2937' }}>
                        {branch.branch}
                      </p>
                    </div>
                  </div>

                  {/* 오른쪽: 참가자 수 */}
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: '#249689' }}>
                      {branch.count}
                    </p>
                    <p className="text-xs text-gray-500">명</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 데이터 없을 때 */}
          {topBranches.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">🏢</p>
              <p>지점 데이터가 없습니다</p>
            </div>
          )}
        </div>

        {/* Top 추천인 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-6" style={{ color: '#249689' }}>🏆 추천인 Top 12</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {topReferrers.map((ref, idx) => (
              <div 
                key={idx} 
                className="relative bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 px-3 py-2 border-2 hover:scale-105"
                style={{ 
                  borderColor: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#249689',
                  backgroundColor: idx < 3 ? '#fffbf0' : 'white'
                }}
              >
                {/* 순위 배지 */}
                <div 
                  className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold shadow-lg text-xs"
                  style={{ 
                    backgroundColor: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#249689'
                  }}
                >
                  {idx + 1}
                </div>

                <div className="flex items-center justify-between">
                  {/* 왼쪽: 아이콘 + 정보 */}
                  <div className="flex items-center gap-2 flex-1">
                    <span style={{ fontSize: '20px' }}>
                      {idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '⭐'}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{ color: '#1f2937' }}>
                        {ref.name}({ref.code})
                      </p>
                      <p className="text-xs text-gray-500">
                        📍 {ref.branch}
                      </p>
                    </div>
                  </div>

                  {/* 오른쪽: 참가자 수 */}
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: '#249689' }}>
                      {ref.count}
                    </p>
                    <p className="text-xs text-gray-500">명</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 데이터 없을 때 */}
          {topReferrers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">🏆</p>
              <p>추천인 데이터가 없습니다</p>
            </div>
          )}
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold" style={{ color: '#249689' }}>🔍 검색 필터</h3>
            <button
              onClick={handleDownloadExcel}
              className="px-6 py-2 text-white rounded-lg hover:opacity-90 font-bold"
              style={{ backgroundColor: '#5B9BD5', borderRadius: '10px', fontSize: '15px' }}
            >
              엑셀다운로드({formatNumber(participants.length)}명)
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">추천인지점</label>
              <select
                value={filters.branch}
                onChange={(e) => handleFilterChange('branch', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">전체</option>
                {branches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">추천인</label>
              <select
                value={filters.referrer}
                onChange={(e) => handleFilterChange('referrer', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">전체</option>
                {referrers.map(r => (
                  <option key={r.referrer_code} value={r.referrer_code}>
                    {r.referrer_name}({r.referrer_code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">시작일</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">종료일</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <button
                onClick={handleApplyFilters}
                className="w-full px-6 py-2 text-white rounded-lg hover:opacity-90 font-bold"
                style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
              >
                검색
              </button>
            </div>
            <div>
              <button
                onClick={handleResetFilters}
                className="w-full px-6 py-2 border-2 rounded-lg hover:bg-gray-50 font-bold"
                style={{ borderColor: '#249689', color: '#249689', borderRadius: '10px', fontSize: '15px' }}
              >
                초기화
              </button>
            </div>
          </div>
        </div>

        {/* 참가자 목록 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold" style={{ color: '#249689' }}>👥 참가자 목록</h3>
            <div className="text-lg font-bold" style={{ color: '#249689' }}>
              검색결과: {formatNumber(participants.length)}명
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2" style={{ borderColor: '#249689' }}>
                  <th className="px-3 py-2 text-left">신청일시</th>
                  <th className="px-3 py-2 text-left">학부모명</th>
                  <th className="px-3 py-2 text-left">연락처</th>
                  <th className="px-3 py-2 text-left">자녀성별</th>
                  <th className="px-3 py-2 text-left">자녀나이</th>
                  <th className="px-3 py-2 text-left">추천인</th>
                  <th className="px-3 py-2 text-left">추천인코드</th>
                  <th className="px-3 py-2 text-left">지점</th>
                  <th className="px-3 py-2 text-center">삭제</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm">{new Date(p.created_at).toLocaleString('ko-KR')}</td>
                    <td className="px-3 py-3">{p.parent_name}</td>
                    <td className="px-3 py-3">{p.phone}</td>
                    <td className="px-3 py-3">{p.child_gender}</td>
                    <td className="px-3 py-3">{p.child_age}세</td>
                    <td className="px-3 py-3">{p.users?.name || p.referrer_name || '-'}</td>
                    <td className="px-3 py-3">{p.referrer_code || '-'}</td>
                    <td className="px-3 py-3">{p.users?.branch || '-'}</td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => handleDeleteParticipant(p.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {participants.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              참가자가 없습니다
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}