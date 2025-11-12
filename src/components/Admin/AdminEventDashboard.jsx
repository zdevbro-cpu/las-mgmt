import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, RotateCcw, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Mail, X, BarChart3 } from 'lucide-react'
import MathLetterStatsModal from './MathLetterStatsModal'

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
  
  // 수학편지 통계 접근 권한 (점주는 제외)
  const canViewMathLetterStats = 
    user?.user_type === '시스템관리자' || 
    user?.user_type === '점장' || 
    user?.user_type === '지점관리자'

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
  
  // 수학편지 발송 관련 상태
  const [selectedParticipants, setSelectedParticipants] = useState([])
  const [showMathLetterModal, setShowMathLetterModal] = useState(false)
  
  // 수학편지 통계 모달 상태
  const [showMathLetterStatsModal, setShowMathLetterStatsModal] = useState(false)
  
  const filteredParticipants = participants.filter(p => {
    // 지점 필터 (p.users.branch 사용)
    if (filters.branch && p.users?.branch !== filters.branch) return false
    
    // 추천인 필터
    if (filters.referrer && p.referrer_code !== filters.referrer) return false
    
    // 날짜 필터
    if (filters.startDate) {
      const pDate = new Date(p.created_at)
      const startDate = new Date(filters.startDate)
      if (pDate < startDate) return false
    }
    if (filters.endDate) {
      const pDate = new Date(p.created_at)
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59, 999)
      if (pDate > endDate) return false
    }
    
    return true
  })

  const filteredStats = {
    total: filteredParticipants.length,
    male: filteredParticipants.filter(p => p.child_gender === '남').length,
    female: filteredParticipants.filter(p => p.child_gender === '여').length,
    thisWeek: filteredParticipants.filter(p => {
      const createdAt = new Date(p.created_at)
      const now = new Date()
      const dayOfWeek = now.getDay() // 0(일) ~ 6(토)
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 월요일까지의 차이
      const thisMonday = new Date(now)
      thisMonday.setDate(now.getDate() - diff)
      thisMonday.setHours(0, 0, 0, 0)
      return createdAt >= thisMonday
    }).length
  }

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

      const uniqueBranches = [...new Set(branchData?.map(b => b.branch) || [])].sort()
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
      setLoading(true)

      // 통계 데이터 로드
      let statsQuery = supabase
        .from('event_participants')
        .select('*')
      
      // 권한별 필터링
      if (determinedViewMode === 'user' && user?.referral_code) {
        statsQuery = statsQuery.eq('referrer_code', user.referral_code)
      } else if (determinedViewMode === 'admin' && user?.branch) {
        const { data: branchUsers } = await supabase
          .from('users')
          .select('referral_code')
          .eq('branch', user.branch)
          .not('referral_code', 'is', null)
        
        const branchReferralCodes = branchUsers?.map(u => u.referral_code) || []
        
        if (branchReferralCodes.length > 0) {
          statsQuery = statsQuery.in('referrer_code', branchReferralCodes)
        } else {
          statsQuery = statsQuery.eq('referrer_code', 'NONE')
        }
      }
      
      // 이벤트 필터 적용
      if (selectedEvent) {
        statsQuery = statsQuery.eq('event_name', selectedEvent)
      }
      
      // 페이지네이션으로 모든 데이터 가져오기
      let allParticipants = []
      let from = 0
      const pageSize = 1000

      while (true) {
        const { data: pageData, error: pageError } = await statsQuery.range(from, from + pageSize - 1)
        
        if (pageError) throw pageError
        if (!pageData || pageData.length === 0) break
        
        allParticipants = allParticipants.concat(pageData)
        
        if (pageData.length < pageSize) break
        from += pageSize
      }

      const totalCount = allParticipants?.length || 0
      const maleCount = allParticipants?.filter(p => p.child_gender === '남').length || 0
      const femaleCount = allParticipants?.filter(p => p.child_gender === '여').length || 0

      // 이번주 참가자 계산 (월요일 기준)
      const now = new Date()
      const dayOfWeek = now.getDay()
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const thisMonday = new Date(now)
      thisMonday.setDate(now.getDate() - diff)
      thisMonday.setHours(0, 0, 0, 0)
      
      const thisWeekCount = allParticipants?.filter(p => {
        const createdAt = new Date(p.created_at)
        return createdAt >= thisMonday
      }).length || 0

      setStats({
        total: totalCount,
        thisWeek: thisWeekCount,
        male: maleCount,
        female: femaleCount
      })

      // 연령 분포 계산 (1~20세, 4개 구간)
      const ageRanges = [
        { name: '1~5세 (유아)', min: 1, max: 5, male: 0, female: 0, total: 0 },
        { name: '6~10세 (초등 저학년)', min: 6, max: 10, male: 0, female: 0, total: 0 },
        { name: '11~15세 (초등 고학년~중학생)', min: 11, max: 15, male: 0, female: 0, total: 0 },
        { name: '16~20세 (고등학생~성인)', min: 16, max: 20, male: 0, female: 0, total: 0 }
      ]
      
      // 데이터 채우기
      allParticipants?.forEach(p => {
        if (p.child_age) {
          const age = parseInt(p.child_age)
          if (!isNaN(age) && age >= 1 && age <= 20) {
            const rangeIndex = ageRanges.findIndex(r => age >= r.min && age <= r.max)
            if (rangeIndex !== -1) {
              ageRanges[rangeIndex].total++
              if (p.child_gender === '남') {
                ageRanges[rangeIndex].male++
              } else if (p.child_gender === '여') {
                ageRanges[rangeIndex].female++
              }
            }
          }
        }
      })

      console.log('✅ 연령 분포:', ageRanges)
      setAgeDistribution(ageRanges)

      // 추천인별 통계
      console.log('🏆 추천인 통계 로드 중...')
      let referrerStatsQuery = supabase
        .from('event_participants')
        .select('referrer_name, referrer_code')
        .not('referrer_code', 'is', null)
      
      // 권한별 필터링
      if (determinedViewMode === 'user' && user?.referral_code) {
        // 일반 유저: 본인이 추천한 데이터만
        referrerStatsQuery = referrerStatsQuery.eq('referrer_code', user.referral_code)
      } else if (determinedViewMode === 'admin' && user?.branch) {
        // 점장/지점관리자: 본인 지점의 모든 직원이 추천한 데이터
        const { data: branchUsers } = await supabase
          .from('users')
          .select('referral_code')
          .eq('branch', user.branch)
          .not('referral_code', 'is', null)
        
        const branchReferralCodes = branchUsers?.map(u => u.referral_code) || []
        
        if (branchReferralCodes.length > 0) {
          referrerStatsQuery = referrerStatsQuery.in('referrer_code', branchReferralCodes)
        } else {
          referrerStatsQuery = referrerStatsQuery.eq('referrer_code', 'NONE')
        }
      }
      // 시스템관리자는 필터 없음
      
      // 이벤트 필터 적용
      if (selectedEvent) {
        referrerStatsQuery = referrerStatsQuery.eq('event_name', selectedEvent)
      }
      
      const { data: referrerStats, error: referrerError } = await referrerStatsQuery

      if (referrerError) {
        console.error('❌ 추천인 통계 에러:', referrerError)
      }

      // Top 12는 시스템 관리자만 계산
      if (showTopRankings) {
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
      
      // 모든 참가자의 추천인 코드를 가져오기 (권한 필터링 없이 전체 데이터)
      let branchStatsQuery = supabase
        .from('event_participants')
        .select('referrer_code')
        .not('referrer_code', 'is', null)
      
      // 이벤트 필터만 적용
      if (selectedEvent) {
        branchStatsQuery = branchStatsQuery.eq('event_name', selectedEvent)
      }
      
      // 페이지네이션으로 모든 데이터 가져오기
      let allBranchParticipants = []
      let from = 0
      const pageSize = 1000

      while (true) {
        const { data: pageData, error: pageError } = await branchStatsQuery.range(from, from + pageSize - 1)
        
        if (pageError) throw pageError
        if (!pageData || pageData.length === 0) break
        
        allBranchParticipants = allBranchParticipants.concat(pageData)
        
        if (pageData.length < pageSize) break
        from += pageSize
      }
      
      // 모든 참가자의 추천인 코드를 unique하게 추출
      const uniqueBranchReferrerCodes = [...new Set(allBranchParticipants?.map(p => p.referrer_code).filter(Boolean))]
      
      // 해당 추천인들의 지점 정보 가져오기
      let branchUsersData = []
      if (uniqueBranchReferrerCodes.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('referral_code, branch')
          .in('referral_code', uniqueBranchReferrerCodes)
        
        branchUsersData = users || []
      }
      
      // 각 참가자를 지점별로 카운트
      const branchMap = {}
      allBranchParticipants?.forEach(p => {
        const userInfo = branchUsersData.find(u => u.referral_code === p.referrer_code)
        const branch = userInfo?.branch || '-'
        
        if (branch && branch !== '-') {
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
      } else {
        // 일반 유저는 Top 12 표시 안함
        setTopReferrers([])
        setTopBranches([])
      }

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
      
      // 1. 참가자 데이터 먼저 가져오기
      let query = supabase
        .from('event_participants')
        .select('*')
        .order('created_at', { ascending: false })

      // 이벤트 필터 적용
      if (selectedEvent) {
        query = query.eq('event_name', selectedEvent)
      }
      
      // 권한별 필터링
      if (determinedViewMode === 'user' && user?.referral_code) {
        query = query.eq('referrer_code', user.referral_code)
      } else if (determinedViewMode === 'admin' && user?.branch) {
        const { data: branchUsers } = await supabase
          .from('users')
          .select('referral_code')
          .eq('branch', user.branch)
          .not('referral_code', 'is', null)
        
        const branchReferralCodes = branchUsers?.map(u => u.referral_code) || []
        
        if (branchReferralCodes.length > 0) {
          query = query.in('referrer_code', branchReferralCodes)
        } else {
          query = query.eq('referrer_code', 'NONE')
        }
      }

      // 필터 적용
      if (activeFilters.referrer) {
        query = query.eq('referrer_code', activeFilters.referrer)
      }
      if (activeFilters.startDate) {
        query = query.gte('created_at', `${activeFilters.startDate}T00:00:00`)
      }
      if (activeFilters.endDate) {
        query = query.lte('created_at', `${activeFilters.endDate}T23:59:59`)
      }

      // 모든 데이터를 가져오기 위해 페이지네이션 사용
      let allData = []
      let from = 0
      const pageSize = 1000

      while (true) {
        const { data: pageData, error: pageError } = await query.range(from, from + pageSize - 1)
        
        if (pageError) throw pageError
        if (!pageData || pageData.length === 0) break
        
        allData = allData.concat(pageData)
        
        if (pageData.length < pageSize) break
        from += pageSize
      }

      const participantsData = allData

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
        filteredData = enrichedData.filter(p => p.users?.branch === activeFilters.branch)
      }

      setParticipants(filteredData)
    } catch (error) {
      console.error('❌ 참가자 목록 로드 실패:', error)
      alert('참가자 목록을 불러오는데 실패했습니다: ' + error.message)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value }
      // 필터 변경 시 자동으로 검색 실행
      setTimeout(() => {
        setCurrentPage(1)
        loadParticipants(newFilters)
      }, 0)
      return newFilters
    })
  }

  // Top 카드 클릭 시 사용하는 핸들러 (다른 필터는 유지, 대립되는 필터만 초기화)
  const handleCardFilterClick = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value }
      // 지점 카드 클릭 시 추천인 필터 초기화, 추천인 카드 클릭 시 지점 필터 초기화
      if (key === 'branch') {
        newFilters.referrer = ''
      } else if (key === 'referrer') {
        newFilters.branch = ''
      }
      // 자동으로 검색 실행
      setTimeout(() => {
        setCurrentPage(1)
        loadParticipants(newFilters)
      }, 0)
      return newFilters
    })
  }

  const handleApplyFilters = () => {
    setCurrentPage(1)
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
    setCurrentPage(1)
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


  // 페이지네이션 계산
  const totalPages = Math.ceil(participants.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentParticipants = participants.slice(startIndex, endIndex)

  // 페이지 번호 배열 생성 (최대 10개 표시)
  const getPageNumbers = () => {
    const maxPages = 10
    const pages = []
    
    if (totalPages <= maxPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      let start = Math.max(1, currentPage - 4)
      let end = Math.min(totalPages, start + maxPages - 1)
      
      if (end - start < maxPages - 1) {
        start = Math.max(1, end - maxPages + 1)
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
    }
    
    return pages
  }

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 페이지당 항목 수 변경 핸들러
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  // 전체 선택/해제
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedParticipants(currentParticipants.map(p => p.id))
    } else {
      setSelectedParticipants([])
    }
  }

  // 개별 선택/해제
  const handleSelectParticipant = (id) => {
    if (selectedParticipants.includes(id)) {
      setSelectedParticipants(selectedParticipants.filter(pid => pid !== id))
    } else {
      setSelectedParticipants([...selectedParticipants, id])
    }
  }

  // 수학편지 발송 모달 열기
  const handleOpenMathLetterModal = () => {
    if (selectedParticipants.length === 0) {
      alert('수학편지를 보낼 대상자를 선택해주세요.')
      return
    }
    setShowMathLetterModal(true)
  }

  // 수학편지 발송 (실제 발송은 SMS API 연동 필요)
  const handleSendMathLetter = async () => {
    const selectedData = participants.filter(p => selectedParticipants.includes(p.id))
    
    // TODO: SMS API 연동하여 실제 발송
    console.log('발송 대상:', selectedData)
    
    alert(`${selectedData.length}명에게 수학편지를 발송합니다.\n(SMS API 연동 필요)`)
    setShowMathLetterModal(false)
    setSelectedParticipants([])
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
                <p className="text-4xl font-bold">{formatNumber(filteredStats.total)}명</p>
              </div>
              <div className="text-5xl">👥</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-2">이번주 참가자</p>
                <p className="text-4xl font-bold">{formatNumber(filteredStats.thisWeek)}명</p>
              </div>
              <div className="text-5xl">📅</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sky-100 text-sm mb-2">남학생</p>
                <p className="text-4xl font-bold">{formatNumber(filteredStats.male)}명</p>
              </div>
              <div className="text-5xl">👦</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm mb-2">여학생</p>
                <p className="text-4xl font-bold">{formatNumber(filteredStats.female)}명</p>
              </div>
              <div className="text-5xl">👧</div>
            </div>
          </div>
        </div>

        {/* 차트 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 연령 분포 차트 - 50% 폭 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#249689' }}>📊 연령 분포 (1~20세, 4개 구간)</h3>
            <div className="space-y-4">
              {(() => {
                // 최대값 계산 (바 차트 비율용)
                const maxTotal = Math.max(...ageDistribution.map(a => a.total), 1)
                
                return ageDistribution.map((range, idx) => (
                  <div key={idx}>
                    {/* 연령대명 */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-gray-700">{range.name}</span>
                      <span className="text-lg font-bold" style={{ color: '#249689' }}>
                        총 {formatNumber(range.total)}명
                      </span>
                    </div>
                    
                    {range.total > 0 ? (
                      <>
                        {/* 남학생 바 */}
                        <div className="mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-sky-600 font-semibold w-20">👦 남학생</span>
                            <div className="flex-1 flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-sky-400 to-sky-500 h-full flex items-center justify-end pr-2 transition-all duration-500"
                                  style={{ width: `${(range.male / maxTotal) * 100}%` }}
                                >
                                  {range.male > 0 && (
                                    <span className="text-white text-xs font-bold">{formatNumber(range.male)}명</span>
                                  )}
                                </div>
                              </div>
                              <span className="text-sm text-gray-600 w-12 text-right">
                                {range.total > 0 ? `${((range.male / range.total) * 100).toFixed(0)}%` : '0%'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* 여학생 바 */}
                        <div className="mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-pink-600 font-semibold w-20">👧 여학생</span>
                            <div className="flex-1 flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-pink-400 to-pink-500 h-full flex items-center justify-end pr-2 transition-all duration-500"
                                  style={{ width: `${(range.female / maxTotal) * 100}%` }}
                                >
                                  {range.female > 0 && (
                                    <span className="text-white text-xs font-bold">{formatNumber(range.female)}명</span>
                                  )}
                                </div>
                              </div>
                              <span className="text-sm text-gray-600 w-12 text-right">
                                {range.total > 0 ? `${((range.female / range.total) * 100).toFixed(0)}%` : '0%'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-400 text-center py-2 bg-gray-50 rounded-lg">
                        데이터 없음
                      </div>
                    )}
                    
                    {/* 구분선 (마지막 제외) */}
                    {idx < ageDistribution.length - 1 && (
                      <div className="border-b border-gray-200 mt-3"></div>
                    )}
                  </div>
                ))
              })()}
              
              {ageDistribution.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>연령 데이터가 없습니다</p>
                </div>
              )}
            </div>
          </div>

          {/* 성별 비율 파이차트 - 50% 폭 */}
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
                    <p className="text-3xl font-bold" style={{ color: '#249689' }}>{formatNumber(stats.total)}</p>
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
                  <p className="font-bold text-sky-600">{formatNumber(stats.male)}명</p>
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
                  <p className="font-bold text-pink-600">{formatNumber(stats.female)}명</p>
                  <p className="text-xs text-gray-600">
                    {stats.total > 0 ? ((stats.female / stats.total) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top 매장 - 시스템 관리자만 표시 */}
        {determinedViewMode === 'system' && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-6" style={{ color: '#249689' }}>🏆 추천 매장 Top 12</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {topBranches.map((branch, idx) => (
              <div 
                key={idx} 
                onClick={() => handleCardFilterClick('branch', branch.branch)}
                className="relative bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 px-3 py-2 border-2 hover:scale-105 cursor-pointer"
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
                      {idx === 0 ? '🏅' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏪'}
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
                      {formatNumber(branch.count)}<span className="text-xs ml-0.5">명</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 데이터 없을 때 */}
          {topBranches.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">🏪</p>
              <p>지점 데이터가 없습니다</p>
            </div>
          )}
        </div>
        )}

        {/* Top 추천인 - 매장관리자/시스템관리자 표시 */}
        {showTopRankings && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-6" style={{ color: '#249689' }}>🏆 추천인 Top 12</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {topReferrers.map((ref, idx) => (
              <div 
                key={idx} 
                onClick={() => handleCardFilterClick('referrer', ref.code)}
                className="relative bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 px-3 py-2 border-2 hover:scale-105 cursor-pointer"
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
                      {formatNumber(ref.count)}<span className="text-xs ml-0.5">명</span>
                    </p>
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
        )}


        {/* 필터 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          {/* 검색필터 제목 */}
          <h3 className="text-xl font-bold mb-4" style={{ color: '#249689' }}>🔍 검색 필터</h3>

          {/* 필터 - 1줄 배치 */}
          {showTopRankings ? (
            // 매장관리자/시스템관리자 모드: 지점 + 추천인 + 시작일 + 종료일 + 초기화 + 엑셀다운로드
            <div className="flex items-end gap-4">
              {/* 좌측: 지점, 추천인, 시작일, 종료일 */}
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">지점</label>
                <select
                  value={filters.branch}
                  onChange={(e) => handleFilterChange('branch', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">전체지점</option>
                  {branches.map(branch => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
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
              <div className="flex gap-2">
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
                  onClick={handleOpenMathLetterModal}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 font-bold whitespace-nowrap flex items-center gap-2"
                  style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
                  disabled={selectedParticipants.length === 0}
                >
                  <Mail size={18} />
                  수학편지 보내기({selectedParticipants.length}명)
                </button>
                <button
                  onClick={handleDownloadExcel}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 font-bold whitespace-nowrap flex items-center gap-2"
                  style={{ backgroundColor: '#5B9BD5', borderRadius: '10px', fontSize: '15px' }}
                >
                  <Download size={18} />
                  엑셀다운로드({formatNumber(participants.length)}명)
                </button>
                {canViewMathLetterStats && (
                  <button
                    onClick={() => setShowMathLetterStatsModal(true)}
                    className="px-4 py-2 text-white rounded-lg hover:opacity-90 font-bold whitespace-nowrap flex items-center gap-2"
                    style={{ backgroundColor: '#FF6B6B', borderRadius: '10px', fontSize: '15px' }}
                  >
                    <BarChart3 size={18} />
                    수학편지 통계
                  </button>
                )}
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
                  onClick={handleOpenMathLetterModal}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 font-bold whitespace-nowrap flex items-center gap-2"
                  style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
                  disabled={selectedParticipants.length === 0}
                >
                  <Mail size={18} />
                  수학편지 보내기({selectedParticipants.length}명)
                </button>
                <button
                  onClick={handleDownloadExcel}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 font-bold whitespace-nowrap flex items-center gap-2"
                  style={{ backgroundColor: '#5B9BD5', borderRadius: '10px', fontSize: '15px' }}
                >
                  <Download size={18} />
                  엑셀다운로드({formatNumber(participants.length)}명)
                </button>
                {canViewMathLetterStats && (
                  <button
                    onClick={() => setShowMathLetterStatsModal(true)}
                    className="px-4 py-2 text-white rounded-lg hover:opacity-90 font-bold whitespace-nowrap flex items-center gap-2"
                    style={{ backgroundColor: '#FF6B6B', borderRadius: '10px', fontSize: '15px' }}
                  >
                    <BarChart3 size={18} />
                    수학편지 통계
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        {/* 참가자 목록 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold" style={{ color: '#249689' }}>👥 참가자 목록</h3>
            <div className="flex items-center gap-4">
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
                  <th className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedParticipants.length === currentParticipants.length && currentParticipants.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-2 text-left">No.</th>
                  <th className="px-3 py-2 text-left">신청인코드</th>
                  <th className="px-3 py-2 text-left">학부모명</th>
                  <th className="px-3 py-2 text-left">연락처</th>
                  <th className="px-3 py-2 text-left">자녀성별</th>
                  <th className="px-3 py-2 text-left">자녀나이</th>
                  <th className="px-3 py-2 text-left">추천인</th>
                  <th className="px-3 py-2 text-left">추천인코드</th>
                  <th className="px-3 py-2 text-left">지점</th>
                  {determinedViewMode === 'system' && (
                    <th className="px-3 py-2 text-center">삭제</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentParticipants.map((p, index) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(p.id)}
                        onChange={() => handleSelectParticipant(p.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-600">{startIndex + index + 1}</td>
                    <td className="px-3 py-3 text-sm font-semibold" style={{ color: '#249689' }}>{p.subscriber_number || '-'}</td>
                    <td className="px-3 py-3">{p.parent_name}</td>
                    <td className="px-3 py-3">{formatPhone(p.phone)}</td>
                    <td className="px-3 py-3">{p.child_gender}</td>
                    <td className="px-3 py-3">{p.child_age}세</td>
                    <td className="px-3 py-3">{p.users?.name || p.referrer_name || '-'}</td>
                    <td className="px-3 py-3">{p.referrer_code || '-'}</td>
                    <td className="px-3 py-3">{p.users?.branch || '-'}</td>
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
                ))}
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
      </div>
      </div>

      {/* 수학편지 발송 모달 */}
      {showMathLetterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                <img src="/images/logo.png" alt="LAS Logo" className="h-8 w-8 sm:h-10 sm:w-10" />
                <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#249689' }}>수학편지 발송</h2>
              </div>
            </div>

            <div className="p-3 sm:p-6">
              {/* 발송 대상자 목록 */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: '#249689' }}>
                  📬 발송 대상자 ({selectedParticipants.length}명)
                </h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 sm:max-h-96 overflow-y-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left font-semibold text-gray-700">No.</th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-700 hidden sm:table-cell">신청인코드</th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-700">학부모명</th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-700 hidden sm:table-cell">연락처</th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-700 hidden md:table-cell">자녀나이</th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-700">진도</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {participants
                        .filter(p => selectedParticipants.includes(p.id))
                        .map((p, index) => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-2 py-2">{index + 1}</td>
                            <td className="px-2 py-2 font-semibold hidden sm:table-cell" style={{ color: '#249689' }}>{p.subscriber_number || '-'}</td>
                            <td className="px-2 py-2">{p.parent_name}</td>
                            <td className="px-2 py-2 hidden sm:table-cell">{formatPhone(p.phone)}</td>
                            <td className="px-2 py-2 hidden md:table-cell">{p.child_age}세</td>
                            <td className="px-2 py-2">
                              <span className="inline-block px-1.5 py-0.5 sm:px-2 sm:py-1 bg-teal-100 text-teal-800 rounded text-xs font-semibold">
                                {p.current_math_letter || 'K2-01'}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 안내 메시지 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <h3 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">📱 발송 정보</h3>
                <ul className="text-xs sm:text-sm text-blue-700 space-y-1 ml-4 list-disc">
                  <li>수학편지와 동영상 링크가 문자로 발송됩니다</li>
                  <li>각 참가자의 현재 진도에 맞는 수학편지가 발송됩니다</li>
                  <li>발송 후 진도가 자동으로 업데이트됩니다</li>
                </ul>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-end gap-2 sm:gap-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowMathLetterModal(false)
                }}
                className="flex items-center gap-1 sm:gap-2 px-4 py-2 sm:px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base"
              >
                <X className="w-4 h-4" />
                취소
              </button>
              <button
                onClick={handleSendMathLetter}
                className="flex items-center gap-1 sm:gap-2 px-4 py-2 sm:px-6 text-white rounded-lg hover:opacity-90 transition-colors text-sm sm:text-base"
                style={{ backgroundColor: '#249689' }}
              >
                <Mail className="w-4 h-4" />
                발송
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 수학편지 통계 모달 */}
      {showMathLetterStatsModal && (
        <MathLetterStatsModal
          user={user}
          onClose={() => setShowMathLetterStatsModal(false)}
        />
      )}
    </div>
  )
}