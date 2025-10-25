'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Download, Copy, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import QRCode from 'qrcode'

export default function MyQRCode({ user, onBack }) {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [lastSavedUrl, setLastSavedUrl] = useState('') // 마지막 저장된 링크
  const canvasRef = useRef(null)

  // 사용자 정보
  const userName = user?.name || '사용자'
  const userBranch = user?.branch || '지점'
  const referralCode = user?.referral_code || 'LAS0000'
  
  // 선택된 이벤트의 landing_url 사용 (동적)
  const eventUrl = selectedEvent 
    ? `${selectedEvent.landing_url}?ref=${referralCode}`
    : lastSavedUrl || `https://lasmanager.vercel.app/event?ref=${referralCode}`

  useEffect(() => {
    fetchActiveEvents()
    
    // 마지막 저장된 링크 불러오기
    try {
      const savedData = localStorage.getItem(`lastQRLink_${user?.id}`)
      if (savedData) {
        const parsed = JSON.parse(savedData)
        setLastSavedUrl(parsed.url || '')
      }
    } catch (error) {
      console.log('링크 불러오기 실패:', error)
    }
  }, [])

  const fetchActiveEvents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('이벤트 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateQRWithTemplate = async (event) => {
    try {
      setGenerating(true)
      console.log('🎨 QR 코드 생성 시작')

      const canvas = canvasRef.current
      if (!canvas) throw new Error('Canvas not found')
      const ctx = canvas.getContext('2d')

      // 1. 템플릿 이미지 로드
      const templateImg = new Image()
      templateImg.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        templateImg.onload = resolve
        templateImg.onerror = reject
        templateImg.src = event.template_image_url
      })

      console.log('✅ 템플릿 이미지 로드:', templateImg.width, 'x', templateImg.height)

      // Canvas 크기 설정
      canvas.width = templateImg.width
      canvas.height = templateImg.height

      // 2. 템플릿 그리기
      ctx.drawImage(templateImg, 0, 0)

      // 3. QR 코드 생성
      const qrDataUrl = await QRCode.toDataURL(eventUrl, {
        width: 1000,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      // 4. QR 이미지 로드
      const qrImg = new Image()
      await new Promise((resolve, reject) => {
        qrImg.onload = resolve
        qrImg.onerror = reject
        qrImg.src = qrDataUrl
      })

      // 5. QR 위치 계산 (백분율 → 픽셀)
      const position = event.qr_position
      const qrX = (position.x / 100) * canvas.width
      const qrY = (position.y / 100) * canvas.height
      const qrWidth = (position.width / 100) * canvas.width
      const qrHeight = (position.height / 100) * canvas.height

      console.log('📍 QR 그리기:', { qrX, qrY, qrWidth, qrHeight })

      // 6. QR 코드 그리기
      ctx.drawImage(qrImg, qrX, qrY, qrWidth, qrHeight)

      // 7. 최종 이미지 생성
      const finalImageUrl = canvas.toDataURL('image/png')
      setGeneratedImageUrl(finalImageUrl)
      setSelectedEvent(event)
      
      // 마지막 생성 링크를 localStorage에 JSON으로 저장
      const newUrl = `${event.landing_url}?ref=${referralCode}`
      try {
        const saveData = {
          url: newUrl,
          eventId: event.id,
          eventName: event.name,
          timestamp: new Date().toISOString()
        }
        localStorage.setItem(`lastQRLink_${user?.id}`, JSON.stringify(saveData))
        setLastSavedUrl(newUrl)
      } catch (error) {
        console.log('링크 저장 실패:', error)
      }

      console.log('✅ QR 이미지 생성 완료')
    } catch (error) {
      console.error('QR 생성 실패:', error)
      alert('QR 코드 생성에 실패했습니다.')
    } finally {
      setGenerating(false)
    }
  }

  const downloadImage = () => {
    if (!generatedImageUrl) return
    
    const link = document.createElement('a')
    link.href = generatedImageUrl
    link.download = `내QR페이지_${referralCode}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(eventUrl)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-cyan-50 p-2 sm:p-2">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-lg p-2 sm:p-2 mb-2 sm:mb-3" style={{ borderRadius: '15px' }}>
          {/* 상단: 나가기 + 타이틀 */}
          <div className="grid grid-cols-3 items-center mb-2">
            <div className="flex justify-start">
              <button
                onClick={() => {
                  if (selectedEvent) {
                    // QR 생성 후: 템플릿 선택 화면으로 돌아가기
                    setSelectedEvent(null)
                    setGeneratedImageUrl(null)
                  } else {
                    // 템플릿 선택 전: 내QR페이지로 돌아가기
                    onBack()
                  }
                }}
                className="flex items-center gap-1.5 font-bold hover:opacity-70 transition-opacity text-sm sm:text-base"
                style={{ color: '#4A9B8E' }}
              >
                <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
                나가기
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <img 
                src="/images/logo.png" 
                alt="LAS Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain" 
                onError={(e) => e.target.style.display = 'none'} 
              />
              <h1 className="text-base sm:text-lg font-bold" style={{ color: '#249689', whiteSpace: 'nowrap' }}>
                내 QR페이지 만들기
              </h1>
            </div>
            
            <div></div>
          </div>

          {/* 안내 메시지 */}
          <div className="p-2 rounded-lg text-center" style={{ backgroundColor: '#f0f9ff', border: '2px solid #3b82f6', borderRadius: '10px' }}>
            <p className="text-xs font-medium" style={{ color: '#1e40af' }}>
              {!selectedEvent ? '🎨 템플릿을 선택하고 나만의 QR 페이지를 만드세요' : '🎉 주천 링크가 생성되었습니다!'}
            </p>
          </div>

          {/* 내 정보 + 링크복사 (템플릿 선택 전에만 표시) */}
          {!selectedEvent && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-3" style={{ borderRadius: '10px' }}>
              {/* 내 정보 - 1줄 가로 배치 */}
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm font-medium text-gray-700 px-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">👤 이름:</span>
                  <span className="font-bold text-gray-900">{userName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">🏢 지점:</span>
                  <span className="font-bold text-gray-900">{userBranch}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">🔖 고유번호:</span>
                  <span className="font-mono font-bold text-gray-900">{referralCode}</span>
                </div>
              </div>

              {/* 링크 복사 */}
              <div className="flex gap-2" style={{ width: '100%' }}>
                <input
                  type="text"
                  value={eventUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg"
                  style={{ borderRadius: '8px', minWidth: 0 }}
                  placeholder="내 주천 링크"
                />
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-all text-xs font-medium whitespace-nowrap"
                  style={{ backgroundColor: linkCopied ? '#10B981' : '#4A9B8E', borderRadius: '8px' }}
                >
                  {linkCopied ? (
                    <>
                      <Check size={14} />
                      <span>복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>복사</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 메인 컨텐츠 */}
        <div className="bg-white rounded-xl shadow-lg p-2 sm:p-2" style={{ borderRadius: '15px' }}>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div 
                className="animate-spin rounded-full h-12 w-12 border-b-2" 
                style={{ borderColor: '#4A9B8E' }}
              ></div>
            </div>
          ) : !selectedEvent ? (
            <>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h2 className="text-base sm:text-lg font-bold" style={{ color: '#4A9B8E' }}>
                  📋 템플릿 선택하기
                </h2>
                {events.length > 0 && (
                  <span className="text-xs text-gray-500">
                    총 {events.length}개
                  </span>
                )}
              </div>

              {events.length === 0 ? (
                <div className="text-center py-16 sm:py-8">
                  <div className="text-5xl sm:text-6xl mb-2">📅</div>
                  <p className="text-sm sm:text-base text-gray-600 mb-2">활성화된 템플릿이 없습니다</p>
                  <p className="text-xs text-gray-400">관리자에게 문의해주세요</p>
                </div>
              ) : (
                // 심플 그리드: 모바일 1열, 태블릿 2열, PC 3열
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => generateQRWithTemplate(event)}
                      className="group cursor-pointer border-2 rounded-xl overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300"
                      style={{ borderColor: '#E0E0E0', borderRadius: '12px' }}
                    >
                      {/* 템플릿 이미지 */}
                      {event.template_image_url && (
                        <div className="relative overflow-hidden" style={{ backgroundColor: '#f5f5f5' }}>
                          <img
                            src={event.template_image_url}
                            alt={event.name}
                            className="w-full h-auto object-cover group-hover:opacity-90 transition-opacity"
                            style={{ maxHeight: '100px' }}
                          />
                          {/* 호버 오버레이 */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                            <span className="text-white font-bold text-sm sm:text-base opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 px-4 py-2 rounded-lg">
                              선택하기
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* 템플릿 정보 */}
                      <div className="p-2 sm:p-2">
                        <h3 className="font-bold mb-1 text-sm sm:text-base" style={{ color: '#249689' }}>
                          {event.name}
                        </h3>
                        {event.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* QR 생성 완료 화면 */}
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h2 className="text-base sm:text-lg font-bold" style={{ color: '#4A9B8E' }}>
                  🎉 내 QR 페이지
                </h2>
                <button
                  onClick={() => {
                    setSelectedEvent(null)
                    setGeneratedImageUrl(null)
                  }}
                  className="text-xs text-gray-600 hover:text-gray-900 font-medium"
                >
                  ← 다른 템플릿 선택
                </button>
              </div>

              {generating ? (
                <div className="text-center py-2 sm:py-6">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 mx-auto mb-2" style={{ borderColor: '#4A9B8E' }}></div>
                  <p className="text-sm sm:text-base text-gray-600 font-medium">QR 이미지 생성 중...</p>
                  <p className="text-xs text-gray-400 mt-2">잠시만 기다려주세요</p>
                </div>
              ) : generatedImageUrl ? (
                <div className="space-y-2 sm:space-y-3">
                  {/* 생성된 이미지 */}
                  <div className="border-4 rounded-xl overflow-hidden shadow-lg" style={{ borderColor: '#4A9B8E', borderRadius: '12px' }}>
                    <img
                      src={generatedImageUrl}
                      alt="내 QR 페이지"
                      className="w-full h-auto" style={{ maxWidth: "300px", margin: "0 auto" }}
                    />
                  </div>

                  {/* 내 정보 */}
                  <div className="p-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg" style={{ borderRadius: '10px' }}>
                    <div className="text-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">👤 이름</span>
                        <span className="font-medium">{userName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">🏢 지점</span>
                        <span className="font-medium">{userBranch}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">🔖 고유번호</span>
                        <span className="font-mono font-medium">{referralCode}</span>
                      </div>
                    </div>
                  </div>

                  {/* 메인 액션: 다운로드 (크게) */}
                  <button
                    onClick={downloadImage}
                    className="w-full py-2 flex items-center justify-center gap-2 text-white rounded-xl hover:opacity-90 font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all"
                    style={{ backgroundColor: '#5B9BD5', borderRadius: '12px' }}
                  >
                    <Download size={22} />
                    내 QR페이지 저장
                  </button>

                  {/* 보조 액션들 */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    {/* 링크 복사 */}
                    <div>
                      <p className="text-xs text-gray-600 mb-2">🔗 내 주천 링크</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={eventUrl}
                          readOnly
                          className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg"
                          style={{ borderRadius: '8px' }}
                        />
                        <button
                          onClick={copyLink}
                          className="flex items-center gap-1.5 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-all text-sm font-medium"
                          style={{ backgroundColor: linkCopied ? '#10B981' : '#4A9B8E', borderRadius: '8px' }}
                        >
                          {linkCopied ? <Check size={16} /> : <Copy size={16} />}
                          {linkCopied ? '복사됨' : '복사'}
                        </button>
                      </div>
                    </div>

                    {/* 사용 팁 */}
                    <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200" style={{ borderRadius: '8px' }}>
                      <p className="text-xs text-yellow-800 font-medium mb-1">💡 사용 방법:</p>
                      <ul className="text-xs text-yellow-700 space-y-1 ml-4">
                        <li>• QR 페이지를 생성하여 이미지로 전달하거나</li>
                        <li>• 참가자가 QR 코드를 스캔하면 자동으로 내 고유코드로 연결됩니다</li>
                        <li>• 링크를 복사해 카톡/문자로 전달할 수도 있습니다</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* 숨겨진 Canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}