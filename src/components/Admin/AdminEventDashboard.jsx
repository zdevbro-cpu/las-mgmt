import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, RotateCcw, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Mail, X, BarChart3, Send, MessageCircle, Trash2, Users, Calendar, Trophy, Medal, Award, User, Store } from 'lucide-react'
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
      user?.role === '지점장' || user?.role === '지점관리자') {
      determinedViewMode = 'admin'
    } else {
      determinedViewMode = 'user'
    }
  }

  console.log('뷰모드 결정:', determinedViewMode, '| User Role:', user?.role, '| User Type:', user?.user_type, '| From:', from)

  // viewMode: 'user' = 일반 유저 (본인 데이터만), 'admin' = 매장관리자 (지점 전체 데이터), 'system' = 시스템관리자 (전체 데이터)
  const showFullData = determinedViewMode === 'admin' || determinedViewMode === 'system'
  const showTopRankings = determinedViewMode === 'admin' || determinedViewMode === 'system'

  // 수학편지 통계 접근 권한 (점주/시스템 제외)
  const canViewMathLetterStats =
    user?.user_type === '시스템관리자' ||
    user?.user_type === '지점장' ||
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

  // 검색 필터 상태
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

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)')
    const applyMobileItemsPerPage = () => {
      if (mediaQuery.matches) {
        setItemsPerPage(200)
        setCurrentPage(1)
      }
    }

    applyMobileItemsPerPage()
    mediaQuery.addEventListener('change', applyMobileItemsPerPage)
    return () => mediaQuery.removeEventListener('change', applyMobileItemsPerPage)
  }, [])

  // 수학편지 발송 관련 상태
  const [selectedParticipants, setSelectedParticipants] = useState([])
  const [showMathLetterModal, setShowMathLetterModal] = useState(false)
  const [sendingMathLetter, setSendingMathLetter] = useState(false)
  const [mathLetters, setMathLetters] = useState([]) // 전체 수학편지 목록

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
    loadMathLetters() // 수학편지 목록 로드
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
    } catch (error) {
      console.error('이벤트 목록 로드 실패:', error)
    }
  }

  // 수학편지 목록 로드
  const loadMathLetters = async () => {
    try {
      const { data, error } = await supabase
        .from('math_letters')
        .select('*')
        .order('day_number', { ascending: true })

      if (error) throw error
      setMathLetters(data || [])
    } catch (error) {
      console.error('수학편지 목록 로드 실패:', error)
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
        { name: '1~5세(유아)', min: 1, max: 5, male: 0, female: 0, total: 0 },
        { name: '6~10세(초등 저학년)', min: 6, max: 10, male: 0, female: 0, total: 0 },
        { name: '11~15세(초등 고학년~중학생)', min: 11, max: 15, male: 0, female: 0, total: 0 },
        { name: '16~20세(고등학생~성인)', min: 16, max: 20, male: 0, female: 0, total: 0 }
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

      console.log('▶ 연령 분포:', ageRanges)
      setAgeDistribution(ageRanges)

      // 추천인별 통계
      console.log('▶ 추천인별 통계 로드 중...')
      let referrerStatsQuery = supabase
        .from('event_participants')
        .select('referrer_name, referrer_code')
        .not('referrer_code', 'is', null)

      // 권한별 필터링
      if (determinedViewMode === 'user' && user?.referral_code) {
        referrerStatsQuery = referrerStatsQuery.eq('referrer_code', user.referral_code)
      } else if (determinedViewMode === 'admin' && user?.branch) {
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

      // 이벤트 필터 적용
      if (selectedEvent) {
        referrerStatsQuery = referrerStatsQuery.eq('event_name', selectedEvent)
      }

      const { data: referrerStats, error: referrerError } = await referrerStatsQuery

      if (referrerError) {
        console.error('▶ 추천인별 통계 에러:', referrerError)
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

        console.log('▶ Top 추천인:', topReferrersList)
        setTopReferrers(topReferrersList)

        // 추천지점별 통계 계산
        console.log('▶ 추천지점별 통계 계산 중...')

        let branchStatsQuery = supabase
          .from('event_participants')
          .select('referrer_code')
          .not('referrer_code', 'is', null)

        if (selectedEvent) {
          branchStatsQuery = branchStatsQuery.eq('event_name', selectedEvent)
        }

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

        const uniqueBranchReferrerCodes = [...new Set(allBranchParticipants?.map(p => p.referrer_code).filter(Boolean))]

        let branchUsersData = []
        if (uniqueBranchReferrerCodes.length > 0) {
          const { data: users } = await supabase
            .from('users')
            .select('referral_code, branch')
            .in('referral_code', uniqueBranchReferrerCodes)

          branchUsersData = users || []
        }

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

        console.log('▶ Top 지점:', topBranchesList)
        setTopBranches(topBranchesList)
      } else {
        setTopReferrers([])
        setTopBranches([])
      }

      console.log('▶ 참가자 목록 로드 시작...')
      await loadParticipants()

      console.log('▶ 모든 데이터 로드 완료!')
    } catch (error) {
      console.error('▶ 데이터 로드 실패:', error)
      alert('데이터를 불러오는데 실패했습니다: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadParticipants = async (customFilters = null) => {
    try {
      const activeFilters = customFilters !== null ? customFilters : filters

      let query = supabase
        .from('event_participants')
        .select('*')
        .order('created_at', { ascending: false })

      if (selectedEvent) {
        query = query.eq('event_name', selectedEvent)
      }

      if (determinedViewMode === 'user' && user?.referral_code) {
        query = query.eq('referrer_code', user.referral_code)
      } else if (determinedViewMode === 'admin' && user?.branch) {
        if (!activeFilters.branch) {
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
      }

      if (activeFilters.referrer) {
        query = query.eq('referrer_code', activeFilters.referrer)
      }

      if (activeFilters.branch) {
        const { data: filterBranchUsers } = await supabase
          .from('users')
          .select('referral_code')
          .eq('branch', activeFilters.branch)

        const filterBranchCodes = filterBranchUsers?.map(u => u.referral_code).filter(Boolean) || []

        if (filterBranchCodes.length > 0) {
          query = query.in('referrer_code', filterBranchCodes)
        } else {
          query = query.eq('referrer_code', 'NONE_MATCHING_BRANCH_FILTER')
        }
      }
      if (activeFilters.startDate) {
        query = query.gte('created_at', `${activeFilters.startDate}T00:00:00`)
      }
      if (activeFilters.endDate) {
        query = query.lte('created_at', `${activeFilters.endDate}T23:59:59`)
      }

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

      const referrerCodes = [...new Set(participantsData?.map(p => p.referrer_code).filter(Boolean))]

      let usersData = []
      if (referrerCodes.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('referral_code, name, branch')
          .in('referral_code', referrerCodes)

        if (usersError) {
          console.error('▶ Users 조회 에러:', usersError)
        } else {
          usersData = users || []
        }
      }

      const participantIds = participantsData.map(p => p.id)
      let sendLogs = []
      if (participantIds.length > 0) {
        const { data: logs, error: logsError } = await supabase
          .from('math_letter_send_logs')
          .select('participant_id, letter_id, sent_at, math_letters(day_number)')
          .in('participant_id', participantIds)
          .order('sent_at', { ascending: false })

        if (!logsError) {
          sendLogs = logs
        }
      }

      const enrichedData = participantsData?.map(participant => {
        const user = usersData.find(u => u.referral_code === participant.referrer_code)
        const lastLog = sendLogs.find(log => log.participant_id === participant.id)
        const lastSentDay = lastLog?.math_letters?.day_number || 0

        return {
          ...participant,
          users: user ? { name: user.name, branch: user.branch } : null,
          lastSentDay: lastSentDay,
          nextDay: lastSentDay + 1
        }
      }) || []

      let filteredData = enrichedData

      setParticipants(filteredData)
    } catch (error) {
      console.error('▶ 참가자 목록 로드 실패:', error)
      alert('참가자 목록을 불러오는데 실패했습니다: ' + error.message)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value }
      setTimeout(() => {
        setCurrentPage(1)
        loadParticipants(newFilters)
      }, 0)
      return newFilters
    })
  }

  const handleCardFilterClick = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value }
      if (key === 'branch') {
        newFilters.referrer = ''
      } else if (key === 'referrer') {
        newFilters.branch = ''
      }
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
      '신청자코드',
      '학부모명',
      '연락처',
      '자녀성별',
      '자녀나이',
      '추천인',
      '추천인코드',
      '지점',
      '문의사항',
      '진도(최근발송)'
    ]

    const rows = participants.map(p => [
      new Date(p.created_at).toLocaleString('ko-KR'),
      p.subscriber_number || '',
      p.parent_name || '',
      p.phone || '',
      p.child_gender || '',
      p.child_age || '',
      p.users?.name || p.referrer_name || '',
      p.referrer_code || '',
      p.users?.branch || '',
      p.inquiry || '',
      p.lastSentDay ? `${p.lastSentDay}일차` : '미발송'
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
    link.setAttribute('download', `이벤트참가자목록_${dateStr}.xls`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalPages = Math.ceil(participants.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentParticipants = participants.slice(startIndex, endIndex)

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

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedParticipants(currentParticipants.map(p => p.id))
    } else {
      setSelectedParticipants([])
    }
  }

  const handleSelectParticipant = (id) => {
    if (selectedParticipants.includes(id)) {
      setSelectedParticipants(selectedParticipants.filter(pid => pid !== id))
    } else {
      setSelectedParticipants([...selectedParticipants, id])
    }
  }

  const handleOpenMathLetterModal = () => {
    if (selectedParticipants.length === 0) {
      alert('수학편지를 보낼 대상자를 선택해주세요.')
      return
    }
    setShowMathLetterModal(true)
  }

  const handleSendMathLetter = async () => {
    setSendingMathLetter(true)
    try {
      const selectedData = participants.filter(p => selectedParticipants.includes(p.id))
      let successCount = 0
      let failCount = 0

      for (const participant of selectedData) {
        const nextDay = participant.nextDay || 1
        const letterToSend = mathLetters.find(l => l.series.startsWith('K') && l.day_number === nextDay)

        if (!letterToSend) {
          console.warn(`[${participant.parent_name}] ${nextDay}일차 편지를 찾을 수 없습니다.`)
          failCount++
          continue
        }

        const baseUrl = window.location.origin
        const link = `${baseUrl}/math-letter-public?series=${letterToSend.series}&day=${letterToSend.day_number}`

        const response = await fetch('/api/send-alimtalk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: participant.phone.replace(/-/g, ''),
            templateCode: 'MATH_LETTER_DAILY',
            participant_id: participant.id,
            letter_id: letterToSend.id,
            sender_id: user.id,
            params: {
              title: letterToSend.title,
              url: link
            }
          }),
        })

        if (response.ok) {
          successCount++
        } else {
          failCount++
        }
      }

      alert(`발송 완료\n성공: ${successCount}건\n실패: ${failCount}건`)
      setShowMathLetterModal(false)
      setSelectedParticipants([])
      loadParticipants()
    } catch (error) {
      console.error('발송 중 오류:', error)
      alert('발송 중 오류가 발생했습니다.')
    } finally {
      setSendingMathLetter(false)
    }
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
        <div className="flex items-center justify-between mb-6">
          {/* 왼쪽: 나가기 */}
          <button
            onClick={() => onBack ? onBack() : window.history.back()}
            className="flex items-center text-teal-600 hover:text-teal-700"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span>나가기</span>
          </button>

          {/* 중앙: 로고 + 타이틀 */}
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="LAS Logo"
              className="h-10 w-10 sm:h-12 sm:w-12"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-teal-700 flex items-center gap-2">
                이벤트 참가자 관리
                {canViewMathLetterStats && (
                  <button
                    onClick={() => setShowMathLetterStatsModal(true)}
                    className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    title="수학편지 통계"
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>
                )}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {determinedViewMode === 'system' ? '전체 참가자 현황' :
                  determinedViewMode === 'admin' ? `${user.branch} 지점 참가자 현황` :
                    '나의 추천 참가자 현황'}
              </p>
            </div>
          </div>

          {/* 오른쪽: 빈 공간 (레이아웃 균형) */}
          <div className="w-20"></div>
        </div>

        {/* 통계 카드 (관리자용) */}
        {showFullData && (<>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <div className="text-blue-100 text-sm font-medium mb-1">전체 참가자</div>
                  <div className="text-3xl font-bold">{formatNumber(stats.total)}명</div>
                </div>
                <div className="p-2 bg-blue-500 rounded-lg bg-opacity-50">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-purple-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <div className="text-purple-100 text-sm font-medium mb-1">이번주 참가자</div>
                  <div className="text-3xl font-bold">{formatNumber(stats.thisWeek)}명</div>
                </div>
                <div className="p-2 bg-purple-500 rounded-lg bg-opacity-50">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-[#0090D4] rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <div className="text-blue-100 text-sm font-medium mb-1">남학생</div>
                  <div className="text-3xl font-bold">{formatNumber(stats.male)}명</div>
                </div>
                <div className="p-2 bg-blue-400 rounded-lg bg-opacity-50">
                  <User className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-[#E91E63] rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <div className="text-pink-100 text-sm font-medium mb-1">여학생</div>
                  <div className="text-3xl font-bold">{formatNumber(stats.female)}명</div>
                </div>
                <div className="p-2 bg-pink-400 rounded-lg bg-opacity-50">
                  <User className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-teal-700 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                연령 분포 (1~20세, 4개 구간)
              </h3>
              <div className="space-y-6">
                {ageDistribution.map((range, idx) => {
                  const malePercent = range.total > 0 ? Math.round((range.male / range.total) * 100) : 0
                  const femalePercent = range.total > 0 ? Math.round((range.female / range.total) * 100) : 0

                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="font-bold text-gray-700">{range.name.split('(')[0]} <span className="text-sm font-normal text-gray-500">({range.name.split('(')[1]}</span></span>
                        <span className="font-bold text-teal-600">총 {formatNumber(range.total)}명</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center">👦</span>
                        <span className="w-16">남학생</span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden flex relative">
                          {range.male > 0 && (
                            <div style={{ width: `${malePercent}%` }} className="h-full bg-[#0090D4] flex items-center justify-end px-2 text-white font-bold">
                              {range.male}명
                            </div>
                          )}
                        </div>
                        <span className="w-8 text-right text-gray-500">{malePercent}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center">👧</span>
                        <span className="w-16">여학생</span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden flex relative">
                          {range.female > 0 && (
                            <div style={{ width: `${femalePercent}%` }} className="h-full bg-[#E91E63] flex items-center justify-end px-2 text-white font-bold">
                              {range.female}명
                            </div>
                          )}
                        </div>
                        <span className="w-8 text-right text-gray-500">{femalePercent}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
              <div className="w-full text-left mb-4">
                <h3 className="text-lg font-bold text-teal-700 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                  </span>
                  성별 비율
                </h3>
              </div>

              <div className="relative w-64 h-64 mb-8">
                <div
                  className="w-full h-full rounded-full"
                  style={{
                    background: `conic-gradient(#E91E63 0% ${stats.total > 0 ? (stats.female / stats.total) * 100 : 50}%, #0090D4 ${stats.total > 0 ? (stats.female / stats.total) * 100 : 50}% 100%)`
                  }}
                ></div>
                <div className="absolute inset-10 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                  <span className="text-3xl font-bold text-teal-600">{formatNumber(stats.total)}</span>
                  <span className="text-gray-500 text-sm">총 참가자</span>
                </div>
              </div>

              <div className="w-full space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#0090D4]"></span>
                    <span className="font-bold text-gray-700">남학생</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#0090D4]">{formatNumber(stats.male)}명</div>
                    <div className="text-xs text-gray-500">{stats.total > 0 ? ((stats.male / stats.total) * 100).toFixed(1) : 0}%</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#E91E63]"></span>
                    <span className="font-bold text-gray-700">여학생</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#E91E63]">{formatNumber(stats.female)}명</div>
                    <div className="text-xs text-gray-500">{stats.total > 0 ? ((stats.female / stats.total) * 100).toFixed(1) : 0}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>)}

        {/* Top 랭킹 (관리자용) */}
        {showTopRankings && (
          <div className="grid grid-cols-1 gap-8 mb-10">
            <div>
              <h3 className="text-xl font-bold text-teal-800 flex items-center gap-2 mb-4">
                <Trophy className="w-6 h-6 text-yellow-500" />
                추천 매장 Top 12
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {topBranches.slice(0, 12).map((branch, idx) => {
                  let borderColor = 'border-teal-500';
                  let badgeColor = 'bg-teal-600';
                  let Icon = Store;
                  let iconColor = 'text-gray-400';

                  if (idx === 0) {
                    borderColor = 'border-yellow-400';
                    badgeColor = 'bg-yellow-400';
                    Icon = Medal;
                    iconColor = 'text-yellow-500';
                  } else if (idx === 1) {
                    borderColor = 'border-gray-400 shadow-sm';
                    badgeColor = 'bg-gray-400';
                    Icon = Medal;
                    iconColor = 'text-gray-500';
                  } else if (idx === 2) {
                    borderColor = 'border-orange-400 shadow-sm';
                    badgeColor = 'bg-orange-400';
                    Icon = Medal;
                    iconColor = 'text-orange-500';
                  }

                  const Badge = () => (
                    <div className={`absolute -top-3 -left-3 w-7 h-7 ${badgeColor} rounded-full flex items-center justify-center text-white font-bold shadow-md z-10`}>
                      {idx + 1}
                    </div>
                  );

                  return (
                    <div
                      key={idx}
                      onClick={() => handleCardFilterClick('branch', branch.branch)}
                      className={`relative bg-white rounded-xl border-2 ${borderColor} p-3 flex items-center justify-between shadow-sm cursor-pointer hover:scale-105 transition-transform overflow-visible h-14`}
                    >
                      <Badge />
                      <div className="flex items-center gap-3 ml-3">
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                        <span className="font-bold text-gray-800 text-sm">{branch.branch}</span>
                      </div>
                      <span className="font-bold text-teal-600 text-lg">{formatNumber(branch.count)}<span className="text-xs font-normal">명</span></span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2 mb-4 mt-8">
                <Award className="w-6 h-6 text-blue-500" />
                추천인 Top 12
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {topReferrers.slice(0, 12).map((referrer, idx) => {
                  let borderColor = 'border-blue-500';
                  let badgeColor = 'bg-blue-600';
                  let Icon = User;
                  let iconColor = 'text-gray-400';

                  if (idx === 0) {
                    borderColor = 'border-yellow-400';
                    badgeColor = 'bg-yellow-400';
                    Icon = Medal;
                    iconColor = 'text-yellow-500';
                  } else if (idx === 1) {
                    borderColor = 'border-gray-400 shadow-sm';
                    badgeColor = 'bg-gray-400';
                    Icon = Medal;
                    iconColor = 'text-gray-500';
                  } else if (idx === 2) {
                    borderColor = 'border-orange-400 shadow-sm';
                    badgeColor = 'bg-orange-400';
                    Icon = Medal;
                    iconColor = 'text-orange-500';
                  }

                  const Badge = () => (
                    <div className={`absolute -top-3 -left-3 w-7 h-7 ${badgeColor} rounded-full flex items-center justify-center text-white font-bold shadow-md z-10`}>
                      {idx + 1}
                    </div>
                  );

                  return (
                    <div
                      key={idx}
                      onClick={() => handleCardFilterClick('referrer', referrer.code)}
                      className={`relative bg-white rounded-xl border-2 ${borderColor} p-3 flex items-center justify-between shadow-sm cursor-pointer hover:scale-105 transition-transform overflow-visible h-14`}
                    >
                      <Badge />
                      <div className="flex items-center gap-3 ml-3 overflow-hidden">
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800 text-sm truncate">{referrer.name}</span>
                          <span className="text-[10px] text-gray-400 truncate">{referrer.branch}</span>
                        </div>
                      </div>
                      <span className="font-bold text-blue-600 text-lg shrink-0">{formatNumber(referrer.count)}<span className="text-xs font-normal">명</span></span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 필터 및 검색 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 지점 필터 (관리자용) */}
            {showFullData && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">지점</label>
                <select
                  value={filters.branch}
                  onChange={(e) => handleFilterChange('branch', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">전체 지점</option>
                  {branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 추천인 필터 */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">추천인</label>
              <select
                value={filters.referrer}
                onChange={(e) => handleFilterChange('referrer', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">전체 추천인</option>
                {referrers.map(referrer => (
                  <option key={referrer.referrer_code} value={referrer.referrer_code}>
                    {referrer.referrer_name}
                  </option>
                ))}
              </select>
            </div>

            {/* 날짜 필터 */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">시작일</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">종료일</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4 gap-2">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              초기화
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 text-sm text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-1"
            >
              <Search className="w-4 h-4" />
              검색
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            검색 결과 <span className="font-medium">{formatNumber(participants.length)}</span>건
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowMathLetterModal(true)}
              className="hidden items-center gap-2 px-4 py-2 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-500 transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              수학편지 발송
            </button>
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              엑셀 다운로드
            </button>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={currentParticipants.length > 0 && selectedParticipants.length === currentParticipants.length}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wide">신청일시</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wide">신청자코드</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wide">학부모명</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wide">연락처</th>
                  <th className="px-8 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wide">자녀정보</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wide">추천인</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wide">지점</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-700 uppercase tracking-wide">진도</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-700 uppercase tracking-wide">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentParticipants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(participant.id)}
                        onChange={() => handleSelectParticipant(participant.id)}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(participant.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                      {participant.subscriber_number || '-'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{participant.parent_name}</div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatPhone(participant.phone)}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{participant.child_age}세 / {participant.child_gender}</div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {participant.users?.name || participant.referrer_name}
                      </div>
                      <div className="text-xs text-gray-500">{participant.referrer_code}</div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                      {participant.users?.branch || '-'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-center">
                      {participant.lastSentDay ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {participant.lastSentDay}일차 완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          미발송
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleDeleteParticipant(participant.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {currentParticipants.length === 0 && (
                  <tr>
                    <td colSpan="10" className="px-6 py-10 text-center text-gray-500">
                      데이터가 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-700">
                  총 <span className="font-medium">{formatNumber(participants.length)}</span>명 중
                  <span className="font-medium"> {startIndex + 1}</span> -
                  <span className="font-medium"> {Math.min(endIndex, participants.length)}</span>
                </p>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e.target.value)}
                  className="ml-2 border-gray-300 rounded-md text-sm focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="10">10개씩</option>
                  <option value="30">30개씩</option>
                  <option value="50">50개씩</option>
                  <option value="100">100개씩</option>
                </select>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <ChevronsLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  {getPageNumbers().map(number => (
                    <button
                      key={number}
                      onClick={() => handlePageChange(number)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === number
                        ? 'z-10 bg-teal-50 border-teal-500 text-teal-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      {number}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <ChevronsRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* 수학편지 통계 모달 */}
        {showMathLetterStatsModal && (
          <MathLetterStatsModal
            user={user}
            onClose={() => setShowMathLetterStatsModal(false)}
          />
        )}

        {/* 수학편지 발송 모달 */}
        {showMathLetterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <MessageCircle className="w-6 h-6 text-yellow-500" />
                  수학편지 발송
                </h2>
                <button
                  onClick={() => setShowMathLetterModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-sm text-blue-800 mb-2">발송 대상: 총 {selectedParticipants.length}명</h3>
                  <div className="max-h-40 overflow-y-auto text-sm text-gray-600 space-y-1">
                    {participants
                      .filter(p => selectedParticipants.includes(p.id))
                      .map(p => (
                        <div key={p.id} className="flex justify-between">
                          <span>{p.parent_name} ({p.phone})</span>
                          <span className="font-medium text-blue-600">
                            {p.nextDay}일차 발송 예정
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm text-gray-700">
                    💡 각 참가자의 <strong>현재 진도에 맞춰 다음 단계 편지</strong>가 자동으로 발송됩니다.<br />
                    (예: 1일차 완료자 → 2일차 발송, 신규 → 1일차 발송)
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowMathLetterModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    disabled={sendingMathLetter}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSendMathLetter}
                    disabled={sendingMathLetter}
                    className="px-4 py-2 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-500 flex items-center gap-2"
                  >
                    {sendingMathLetter ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                        <span>발송 중...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>일괄 발송하기</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
