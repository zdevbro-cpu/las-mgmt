import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Search, Download, RotateCcw, TrendingUp, TrendingDown, Award } from 'lucide-react'

export default function MathLetterStatsModal({ user, onClose }) {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overall') // overall, referrer, letter, participant
  const [stats, setStats] = useState({
    totalSent: 0,
    totalAccessed: 0,
    uniqueAccessed: 0,
    accessRate: 0
  })
  const [referrerStats, setReferrerStats] = useState([])
  const [participantStats, setParticipantStats] = useState([])
  const [letterStats, setLetterStats] = useState([])
  const [selectedSeries, setSelectedSeries] = useState('전체')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('전체')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // 권한 확인
  const isSystemAdmin = user.user_type === '시스템관리자'
  const canViewData = 
    user.user_type === '시스템관리자' || 
    user.user_type === '점장' || 
    user.user_type === '지점관리자'

  useEffect(() => {
    if (canViewData) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      setLoading(true)

      // 1. 신청자 목록 조회
      let participantsQuery = supabase
        .from('event_participants')
        .select(`
          id,
          registration_source,
          subscriber_number,
          referrer_code,
          referrer_name,
          parent_name,
          child_gender,
          child_age,
          created_at,
          email,
          users!inner(branch)
        `)
        .eq('is_active', true)

      if (!isSystemAdmin) {
        participantsQuery = participantsQuery.eq('users.branch', user.branch)
      }

      const { data: participants, error: participantsError } = await participantsQuery
      if (participantsError) throw participantsError

      // 1-1. 추천인 정보 조회 (users 테이블에서)
      const referrerCodes = [...new Set(participants.map(p => p.referrer_code).filter(Boolean))]
      let referrersMap = new Map()
      
      if (referrerCodes.length > 0) {
        const { data: referrers, error: referrersError } = await supabase
          .from('users')
          .select('referral_code, name')
          .in('referral_code', referrerCodes)
        
        if (!referrersError && referrers) {
          referrers.forEach(r => {
            referrersMap.set(r.referral_code, r.name)
          })
        }
      }

      // 2. 접속 로그 조회
      const participantCodes = participants.map(p => p.registration_source)
      
      const { data: accessLogs, error: logsError } = await supabase
        .from('math_letter_access_logs')
        .select('*, math_letters(id, day_number, title, series)')
        .in('participant_code', participantCodes)

      if (logsError) throw logsError

      // 3. 전체 통계 계산
      const accessedCodes = new Set(accessLogs.map(log => log.participant_code))
      const totalSent = participants.length
      const uniqueAccessed = accessedCodes.size
      const accessRate = totalSent > 0 ? Math.round((uniqueAccessed / totalSent) * 100) : 0

      setStats({
        totalSent,
        totalAccessed: accessLogs.length,
        uniqueAccessed,
        accessRate
      })

      // 4. 추천인별 통계
      const referrerMap = new Map()
      
      participants.forEach(p => {
        if (!p.referrer_code) return // 추천인 코드가 없는 경우 제외
        
        const code = p.referrer_code
        const name = referrersMap.get(p.referrer_code) || p.referrer_name || '이름없음'
        
        if (!referrerMap.has(code)) {
          referrerMap.set(code, {
            code,
            name,
            totalSent: 0,
            accessed: 0,
            accessRate: 0
          })
        }
        
        const stat = referrerMap.get(code)
        stat.totalSent++
        
        if (accessedCodes.has(p.registration_source)) {
          stat.accessed++
        }
      })

      const referrerStatsArray = Array.from(referrerMap.values()).map(stat => ({
        ...stat,
        accessRate: stat.totalSent > 0 ? Math.round((stat.accessed / stat.totalSent) * 100) : 0
      })).sort((a, b) => b.totalSent - a.totalSent)

      setReferrerStats(referrerStatsArray)

      // 5. 편지별 통계
      const letterMap = new Map()
      
      accessLogs.forEach(log => {
        if (log.math_letters) {
          const letter = log.math_letters
          const key = `${letter.series}-${letter.day_number}`
          
          if (!letterMap.has(key)) {
            letterMap.set(key, {
              letterId: letter.id,
              series: letter.series,
              dayNumber: letter.day_number,
              title: letter.title,
              accessCount: 0,
              uniqueUsers: new Set()
            })
          }
          
          const stat = letterMap.get(key)
          stat.accessCount++
          stat.uniqueUsers.add(log.participant_code)
        }
      })

      const letterStatsArray = Array.from(letterMap.values()).map(stat => ({
        ...stat,
        uniqueUsers: stat.uniqueUsers.size
      })).sort((a, b) => b.accessCount - a.accessCount)

      setLetterStats(letterStatsArray)

      // 6. 신청자별 통계
      const participantStatsArray = participants.map(p => {
        const participantLogs = accessLogs.filter(log => log.participant_code === p.registration_source)
        const accessCount = participantLogs.length
        const lastAccess = participantLogs.sort((a, b) => new Date(b.accessed_at) - new Date(a.accessed_at))[0]

        return {
          code: p.registration_source,
          subscriberNumber: p.subscriber_number,
          referrerCode: p.referrer_code || '-',
          referrerName: p.referrer_code ? (referrersMap.get(p.referrer_code) || p.referrer_name || '-') : '-',
          parentName: p.parent_name,
          childGender: p.child_gender,
          childAge: p.child_age,
          email: p.email,
          branch: p.users?.branch,
          hasAccessed: accessCount > 0,
          accessCount,
          lastAccessAt: lastAccess?.accessed_at,
          createdAt: p.created_at
        }
      })

      setParticipantStats(participantStatsArray)

    } catch (error) {
      console.error('통계 조회 에러:', error)
      alert('통계를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // Top 12 추천인
  const top12Referrers = referrerStats.slice(0, 12)

  // 편지별 통계 필터링
  const filteredLetterStats = letterStats.filter(letter => {
    if (selectedSeries === '전체') return true
    return letter.series === selectedSeries
  })

  // Top 5 인기/저조 편지
  const topLetters = filteredLetterStats.slice(0, 5)
  const bottomLetters = [...filteredLetterStats].reverse().slice(0, 5)

  // 시리즈 목록
  const seriesList = ['전체', ...new Set(letterStats.map(l => l.series).filter(Boolean))]

  // 신청자 필터링
  const filteredParticipants = participantStats.filter(p => {
    const matchesSearch = 
      (p.subscriberNumber && p.subscriberNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.referrerName.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false

    if (filterStatus === '접속' && !p.hasAccessed) return false
    if (filterStatus === '미접속' && p.hasAccessed) return false

    return true
  })

  // 페이지네이션
  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedParticipants = filteredParticipants.slice(startIndex, startIndex + itemsPerPage)

  // 추천인별 페이지네이션
  const referrerTotalPages = Math.ceil(referrerStats.length / itemsPerPage)
  const referrerStartIndex = (currentPage - 1) * itemsPerPage
  const paginatedReferrers = referrerStats.slice(referrerStartIndex, referrerStartIndex + itemsPerPage)

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleExport = () => {
    const headers = ['신청자코드', '추천인코드', '추천인명', '학부모명', '성별', '나이', '접속여부', '접속횟수', '최근접속일시', '신청일시']
    const rows = filteredParticipants.map(p => [
      p.subscriberNumber || p.code,
      p.referrerCode,
      p.referrerName,
      p.parentName,
      p.childGender,
      p.childAge,
      p.hasAccessed ? 'O' : 'X',
      p.accessCount,
      formatDate(p.lastAccessAt),
      formatDate(p.createdAt)
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `수학편지통계_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (!canViewData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">접근 권한 없음</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600">수학편지 통계에 접근할 권한이 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full h-[90vh] flex flex-col">
        {/* 헤더 - 고정 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 font-bold hover:opacity-70 transition-opacity"
            style={{ color: '#249689', fontSize: '15px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            나가기
          </button>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-1">
              <img src="/images/logo.png" alt="LAS Logo" className="w-10 h-10 object-contain" />
              <h2 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>수학편지 통계</h2>
            </div>
            <p className="text-sm text-gray-500">
              {isSystemAdmin ? '전체 지점' : `${user.branch} 지점`}
            </p>
          </div>
          <div style={{ width: '80px' }}></div>
        </div>

        {/* 콘텐츠 - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              <p className="mt-4 text-gray-600">통계를 불러오는 중...</p>
            </div>
          ) : (
            <div className="p-6">
            {/* 핵심 지표 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border-2" style={{ borderColor: '#249689' }}>
                <div className="text-sm font-medium mb-1" style={{ color: '#249689' }}>총 발송</div>
                <div className="text-2xl font-bold" style={{ color: '#249689' }}>{stats.totalSent}</div>
              </div>
              <div className="bg-white rounded-lg p-4 border-2" style={{ borderColor: '#5B9BD5' }}>
                <div className="text-sm font-medium mb-1" style={{ color: '#5B9BD5' }}>접속 인원</div>
                <div className="text-2xl font-bold" style={{ color: '#5B9BD5' }}>{stats.uniqueAccessed}</div>
              </div>
              <div className="bg-white rounded-lg p-4 border-2 border-purple-400">
                <div className="text-sm text-purple-600 font-medium mb-1">총 접속</div>
                <div className="text-2xl font-bold text-purple-700">{stats.totalAccessed}</div>
              </div>
              <div className="bg-white rounded-lg p-4 border-2 border-orange-400">
                <div className="text-sm text-orange-600 font-medium mb-1">접속률</div>
                <div className="text-2xl font-bold text-orange-700">{stats.accessRate}%</div>
              </div>
            </div>

            {/* Top 12 추천인 카드 */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3" style={{ color: '#249689' }}>🏆 Top 12 추천인</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {top12Referrers.map((referrer, idx) => (
                  <div 
                    key={idx}
                    className="bg-white rounded-lg p-3 border-2 hover:shadow-md transition-shadow"
                    style={{ borderColor: idx < 3 ? '#FFD700' : '#249689' }}
                  >
                    <div className="grid grid-cols-3 gap-2">
                      {/* 좌측: 등수/추천인/코드 */}
                      <div className="col-span-1">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-lg font-bold" style={{ color: '#249689' }}>
                            {idx + 1}위
                          </span>
                          {idx < 3 && <Award className="w-4 h-4 text-yellow-500" />}
                        </div>
                        <div className="text-sm font-bold text-gray-800 truncate" title={referrer.name}>
                          {referrer.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate" title={referrer.code}>
                          {referrer.code}
                        </div>
                      </div>
                      
                      {/* 가운데: 라벨 */}
                      <div className="col-span-1 text-sm text-gray-600 flex flex-col justify-center">
                        <div className="mb-1">발송</div>
                        <div className="mb-1">접속</div>
                        <div>접속률</div>
                      </div>
                      
                      {/* 우측: 숫자 */}
                      <div className="col-span-1 text-sm flex flex-col justify-center items-end">
                        <div className="font-bold mb-1" style={{ color: '#249689' }}>
                          {referrer.totalSent}명
                        </div>
                        <div className="font-semibold text-green-600 mb-1">
                          {referrer.accessed}명
                        </div>
                        <div className={`font-semibold ${
                          referrer.accessRate >= 70 ? 'text-green-600' :
                          referrer.accessRate >= 40 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {referrer.accessRate}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 탭 메뉴 */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex gap-4">
                {[
                  { id: 'overall', label: '전체 통계' },
                  { id: 'referrer', label: '추천인별' },
                  { id: 'letter', label: '편지별' },
                  { id: 'participant', label: '신청자별' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setCurrentPage(1)
                    }}
                    className={`px-4 py-2 font-bold text-sm transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? 'text-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    style={activeTab === tab.id ? { 
                      backgroundColor: '#249689',
                      borderColor: '#249689'
                    } : {}}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 탭 콘텐츠 */}
            {activeTab === 'overall' && (
              <div>
                <h3 className="text-lg font-bold mb-3" style={{ color: '#249689' }}>📈 전체 현황</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 border" style={{ borderColor: '#249689' }}>
                    <h4 className="font-bold text-gray-700 mb-2 text-sm">발송 현황</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">총 발송 인원</span>
                        <span className="font-bold" style={{ color: '#249689' }}>{stats.totalSent}명</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">접속 인원</span>
                        <span className="font-bold text-green-600">{stats.uniqueAccessed}명</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">미접속 인원</span>
                        <span className="font-bold text-orange-600">{stats.totalSent - stats.uniqueAccessed}명</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border" style={{ borderColor: '#249689' }}>
                    <h4 className="font-bold text-gray-700 mb-2 text-sm">접속 현황</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">총 접속 수</span>
                        <span className="font-bold text-purple-600">{stats.totalAccessed}회</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">평균 접속률</span>
                        <span className="font-bold text-orange-600">{stats.accessRate}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">1인당 평균</span>
                        <span className="font-bold" style={{ color: '#249689' }}>
                          {stats.uniqueAccessed > 0 ? (stats.totalAccessed / stats.uniqueAccessed).toFixed(1) : 0}회
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'referrer' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold" style={{ color: '#249689' }}>👥 추천인별 상세 통계</h3>
                </div>
                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700">순위</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">추천인코드</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">추천인명</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700">발송</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700">접속</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700">미접속</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700">접속률</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {paginatedReferrers.map((stat, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                (referrerStartIndex + idx) < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {referrerStartIndex + idx + 1}위
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-800">{stat.code}</td>
                            <td className="px-4 py-3 text-gray-800">{stat.name}</td>
                            <td className="px-4 py-3 text-center text-gray-600">{stat.totalSent}</td>
                            <td className="px-4 py-3 text-center text-green-600 font-semibold">{stat.accessed}</td>
                            <td className="px-4 py-3 text-center text-orange-600">{stat.totalSent - stat.accessed}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                stat.accessRate >= 70 ? 'bg-green-100 text-green-700' :
                                stat.accessRate >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {stat.accessRate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 페이지네이션 */}
                {referrerTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      이전
                    </button>
                    <span className="text-sm text-gray-600">
                      {currentPage} / {referrerTotalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(referrerTotalPages, currentPage + 1))}
                      disabled={currentPage === referrerTotalPages}
                      className="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      다음
                    </button>
                  </div>
                )}

                <div className="mt-2 text-center text-sm text-gray-500">
                  총 {referrerStats.length}건
                </div>
              </div>
            )}

            {activeTab === 'letter' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold" style={{ color: '#249689' }}>📚 편지별 통계</h3>
                  <select
                    value={selectedSeries}
                    onChange={(e) => setSelectedSeries(e.target.value)}
                    className="px-4 py-2 border rounded-lg font-medium"
                    style={{ borderColor: '#249689' }}
                  >
                    {seriesList.map(series => (
                      <option key={series} value={series}>{series}</option>
                    ))}
                  </select>
                </div>

                {/* Top 5 인기 편지 */}
                <div className="mb-4">
                  <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    인기 Top 5
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {topLetters.map((letter, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-3 border-2 border-green-400">
                        <div className="text-base font-bold text-green-600 mb-1">{idx + 1}위</div>
                        <div className="text-xs font-semibold text-gray-800 mb-1">
                          {letter.series} {letter.dayNumber}일차
                        </div>
                        <div className="text-xs text-gray-500 mb-2 truncate">{letter.title}</div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">접속</span>
                          <span className="font-bold text-green-600">{letter.accessCount}회</span>
                        </div>
                        <div className="flex justify-between items-center text-xs mt-1">
                          <span className="text-gray-600">인원</span>
                          <span className="font-semibold text-gray-700">{letter.uniqueUsers}명</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top 5 저조 편지 */}
                <div>
                  <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm">
                    <TrendingDown className="w-4 h-4 text-orange-600" />
                    관심 필요 Top 5
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {bottomLetters.map((letter, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-3 border-2 border-orange-400">
                        <div className="text-base font-bold text-orange-600 mb-1">{idx + 1}위</div>
                        <div className="text-xs font-semibold text-gray-800 mb-1">
                          {letter.series} {letter.dayNumber}일차
                        </div>
                        <div className="text-xs text-gray-500 mb-2 truncate">{letter.title}</div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">접속</span>
                          <span className="font-bold text-orange-600">{letter.accessCount}회</span>
                        </div>
                        <div className="flex justify-between items-center text-xs mt-1">
                          <span className="text-gray-600">인원</span>
                          <span className="font-semibold text-gray-700">{letter.uniqueUsers}명</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'participant' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold" style={{ color: '#249689' }}>👤 신청자별 접속 현황</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-2 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-colors text-sm font-bold"
                      style={{ backgroundColor: '#5B9BD5' }}
                    >
                      <Download className="w-4 h-4" />
                      내보내기
                    </button>
                  </div>
                </div>

                {/* 검색 및 필터 */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="신청자코드, 학부모명, 추천인명 검색..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    {['전체', '접속', '미접속'].map(status => (
                      <button
                        key={status}
                        onClick={() => {
                          setFilterStatus(status)
                          setCurrentPage(1)
                        }}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          filterStatus === status
                            ? 'text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        style={filterStatus === status ? { backgroundColor: '#249689' } : {}}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 테이블 */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">신청자코드</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">추천인</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">학부모명</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700">성별</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700">나이</th>
                          {isSystemAdmin && (
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">지점</th>
                          )}
                          <th className="px-4 py-3 text-center font-semibold text-gray-700">접속</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700">횟수</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">최근 접속</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {paginatedParticipants.map((p, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-800 font-mono text-xs">{p.subscriberNumber || p.code}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">
                              <div>{p.referrerName}</div>
                              <div className="text-gray-400">{p.referrerCode}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-800">{p.parentName}</td>
                            <td className="px-4 py-3 text-center text-gray-600">{p.childGender}</td>
                            <td className="px-4 py-3 text-center text-gray-600">{p.childAge}세</td>
                            {isSystemAdmin && (
                              <td className="px-4 py-3 text-gray-600">{p.branch}</td>
                            )}
                            <td className="px-4 py-3 text-center">
                              {p.hasAccessed ? (
                                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                  O
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                                  X
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600">{p.accessCount}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">
                              {p.hasAccessed ? formatDate(p.lastAccessAt) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      이전
                    </button>
                    <span className="text-sm text-gray-600">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      다음
                    </button>
                  </div>
                )}

                <div className="mt-2 text-center text-sm text-gray-500">
                  총 {filteredParticipants.length}건
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  )
}