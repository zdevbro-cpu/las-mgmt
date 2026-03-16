import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BookOpen, Play, Lock, AlertCircle, CheckCircle } from 'lucide-react'

export default function MathLetterPublicViewer() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [participantData, setParticipantData] = useState(null)
  const [letters, setLetters] = useState([])
  const [referrerName, setReferrerName] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // URL에서 토큰 추출
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')
      
      if (!token) {
        setError('유효하지 않은 접근입니다.')
        return
      }

      // 토큰 디코딩
      let decoded
      try {
        decoded = JSON.parse(atob(token))
      } catch (decodeError) {
        console.error('토큰 디코딩 에러:', decodeError)
        setError('유효하지 않은 링크입니다.')
        return
      }

      if (!decoded.code) {
        setError('유효하지 않은 링크입니다.')
        return
      }

      // 신청자 정보 조회
      const { data: participant, error: participantError } = await supabase
        .from('event_participants')
        .select('*')
        .eq('subscriber_number', decoded.code)
        .eq('is_active', true)
        .single()

      if (participantError) {
        console.error('신청자 조회 에러:', participantError)
        setError('신청자 정보를 찾을 수 없습니다.')
        return
      }

      setParticipantData(participant)

      // 추천인 정보 조회 (referrer_code로 users 테이블에서 조회)
      if (participant.referrer_code) {
        const { data: referrer } = await supabase
          .from('users')
          .select('brname')
          .eq('brcode', participant.referrer_code)
          .single()

        if (referrer) {
          setReferrerName(referrer.brname)
        }
      }

      // "K2-01"에서 "K2"만 추출
      const seriesOnly = participant.current_math_letter.split('-')[0]

      // 해당 시리즈의 수학편지 목록 조회
      const { data: mathLetters, error: lettersError } = await supabase
        .from('math_letters')
        .select('*')
        .eq('series', seriesOnly)
        .order('day_number', { ascending: true })

      if (lettersError) {
        console.error('수학편지 조회 에러:', lettersError)
        setError('수학편지를 불러오는데 실패했습니다.')
        return
      }

      setLetters(mathLetters || [])

    } catch (error) {
      console.error('데이터 로드 에러:', error)
      setError('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleLetterClick = async (letter) => {
    // 토큰 생성 (신청자 코드 + 수학편지 ID)
    const token = btoa(JSON.stringify({
      code: participantData.subscriber_number,
      letterId: letter.id,
      timestamp: new Date().toISOString()
    }))

    // 상세 페이지로 이동 (접속 로그는 상세 페이지에서 기록)
    window.location.href = `/math-letter-view?token=${token}`
  }

  const isLetterAccessible = (dayNumber) => {
    // current_day 이하만 접근 가능
    return dayNumber <= (participantData?.current_day || 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">수학편지를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">오류</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 bg-white shadow-sm z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col items-center gap-2">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="h-12 w-12"
            />
            <h1 className="text-xl font-bold text-teal-600">LAS 수학편지</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pb-20">
        {/* 신청자 정보 카드 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-center mb-4">
            <div className="inline-block bg-teal-100 text-teal-800 px-4 py-1 rounded-full text-sm font-semibold mb-2">
              {participantData.current_math_letter}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {participantData.parent_name}님
            </h2>
            <p className="text-gray-600 mb-2">
              {participantData.child_age}세 ({participantData.child_gender}) 자녀
            </p>
            {referrerName && (
              <p className="text-sm text-gray-500">
                추천: {referrerName}
              </p>
            )}
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">현재 진행</p>
            <p className="text-3xl font-bold text-teal-600">
              {participantData.current_day}일차
            </p>
          </div>
        </div>

        {/* 수학편지 목록 */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900 mb-4">수학편지 목록</h3>
          
          {letters.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">등록된 수학편지가 없습니다.</p>
            </div>
          ) : (
            letters.map((letter) => {
              const isAccessible = isLetterAccessible(letter.day_number)
              
              return (
                <div
                  key={letter.id}
                  onClick={() => isAccessible && handleLetterClick(letter)}
                  className={`bg-white rounded-lg shadow-md p-4 transition-all ${
                    isAccessible 
                      ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' 
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* 일차 번호 */}
                    <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center ${
                      isAccessible 
                        ? 'bg-teal-100 text-teal-700' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <span className="text-xl font-bold">{letter.day_number}</span>
                    </div>

                    {/* 내용 */}
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">
                        {letter.day_number}일차
                      </h4>
                      <p className="text-gray-700 mb-1">{letter.title}</p>
                      {letter.description && (
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {letter.description}
                        </p>
                      )}
                      
                      {/* 아이콘 */}
                      <div className="flex items-center gap-2 mt-2">
                        {letter.video_url && (
                          <div className="flex items-center gap-1 text-xs text-teal-600">
                            <Play className="w-3 h-3" />
                            <span>동영상</span>
                          </div>
                        )}
                        {letter.pdf_url && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <BookOpen className="w-3 h-3" />
                            <span>PDF</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 상태 아이콘 */}
                    <div className="flex-shrink-0">
                      {isAccessible ? (
                        <CheckCircle className="w-6 h-6 text-teal-600" />
                      ) : (
                        <Lock className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 text-center">
            💡 매일 새로운 수학편지가 열립니다!
          </p>
        </div>
      </main>
    </div>
  )
}