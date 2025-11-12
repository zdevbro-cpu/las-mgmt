import React, { useState, useEffect } from 'react'
import { Play, Download, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function MathLetterViewer() {
  const [letterData, setLetterData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showVideoModal, setShowVideoModal] = useState(false)

  useEffect(() => {
    loadLetterData()
  }, [])

  const loadLetterData = async () => {
    try {
      setLoading(true)
      
      // URL에서 파라미터 가져오기
      const urlParams = new URLSearchParams(window.location.search)
      const series = urlParams.get('series')
      const number = urlParams.get('number')

      if (!series || !number) {
        setError('잘못된 접근입니다.')
        setLoading(false)
        return
      }

      // Supabase에서 해당 수학편지 조회
      const { data, error: fetchError } = await supabase
        .from('math_letters')
        .select('*')
        .eq('series', series)
        .eq('letter_number', parseInt(number))
        .single()

      if (fetchError) throw fetchError

      if (!data) {
        setError('수학편지를 찾을 수 없습니다.')
        setLoading(false)
        return
      }

      setLetterData(data)
      
      // 접속 로그 기록 (선택사항)
      // logAccess(data.id)
      
    } catch (err) {
      console.error('수학편지 로드 오류:', err)
      if (err.code === 'PGRST116') {
        setError('수학편지를 찾을 수 없습니다.')
      } else {
        setError('수학편지를 불러오는데 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVideoPlay = () => {
    setShowVideoModal(true)
  }

  const handleDownloadPdf = () => {
    if (letterData?.pdf_url) {
      window.open(letterData.pdf_url, '_blank')
    }
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
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">오류</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 bg-white shadow-sm z-10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-2">
          <img 
            src="/images/logo.png" 
            alt="LAS Logo" 
            className="h-12 w-12"
          />
          <h1 className="text-xl font-bold text-teal-600">LAS 수학편지</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pb-20">
        {/* 타이틀 카드 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <div className="text-center">
            <div className="inline-block bg-teal-100 text-teal-800 px-4 py-1 rounded-full text-sm font-semibold mb-3">
              {letterData.series}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {letterData.letter_number}일차
            </h2>
            <p className="text-lg text-gray-700 mb-1">{letterData.title}</p>
            {letterData.description && (
              <p className="text-sm text-gray-500">{letterData.description}</p>
            )}
          </div>
        </div>

        {/* 동영상 재생 버튼 */}
        {letterData.video_url && (
          <button
            onClick={handleVideoPlay}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-md p-4 mb-4 flex items-center justify-center gap-3 transition-colors"
          >
            <Play className="w-6 h-6" />
            <span className="text-lg font-semibold">동영상 강의 보기</span>
          </button>
        )}

        {/* PDF 뷰어 */}
        {letterData.pdf_url && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
            <div className="aspect-[1/1.414] w-full">
              <iframe
                src={`${letterData.pdf_url}#view=FitH`}
                className="w-full h-full border-0"
                title="수학편지 PDF"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'flex items-center justify-center h-full bg-gray-100 text-gray-600';
                  errorDiv.textContent = 'PDF 파일을 찾을 수 없습니다';
                  e.target.parentNode.appendChild(errorDiv);
                }}
              />
            </div>
          </div>
        )}

        {/* PDF 다운로드 버튼 */}
        {letterData.pdf_url && (
          <button
            onClick={handleDownloadPdf}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg shadow p-4 flex items-center justify-center gap-3 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span className="font-semibold">PDF 다운로드</span>
          </button>
        )}
      </main>

      {/* 동영상 재생 모달 */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl">
            {/* 닫기 버튼 */}
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            {/* 동영상 플레이어 */}
            <div className="bg-black rounded-lg overflow-hidden">
              <video
                controls
                autoPlay
                className="w-full"
                poster={letterData.thumbnail_url}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'flex items-center justify-center h-64 bg-gray-900 text-white';
                  errorDiv.textContent = '동영상 파일을 찾을 수 없습니다';
                  e.target.parentNode.appendChild(errorDiv);
                }}
              >
                <source src={letterData.video_url} type="video/mp4" />
                브라우저가 비디오 재생을 지원하지 않습니다.
              </video>
            </div>

            {/* 타이틀 */}
            <div className="mt-4 text-center text-white">
              <p className="text-lg font-semibold">
                {letterData.series} {letterData.letter_number}일차
              </p>
              <p className="text-sm text-gray-300">{letterData.title}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}