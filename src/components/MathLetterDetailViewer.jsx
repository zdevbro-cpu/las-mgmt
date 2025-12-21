import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Play, X, AlertCircle } from 'lucide-react'

export default function MathLetterViewer() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [letterData, setLetterData] = useState(null)
  const [showVideo, setShowVideo] = useState(false)
  const [participantCode, setParticipantCode] = useState(null)

  useEffect(() => {
    loadLetterData()
  }, [])

  const loadLetterData = async () => {
    try {
      setLoading(true)
      
      // URL에서 토큰 추출
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')
      
      if (!token) {
        setError('유효하지 않은 접근입니다.')
        return
      }

      // 토큰 검증 및 디코딩 (실제로는 서버에서 검증해야 함)
      // 임시로 base64 디코딩
      try {
        const decoded = JSON.parse(atob(token))
        setParticipantCode(decoded.code)
        
        // 수학편지 데이터 조회
        const { data: letter, error: letterError } = await supabase
          .from('math_letters')
          .select('*')
          .eq('id', decoded.letterId)
          .single()

        if (letterError) throw letterError

        setLetterData(letter)

        // 접속 로그 기록
        await logAccess(decoded.code, decoded.letterId)

      } catch (decodeError) {
        console.error('토큰 디코딩 에러:', decodeError)
        setError('유효하지 않은 링크입니다.')
      }

    } catch (error) {
      console.error('데이터 로드 에러:', error)
      setError('수학편지를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const logAccess = async (participantCode, letterId) => {
    try {
      await supabase
        .from('math_letter_access_logs')
        .insert({
          participant_code: participantCode,
          letter_id: letterId,
          accessed_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('접속 로그 기록 에러:', error)
    }
  }

  const handleVideoPlay = () => {
    setShowVideo(true)
  }

  const handleVideoClose = () => {
    setShowVideo(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#249689' }}></div>
          <p className="text-gray-600">수학편지를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">오류</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="w-[420px] mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-8 h-8 object-contain"
            />
            <h1 className="font-bold text-3xl" style={{ color: '#249689' }}>
              LAS 수학편지
            </h1>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="w-[420px] mx-auto py-6">
        {/* 타이틀 영역 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4 mx-4">
          {/* 첫째 줄: #일차, 길이, 동영상 버튼 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="font-semibold">#{letterData.day_number}</span>
              <span>|</span>
              <span>영상재생: {letterData.duration ? `${Math.floor(letterData.duration / 60)}:${String(letterData.duration % 60).padStart(2, '0')}` : '-'}</span>
            </div>
            
            {/* 동영상 재생 버튼 (작게) */}
            {letterData.video_url && (
              <button
                onClick={handleVideoPlay}
                className="flex-shrink-0 px-3 py-1.5 rounded text-white flex items-center gap-1 hover:opacity-90 transition-opacity text-xs font-medium"
                style={{ backgroundColor: '#249689' }}
              >
                <Play className="w-3 h-3 fill-white" />
                수학편지영상
              </button>
            )}
          </div>

          {/* 둘째 줄: 타이틀 (전체 폭 사용) */}
          <h2 className="text-base font-semibold text-gray-800">
            {letterData.title}
          </h2>
        </div>

        {/* PDF 뷰어 영역 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mx-4">
          {/* PDF 표시 */}
          {letterData.pdf_url && (
            <div className="relative" style={{ minHeight: '400px' }}>
              <iframe
                src={`${letterData.pdf_url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                className="w-full"
                style={{ height: '50vh', minHeight: '400px' }}
                title="수학편지 PDF"
              />
            </div>
          )}
        </div>
      </div>

      {/* 동영상 모달 */}
      {showVideo && letterData.video_url && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl">
            {/* 닫기 버튼 */}
            <button
              onClick={handleVideoClose}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            {/* 동영상 플레이어 */}
            <div className="bg-black rounded-lg overflow-hidden">
              <video
                src={letterData.video_url}
                controls
                autoPlay
                className="w-full"
                style={{ maxHeight: '80vh' }}
              >
                브라우저가 비디오를 지원하지 않습니다.
              </video>
            </div>

            {/* 동영상 정보 */}
            <div className="mt-4 text-center">
              <p className="text-white font-semibold">{letterData.series} {letterData.day_number}일차</p>
              <p className="text-gray-300 text-sm">{letterData.title}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}