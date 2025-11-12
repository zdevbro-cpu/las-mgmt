import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Play, X, Download, AlertCircle } from 'lucide-react'

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

  const handleDownloadPDF = () => {
    if (letterData?.pdf_url) {
      window.open(letterData.pdf_url, '_blank')
    }
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
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-8 h-8 object-contain"
            />
            <h1 className="font-bold text-xl" style={{ color: '#249689' }}>
              LAS 수학편지
            </h1>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 타이틀 카드 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <div className="text-center">
            <div className="inline-block px-4 py-1 rounded-full text-sm font-semibold mb-3" 
                 style={{ backgroundColor: '#E6F7F5', color: '#249689' }}>
              {letterData.series}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {letterData.day_number}일차
            </h2>
            <p className="text-gray-600">{letterData.title}</p>
          </div>
        </div>

        {/* PDF 뷰어 영역 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* 동영상 재생 버튼 (PDF 상단) */}
          {letterData.video_url && (
            <div className="relative bg-gradient-to-b from-gray-900 to-transparent">
              <button
                onClick={handleVideoPlay}
                className="w-full py-6 flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#249689' }}
              >
                <Play className="w-8 h-8 text-white fill-white" />
                <span className="text-white font-bold text-lg">동영상 강의 보기</span>
                {letterData.duration && (
                  <span className="text-white text-sm opacity-90">
                    ({Math.floor(letterData.duration / 60)}:{String(letterData.duration % 60).padStart(2, '0')})
                  </span>
                )}
              </button>
            </div>
          )}

          {/* PDF 표시 */}
          {letterData.pdf_url && (
            <div className="relative" style={{ minHeight: '600px' }}>
              <iframe
                src={`${letterData.pdf_url}#toolbar=0&navpanes=0&scrollbar=1`}
                className="w-full"
                style={{ height: '80vh', minHeight: '600px' }}
                title="수학편지 PDF"
              />
            </div>
          )}

          {/* PDF 다운로드 버튼 */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={handleDownloadPDF}
              className="w-full py-3 px-4 rounded-lg font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#5B9BD5' }}
            >
              <Download className="w-5 h-5" />
              PDF 다운로드
            </button>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-4 p-4 rounded-lg text-sm text-gray-600 text-center" style={{ backgroundColor: '#F0F9FF' }}>
          💡 PDF를 저장하여 반복 학습하세요!
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