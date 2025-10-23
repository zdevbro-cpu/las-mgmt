import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function EventParticipantPage() {
  const { participantId } = useParams() // URL에서 참가자 ID 추출
  const navigate = useNavigate()
  const [participant, setParticipant] = useState(null)
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadParticipantData()
  }, [participantId])

  const loadParticipantData = async () => {
    try {
      // 1. 참가자 정보 조회
      const { data: participantData, error: participantError } = await supabase
        .from('event_participants')
        .select('*')
        .eq('id', participantId)
        .single()

      if (participantError) throw participantError
      setParticipant(participantData)

      // 2. 이벤트 정보 조회
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', participantData.event_id)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)
    } catch (err) {
      console.error('데이터 로드 실패:', err)
      setError('참가자 정보를 찾을 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleImageClick = () => {
    if (event?.landing_url) {
      // 랜딩 URL로 이동
      window.location.href = event.landing_url
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error || !participant || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <p className="text-red-600 text-lg mb-4">❌ {error || '참가자 정보를 찾을 수 없습니다.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      <div className="max-w-2xl mx-auto p-4">
        {/* 헤더 */}
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-teal-700 mb-2">
            🎉 {event.name}
          </h1>
          <p className="text-gray-600">
            {participant.customer_name}님의 이벤트 참여
          </p>
        </div>

        {/* 메인 이미지 카드 */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* 이미지 영역 - 클릭 가능 */}
          <div 
            onClick={handleImageClick}
            className="relative cursor-pointer group"
            style={{ minHeight: '400px' }}
          >
            <img 
              src={participant.generated_image_url} 
              alt={event.name}
              className="w-full h-auto transition-transform group-hover:scale-105"
              style={{ maxHeight: '80vh', objectFit: 'contain' }}
            />
            
            {/* 호버 시 표시되는 오버레이 */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white px-6 py-3 rounded-full shadow-lg">
                  <p className="text-teal-700 font-bold text-lg">
                    👆 클릭하여 이벤트 참여하기
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 하단 정보 영역 */}
          <div className="p-6 bg-gradient-to-r from-teal-500 to-blue-500 text-white">
            <div className="text-center space-y-3">
              <p className="text-sm opacity-90">
                이미지를 터치하시면 이벤트 페이지로 이동합니다
              </p>
              <button
                onClick={handleImageClick}
                className="w-full py-4 bg-white text-teal-600 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-lg text-lg"
              >
                🎁 이벤트 참여하기
              </button>
              
              {/* 이벤트 상세 정보 */}
              {event.description && (
                <div className="mt-4 pt-4 border-t border-white/30">
                  <p className="text-sm text-white/90">
                    {event.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 공유 버튼 (선택사항) */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: event.name,
                  text: `${participant.customer_name}님이 이벤트에 참여했어요!`,
                  url: window.location.href
                })
              } else {
                // 클립보드 복사
                navigator.clipboard.writeText(window.location.href)
                alert('링크가 복사되었습니다!')
              }
            }}
            className="px-6 py-3 bg-white text-teal-600 rounded-lg shadow-md hover:shadow-lg transition-all font-bold"
          >
            📤 공유하기
          </button>
        </div>

        {/* 푸터 */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>이 이미지는 {new Date(participant.created_at).toLocaleDateString('ko-KR')}에 생성되었습니다</p>
        </div>
      </div>
    </div>
  )
}