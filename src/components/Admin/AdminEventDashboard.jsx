import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, RotateCcw, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Mail, X } from 'lucide-react'

export default function AdminEventDashboard({ user, onBack, viewMode, from }) {
  // viewMode가 명시되지 않은 경우 from 경로를 보고 자동 결정
  let determinedViewMode = viewMode
  if (!determinedViewMode) {
    // from 경로 기반 판단
    if (from === '/system-admin' || from === 'SystemAdminDashboard') {
      determinedViewMode = 'system'
    } else if (from === '/admin' || from === 'AdminDashboard') {
      determinedViewMode = 'admin'
    } else if (from === '/dashboard' || from === 'Dashboard') {
      determinedViewMode = 'user'
    } else if (user?.user_type === '시스템관리자' || user?.role === 'system_admin' || user?.role === 'SystemAdmin') {
      determinedViewMode = 'system'
    } else if (user?.role === 'admin' || user?.role === 'manager' || 
               user?.role === '점장' || user?.role === '지점관리자') {
      determinedViewMode = 'admin'
    } else {
      determinedViewMode = 'user'
    }
  }
  
  console.log('🎯 ViewMode 결정:', determinedViewMode, '| User Role:', user?.role, '| User Type:', user?.user_type, '| From:', from)
  
  // viewMode: 'user' = 일반 유저 (본인 데이터만), 'admin' = 매장관리자 (전체 데이터), 'system' = 시스템관리자 (전체 데이터)
  const showFullData = determinedViewMode === 'admin' || determinedViewMode === 'system'
  const showTopRankings = determinedViewMode === 'admin' || determinedViewMode === 'system'

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

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(30)

  // 발송 관련 state 추가
  const [selectedParticipants, setSelectedParticipants] = useState([])
  const [showSendModal, setShowSendModal] = useState(false)
  const [sending, setSending] = useState(false)

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

  // 전화번호 포맷 함수
  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.toString().replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    return phone;
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
        .select('child_gender, child_age, event_name, created_at, start_date, current_day, last_sent_date')
      
      
      // 권한별 필터링
      if (determinedViewMode === 'user' && user?.referral_code) {
        // 일반 유저: 본인이 추천한 데이터만
        console.log('✅ [일반 유저] 필터 적용 - 추천코드:', user.referral_code)
        statsQuery = statsQuery.eq('referrer_code', user.referral_code)
      } else if (determinedViewMode === 'admin' && user?.branch) {
        // 점장/지점관리자: 본인 지점의 모든 직원이 추천한 데이터
        console.log('✅ [점장/지점관리자] 필터 적용 - 지점:', user.branch)
        
        // 1. 해당 지점의 모든 referral_code 가져오기
        const { data: branchUsers } = await supabase
          .from('users')
          .select('referral_code')
          .eq('branch', user.branch)
          .not('referral_code', 'is', null)
        
        const branchReferralCodes = branchUsers?.map(u => u.referral_code) || []
        console.log('✅ 지점 직원 수:', branchReferralCodes.length, '명')
        
        if (branchReferralCodes.length > 0) {
          statsQuery = statsQuery.in('referrer_code', branchReferralCodes)
        } else {
          // 지점에 referral_code를 가진 직원이 없으면 빈 결과
          statsQuery = statsQuery.eq('referrer_code', 'NONE')
        }
      } else if (determinedViewMode === 'system') {
        // 시스템관리자: 모든 데이터 (필터 없음)
        console.log('✅ [시스템관리자] 필터 없음 - 전체 데이터')
      }
      // 이벤트 필터 적용
      if (selectedEvent) {
        console.log('✅ 이벤트 필터 적용:', selectedEvent)
        statsQuery = statsQuery.eq('event_name', selectedEvent)
      }
      
      const { data: allParticipants, error: statsError } = await statsQuery

      if (statsError) throw statsError

      console.log('📊 통계용 데이터 로드:', allParticipants?.length, '명')

      // 일주일 전 날짜 계산
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      // 전체 통계 계산
      const totalCount = allParticipants?.length || 0
      const thisWeekCount = allParticipants?.filter(p => 
        new Date(p.created_at) >= oneWeekAgo
      ).length || 0
      const maleCount = allParticipants?.filter(p => p.child_gender === '남').length || 0
      const femaleCount = allParticipants?.filter(p => p.child_gender === '여').length || 0

      setStats({
        total: totalCount,
        thisWeek: thisWeekCount,
        male: maleCount,
        female: femaleCount
      })

      console.log('📊 통계 계산 완료:', { totalCount, thisWeekCount, maleCount, femaleCount })

      // 나이별 분포 계산
      const ageGroups = {}
      allParticipants?.forEach(p => {
        const age = p.child_age || '미입력'
        ageGroups[age] = (ageGroups[age] || 0) + 1
      })

      const ageDistData = Object.entries(ageGroups)
        .map(([age, count]) => ({ age, count }))
        .sort((a, b) => {
          if (a.age === '미입력') return 1
          if (b.age === '미입력') return -1
          return parseInt(a.age) - parseInt(b.age)
        })

      setAgeDistribution(ageDistData)
      console.log('📊 나이별 분포:', ageDistData)

      // 상세 참가자 목록 로드 (추천인 정보 포함)
      console.log('📋 상세 참가자 목록 로드 중...')
      let detailQuery = supabase
        .from('event_participants')
        .select(`
          *,
          users:referrer_code (
            name,
            branch
          )
        `)

      // 권한별 필터링 (통계와 동일)
      if (determinedViewMode === 'user' && user?.referral_code) {
        detailQuery = detailQuery.eq('referrer_code', user.referral_code)
      } else if (determinedViewMode === 'admin' && user?.branch) {
        const { data: branchUsers } = await supabase
          .from('users')
          .select('referral_code')
          .eq('branch', user.branch)
          .not('referral_code', 'is', null)
        
        const branchReferralCodes = branchUsers?.map(u => u.referral_code) || []
        
        if (branchReferralCodes.length > 0) {
          detailQuery = detailQuery.in('referrer_code', branchReferralCodes)
        } else {
          detailQuery = detailQuery.eq('referrer_code', 'NONE')
        }
      }
      
      // 이벤트 필터 적용
      if (selectedEvent) {
        detailQuery = detailQuery.eq('event_name', selectedEvent)
      }
      
      // 날짜 필터 적용
      if (filters.startDate) {
        detailQuery = detailQuery.gte('created_at', filters.startDate)
      }
      if (filters.endDate) {
        const endDateTime = new Date(filters.endDate)
        endDateTime.setHours(23, 59, 59, 999)
        detailQuery = detailQuery.lte('created_at', endDateTime.toISOString())
      }

      detailQuery = detailQuery.order('created_at', { ascending: false })

      const { data: detailData, error: detailError } = await detailQuery

      if (detailError) throw detailError

      console.log('📋 상세 목록 로드:', detailData?.length, '명')
      setParticipants(detailData || [])

      // 상위 추천인 계산 (권한별 필터링 적용)
      if (showTopRankings) {
        const referrerCounts = {}
        allParticipants?.forEach(p => {
          if (p.referrer_code) {
            if (!referrerCounts[p.referrer_code]) {
              referrerCounts[p.referrer_code] = {
                code: p.referrer_code,
                count: 0,
                name: '',
                branch: ''
              }
            }
            referrerCounts[p.referrer_code].count++
          }
        })

        // 추천인 정보 조회
        const referrerCodes = Object.keys(referrerCounts)
        if (referrerCodes.length > 0) {
          const { data: referrerData } = await supabase
            .from('users')
            .select('referral_code, name, branch')
            .in('referral_code', referrerCodes)

          referrerData?.forEach(r => {
            if (referrerCounts[r.referral_code]) {
              referrerCounts[r.referral_code].name = r.name
              referrerCounts[r.referral_code].branch = r.branch
            }
          })
        }

        const topReferrersData = Object.values(referrerCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)

        setTopReferrers(topReferrersData)
        console.log('🏆 상위 추천인:', topReferrersData)

        // 상위 지점 계산 (시스템관리자만)
        if (determinedViewMode === 'system') {
          const branchCounts = {}
          detailData?.forEach(p => {
            const branch = p.users?.branch || '미배정'
            branchCounts[branch] = (branchCounts[branch] || 0) + 1
          })

          const topBranchesData = Object.entries(branchCounts)
            .map(([branch, count]) => ({ branch, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)

          setTopBranches(topBranchesData)
          console.log('🏆 상위 지점:', topBranchesData)
        }
      }

      setLoading(false)
      console.log('✅ 데이터 로드 완료')
    } catch (error) {
      console.error('❌ 데이터 로드 실패:', error)
      setLoading(false)
    }
  }

  // 필터 변경 핸들러
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // 검색 버튼 클릭 (필터 적용)
  const handleSearch = () => {
    loadData()
  }

  // 필터 초기화
  const handleResetFilters = () => {
    setFilters({
      branch: '',
      referrer: '',
      startDate: '',
      endDate: ''
    })
    // 필터 초기화 후 데이터 다시 로드
    setTimeout(() => loadData(), 100)
  }

  // 엑셀 다운로드
  const handleDownloadExcel = () => {
    // CSV 형식으로 다운로드
    const headers = ['No.', '신청일시', '학부모명', '연락처', '자녀성별', '자녀나이', '추천인', '추천인코드', '지점', '진도', '발송상태']
    const rows = participants.map((p, index) => [
      index + 1,
      new Date(p.created_at).toLocaleString('ko-KR'),
      p.parent_name,
      formatPhone(p.phone),
      p.child_gender,
      `${p.child_age}세`,
      p.users?.name || p.referrer_name || '-',
      p.referrer_code || '-',
      p.users?.branch || '-',
      p.current_day ? `${p.current_day}일차` : '-',
      p.last_sent_date === new Date().toISOString().split('T')[0] ? '발송완료' : '대기'
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `이벤트_참가자_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // 참가자 삭제 (시스템관리자만)
  const handleDeleteParticipant = async (id) => {
    if (!window.confirm('이 참가자를 삭제하시겠습니까?')) return

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

  // 페이지 변경
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // 페이지당 항목 수 변경
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value))
    setCurrentPage(1)
  }

  // 페이지네이션 계산
  const totalPages = Math.ceil(participants.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentParticipants = participants.slice(startIndex, endIndex)

  // 페이지 번호 배열 생성 (최대 10개)
  const getPageNumbers = () => {
    const pages = []
    const maxPages = 10
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2))
    let endPage = Math.min(totalPages, startPage + maxPages - 1)

    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
  }

  // 체크박스 관련 함수
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // 오늘 발송할 대상만 선택 (last_sent_date가 오늘이 아닌 것)
      const today = new Date().toISOString().split('T')[0]
      const eligible = currentParticipants.filter(p => p.last_sent_date !== today)
      setSelectedParticipants(eligible.map(p => p.id))
    } else {
      setSelectedParticipants([])
    }
  }

  const handleSelectParticipant = (id) => {
    setSelectedParticipants(prev => {
      if (prev.includes(id)) {
        return prev.filter(p => p !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  // 발송 모달 열기
  const handleOpenSendModal = () => {
    if (selectedParticipants.length === 0) {
      alert('발송할 대상을 선택해주세요.')
      return
    }
    setShowSendModal(true)
  }

  // 발송 처리
  const handleSendMathLetters = async () => {
    setSending(true)
    try {
      // 선택된 참가자 정보 가져오기
      const selectedData = participants.filter(p => selectedParticipants.includes(p.id))
      
      // 실제 발송 로직 (nodemailer 또는 API 호출)
      // 여기서는 DB 업데이트만 수행
      const today = new Date().toISOString().split('T')[0]
      
      for (const participant of selectedData) {
        // current_day 증가 및 last_sent_date 업데이트
        const { error } = await supabase
          .from('event_participants')
          .update({
            current_day: (participant.current_day || 0) + 1,
            last_sent_date: today
          })
          .eq('id', participant.id)
        
        if (error) throw error
        
        // TODO: 실제 이메일 발송 로직
        // await sendEmail(participant.email, participant.current_day)
      }
      
      alert(`${selectedData.length}명에게 수학편지를 발송했습니다.`)
      setShowSendModal(false)
      setSelectedParticipants([])
      loadData() // 데이터 새로고침
    } catch (error) {
      console.error('발송 실패:', error)
      alert('발송에 실패했습니다.')
    } finally {
      setSending(false)
    }
  }

  // 발송 대상 필터링 (오늘 발송하지 않은 사람만)
  const getEligibleParticipants = () => {
    const today = new Date().toISOString().split('T')[0]
    return participants.filter(p => 
      selectedParticipants.includes(p.id) && p.last_sent_date !== today
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="max-w-7xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-white border-2 rounded-lg hover:bg-gray-50 font-bold"
            style={{ borderColor: '#249689', color: '#249689' }}
          >
            ← 돌아가기
          </button>
          <h1 className="text-3xl font-bold" style={{ color: '#249689' }}>
            📊 이벤트 참가 현황
          </h1>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">{user?.name || '사용자'}</div>
          <div className="text-sm text-gray-600">{user?.branch || ''}</div>
        </div>
      </div>

      {/* 이벤트 선택 */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-lg font-bold" style={{ color: '#249689' }}>이벤트 선택:</label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="px-4 py-2 border-2 rounded-lg font-medium"
            style={{ borderColor: '#249689', minWidth: '200px' }}
          >
            <option value="">전체 이벤트</option>
            {events.map(event => (
              <option key={event.name} value={event.name}>{event.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-gray-600 mb-2">📊 전체 참가자</div>
          <div className="text-3xl font-bold" style={{ color: '#249689' }}>
            {formatNumber(stats.total)}명
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-gray-600 mb-2">📅 최근 7일</div>
          <div className="text-3xl font-bold" style={{ color: '#5B9BD5' }}>
            {formatNumber(stats.thisWeek)}명
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-gray-600 mb-2">👦 남아</div>
          <div className="text-3xl font-bold" style={{ color: '#70AD47' }}>
            {formatNumber(stats.male)}명
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-gray-600 mb-2">👧 여아</div>
          <div className="text-3xl font-bold" style={{ color: '#FF6B9D' }}>
            {formatNumber(stats.female)}명
          </div>
        </div>
      </div>

      {/* 상위 랭킹 (관리자만) */}
      {showTopRankings && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* 상위 추천인 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#249689' }}>🏆 상위 추천인 TOP 10</h3>
            <div className="space-y-2">
              {topReferrers.map((ref, index) => (
                <div key={ref.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg" style={{ color: index < 3 ? '#FFD700' : '#249689' }}>
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-medium">{ref.name || ref.code}</div>
                      <div className="text-sm text-gray-600">{ref.branch || '-'}</div>
                    </div>
                  </div>
                  <div className="text-xl font-bold" style={{ color: '#249689' }}>
                    {formatNumber(ref.count)}명
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 상위 지점 (시스템관리자만) */}
          {determinedViewMode === 'system' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#249689' }}>🏆 상위 지점 TOP 10</h3>
              <div className="space-y-2">
                {topBranches.map((branch, index) => (
                  <div key={branch.branch} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg" style={{ color: index < 3 ? '#FFD700' : '#249689' }}>
                        {index + 1}
                      </span>
                      <div className="font-medium">{branch.branch}</div>
                    </div>
                    <div className="text-xl font-bold" style={{ color: '#249689' }}>
                      {formatNumber(branch.count)}명
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 나이별 분포 (점장/지점관리자인 경우) */}
          {determinedViewMode === 'admin' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#249689' }}>📊 나이별 분포</h3>
              <div className="space-y-2">
                {ageDistribution.map((age) => (
                  <div key={age.age} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium">{age.age}세</div>
                    <div className="text-xl font-bold" style={{ color: '#249689' }}>
                      {formatNumber(age.count)}명
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 나이별 분포 (일반 유저) */}
      {!showTopRankings && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-4" style={{ color: '#249689' }}>📊 나이별 분포</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ageDistribution.map((age) => (
              <div key={age.age} className="p-4 bg-gray-50 rounded-lg text-center">
                <div className="text-gray-600 mb-1">{age.age}세</div>
                <div className="text-2xl font-bold" style={{ color: '#249689' }}>
                  {formatNumber(age.count)}명
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        {showFullData ? (
          // 관리자 모드: 지점, 추천인, 시작일, 종료일 + 검색 + 초기화 + 엑셀다운로드
          <div className="space-y-4">
            {/* 첫번째 줄: 지점, 추천인 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">지점</label>
                <select
                  value={filters.branch}
                  onChange={(e) => handleFilterChange('branch', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">전체 지점</option>
                  {branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
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
                  <option value="">전체 추천인</option>
                  {referrers.map(ref => (
                    <option key={ref.referrer_code} value={ref.referrer_code}>
                      {ref.referrer_name} ({ref.referrer_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 두번째 줄: 시작일, 종료일, 버튼들 */}
            <div className="flex items-end gap-4">
              <div style={{ width: '160px' }}>
                <label className="block text-sm font-medium mb-1">시작일</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div style={{ width: '160px' }}>
                <label className="block text-sm font-medium mb-1">종료일</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 text-white rounded-lg hover:opacity-90 font-bold whitespace-nowrap flex items-center gap-2"
                  style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
                >
                  <Search size={18} />
                  검색
                </button>
                <button
                  onClick={handleResetFilters}
                  className="py-2 border-2 rounded-lg hover:bg-gray-50 font-bold whitespace-nowrap flex items-center justify-center gap-2"
                  style={{ borderColor: '#249689', color: '#249689', borderRadius: '10px', fontSize: '15px', width: '110px' }}
                >
                  <RotateCcw size={18} />
                  초기화
                </button>
                <button
                  onClick={handleDownloadExcel}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 font-bold whitespace-nowrap flex items-center gap-2"
                  style={{ backgroundColor: '#5B9BD5', borderRadius: '10px', fontSize: '15px' }}
                >
                  <Download size={18} />
                  엑셀다운로드({formatNumber(participants.length)}명)
                </button>
              </div>
            </div>
          </div>
        ) : (
          // 일반업무(내 이벤트관리) 모드: 시작일 + 종료일 + 검색 + 초기화 + 엑셀다운로드
          <div className="flex items-end gap-4">
            {/* 좌측: 시작일, 종료일 */}
            <div style={{ width: '160px' }}>
              <label className="block text-sm font-medium mb-1">시작일</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div style={{ width: '160px' }}>
              <label className="block text-sm font-medium mb-1">종료일</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {/* 우측: 초기화, 엑셀다운로드 버튼 */}
            <div className="flex gap-2 ml-auto">
              {/* 검색 버튼 제거 - 자동 검색으로 대체 */}
              <button
                onClick={handleResetFilters}
                className="py-2 border-2 rounded-lg hover:bg-gray-50 font-bold whitespace-nowrap flex items-center justify-center gap-2"
                style={{ borderColor: '#249689', color: '#249689', borderRadius: '10px', fontSize: '15px', width: '110px' }}
              >
                <RotateCcw size={18} />
                초기화
              </button>
              <button
                onClick={handleDownloadExcel}
                className="px-4 py-2 text-white rounded-lg hover:opacity-90 font-bold whitespace-nowrap flex items-center gap-2"
                style={{ backgroundColor: '#5B9BD5', borderRadius: '10px', fontSize: '15px' }}
              >
                <Download size={18} />
                엑셀다운로드({formatNumber(participants.length)}명)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 참가자 목록 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold" style={{ color: '#249689' }}>👥 참가자 목록</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={handleOpenSendModal}
              disabled={selectedParticipants.length === 0}
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 font-bold whitespace-nowrap flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <Mail size={18} />
              오늘의 발송 ({selectedParticipants.length}명)
            </button>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">페이지당</label>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm font-medium"
                style={{ borderColor: '#249689' }}
              >
                <option value="30">30개</option>
                <option value="50">50개</option>
                <option value="100">100개</option>
              </select>
            </div>
            <div className="text-lg font-bold" style={{ color: '#249689' }}>
              검색결과: {formatNumber(participants.length)}명
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2" style={{ borderColor: '#249689' }}>
                <th className="px-3 py-2 text-left">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedParticipants.length === currentParticipants.filter(p => {
                      const today = new Date().toISOString().split('T')[0]
                      return p.last_sent_date !== today
                    }).length && currentParticipants.length > 0}
                  />
                </th>
                <th className="px-3 py-2 text-left">No.</th>
                <th className="px-3 py-2 text-left">신청일시</th>
                <th className="px-3 py-2 text-left">학부모명</th>
                <th className="px-3 py-2 text-left">연락처</th>
                <th className="px-3 py-2 text-left">자녀성별</th>
                <th className="px-3 py-2 text-left">자녀나이</th>
                <th className="px-3 py-2 text-left">추천인</th>
                <th className="px-3 py-2 text-left">추천인코드</th>
                <th className="px-3 py-2 text-left">지점</th>
                <th className="px-3 py-2 text-left">진도</th>
                <th className="px-3 py-2 text-left">발송상태</th>
                {determinedViewMode === 'system' && (
                  <th className="px-3 py-2 text-center">삭제</th>
                )}
              </tr>
            </thead>
            <tbody>
              {currentParticipants.map((p, index) => {
                const today = new Date().toISOString().split('T')[0]
                const alreadySent = p.last_sent_date === today
                return (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <input 
                        type="checkbox"
                        checked={selectedParticipants.includes(p.id)}
                        onChange={() => handleSelectParticipant(p.id)}
                        disabled={alreadySent}
                      />
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-600">{startIndex + index + 1}</td>
                    <td className="px-3 py-3 text-sm">{new Date(p.created_at).toLocaleString('ko-KR')}</td>
                    <td className="px-3 py-3">{p.parent_name}</td>
                    <td className="px-3 py-3">{formatPhone(p.phone)}</td>
                    <td className="px-3 py-3">{p.child_gender}</td>
                    <td className="px-3 py-3">{p.child_age}세</td>
                    <td className="px-3 py-3">{p.users?.name || p.referrer_name || '-'}</td>
                    <td className="px-3 py-3">{p.referrer_code || '-'}</td>
                    <td className="px-3 py-3">{p.users?.branch || '-'}</td>
                    <td className="px-3 py-3 font-medium">{p.current_day ? `${p.current_day}일차` : '-'}</td>
                    <td className="px-3 py-3">
                      {alreadySent ? (
                        <span className="text-green-600 font-medium">✅ 발송완료</span>
                      ) : (
                        <span className="text-gray-500">⏳ 대기</span>
                      )}
                    </td>
                    {determinedViewMode === 'system' && (
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => handleDeleteParticipant(p.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {participants.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            참가자가 없습니다
          </div>
        )}

        {/* 페이지네이션 */}
        {participants.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {/* 맨 처음 페이지 */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronsLeft size={20} />
            </button>

            {/* 이전 페이지 */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft size={20} />
            </button>

            {/* 페이지 번호 */}
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`min-w-[40px] px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === page
                    ? 'text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={
                  currentPage === page
                    ? { backgroundColor: '#249689' }
                    : {}
                }
              >
                {page}
              </button>
            ))}

            {/* 다음 페이지 */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === totalPages
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronRight size={20} />
            </button>

            {/* 맨 마지막 페이지 */}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === totalPages
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronsRight size={20} />
            </button>

            {/* 페이지 정보 */}
            <span className="ml-4 text-sm text-gray-600">
              {currentPage} / {totalPages} 페이지
            </span>
          </div>
        )}
      </div>

      {/* 발송 모달 */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#249689' }}>
                📧 오늘의 수학편지 발송
              </h2>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
                <span className="text-lg font-medium">발송일</span>
                <span className="text-lg font-bold" style={{ color: '#249689' }}>
                  {new Date().toLocaleDateString('ko-KR')}
                </span>
              </div>
              <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
                <span className="text-lg font-medium">발송 대상</span>
                <span className="text-lg font-bold" style={{ color: '#249689' }}>
                  {getEligibleParticipants().length}명
                </span>
              </div>
            </div>

            <div className="mb-6 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-bold mb-3">발송 목록</h3>
              <div className="space-y-2">
                {getEligibleParticipants().map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{p.parent_name}</div>
                      <div className="text-sm text-gray-600">{p.email || formatPhone(p.phone)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold" style={{ color: '#249689' }}>
                        {(p.current_day || 0) + 1}일차
                      </div>
                      <div className="text-sm text-gray-600">
                        (현재: {p.current_day || 0}일차)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowSendModal(false)}
                className="flex-1 px-6 py-3 border-2 rounded-lg font-bold text-lg hover:bg-gray-50"
                style={{ borderColor: '#249689', color: '#249689' }}
                disabled={sending}
              >
                취소
              </button>
              <button
                onClick={handleSendMathLetters}
                className="flex-1 px-6 py-3 text-white rounded-lg font-bold text-lg hover:opacity-90 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#249689' }}
                disabled={sending}
              >
                {sending ? (
                  <>처리 중...</>
                ) : (
                  <>
                    <Mail size={20} />
                    발송하기
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}