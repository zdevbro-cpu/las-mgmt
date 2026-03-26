'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Download, Copy, Check, Printer, QrCode as QrIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import QRCode from 'qrcode'

export default function MyQRCode({ user, onBack }) {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const canvasRef = useRef(null)

  // 사용자 정보
  const userName = user?.name || '사용자'
  const userBranch = user?.branch || '지점'
  const referralCode = user?.referral_code || 'LAS0000'
  
  // 기본 카드 모드 여부
  const [isIdentityCardMode, setIsIdentityCardMode] = useState(true)

  const eventUrl = selectedEvent 
    ? `${selectedEvent.landing_url}?ref=${referralCode}`
    : `https://lasmanager.vercel.app/event?ref=${referralCode}`

  useEffect(() => {
    fetchActiveEvents()
    
    // 초기 로드 시 기본 QR 명함 생성
    if (user) {
      setTimeout(() => generateIdentityCard(), 500)
    }
  }, [user])

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

  // 🪪 기본 본인 확인용 QR 명함 생성 (중항 로고 포함)
  const generateIdentityCard = async () => {
    try {
      setGenerating(true)
      setIsIdentityCardMode(true)
      
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')

      // 캔버스 크기 (카드 형태)
      canvas.width = 600
      canvas.height = 800

      // 1. 배경 (흰색)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 2. 상단 헤더 라인 (브랜드 컬러)
      ctx.fillStyle = '#249689'
      ctx.fillRect(0, 0, canvas.width, 100)

      // 3. 상단 로고
      const logoImg = new Image()
      logoImg.crossOrigin = 'anonymous'
      logoImg.src = '/images/logo.png'
      
      await new Promise((resolve) => {
        logoImg.onload = resolve
        logoImg.onerror = resolve
      })

      if (logoImg.complete && logoImg.naturalWidth > 0) {
        const logoTargetH = 50
        const logoTargetW = (logoImg.width / logoImg.height) * logoTargetH
        ctx.drawImage(logoImg, (canvas.width - logoTargetW) / 2, 25, logoTargetW, logoTargetH)
      } else {
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 30px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('LAS BOOK', canvas.width / 2, 60)
      }

      // 4. QR 코드 생성
      const qrData = referralCode
      const qrDataUrl = await QRCode.toDataURL(qrData, {
        width: 1000,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      })

      const qrImg = new Image()
      qrImg.src = qrDataUrl
      await new Promise((resolve) => qrImg.onload = resolve)

      const qrSize = 400
      const qrX = (canvas.width - qrSize) / 2
      const qrY = 180
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

      // 5. QR 중앙 로고 삽입
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        const logoSize = 80
        const logoX = qrX + (qrSize - logoSize) / 2
        const logoY = qrY + (qrSize - logoSize) / 2
        
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2 + 5, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
      }

      // 6. 하단 정보
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'center'
      
      ctx.font = 'bold 40px Malgun Gothic, sans-serif'
      ctx.fillText(userName, canvas.width / 2, 640)

      ctx.font = '30px Malgun Gothic, sans-serif'
      ctx.fillStyle = '#666666'
      ctx.fillText(userBranch, canvas.width / 2, 690)

      ctx.fillStyle = '#249689'
      ctx.font = 'bold 35px Roboto, sans-serif'
      ctx.fillText(referralCode, canvas.width / 2, 750)

      setGeneratedImageUrl(canvas.toDataURL('image/png'))
    } catch (error) {
      console.error('명함 생성 실패:', error)
    } finally {
      setGenerating(false)
    }
  }

  const generateQRWithTemplate = async (event) => {
    try {
      setGenerating(true)
      setIsIdentityCardMode(false)
      
      const canvas = canvasRef.current
      if (!canvas) throw new Error('Canvas not found')
      const ctx = canvas.getContext('2d')

      const templateImg = new Image()
      templateImg.crossOrigin = 'anonymous'
      await new Promise((resolve, reject) => {
        templateImg.onload = resolve
        templateImg.onerror = reject
        templateImg.src = event.template_image_url
      })

      canvas.width = templateImg.width
      canvas.height = templateImg.height
      ctx.drawImage(templateImg, 0, 0)

      const qrDataUrl = await QRCode.toDataURL(eventUrl, {
        width: 1000,
        margin: 1
      })

      const qrImg = new Image()
      qrImg.src = qrDataUrl
      await new Promise((resolve) => qrImg.onload = resolve)

      const position = event.qr_position
      const qrX = (position.x / 100) * canvas.width
      const qrY = (position.y / 100) * canvas.height
      const qrWidth = (position.width / 100) * canvas.width
      const qrHeight = (position.height / 100) * canvas.height

      ctx.drawImage(qrImg, qrX, qrY, qrWidth, qrHeight)

      setGeneratedImageUrl(canvas.toDataURL('image/png'))
      setSelectedEvent(event)
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
    link.download = isIdentityCardMode ? `직원QR_${userName}.png` : `이벤트QR_${referralCode}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printImage = () => {
    if (!generatedImageUrl) return
    const win = window.open('')
    win.document.write(`<img src="${generatedImageUrl}" style="width:100%; max-width:500px; display:block; margin:0 auto;">`)
    win.document.write('<script>window.onload = function() { window.print(); window.close(); }</script>')
  }

  const copyLink = () => {
    navigator.clipboard.writeText(eventUrl)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1.5 font-bold text-gray-600 hover:text-teal-600">
            <ArrowLeft size={20} />
            정보관리
          </button>
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <h1 className="text-lg font-bold text-teal-600">내 QR 코드</h1>
          </div>
          <div className="w-20"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 왼쪽: 미리보기 및 액션 */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              {generating ? (
                <div className="py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">QR 생성 중...</p>
                </div>
              ) : generatedImageUrl ? (
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm inline-block">
                    <img src={generatedImageUrl} alt="QR" className="w-full max-w-[300px] mx-auto" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={downloadImage} className="flex-1 py-3 bg-teal-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-teal-700">
                      <Download size={20} />
                      이미지 저장
                    </button>
                    <button onClick={printImage} className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-200">
                      <Printer size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-gray-400">
                  <QrIcon size={64} className="mx-auto mb-4" />
                  <p>QR 코드를 불러오는 중...</p>
                </div>
              )}
            </div>

            {/* 본인 정보 요약 */}
            <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between text-sm">
              <div>
                <p className="text-gray-500">사용자</p>
                <p className="font-bold">{userName}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500">고유코드</p>
                <p className="font-mono font-bold text-teal-600">{referralCode}</p>
              </div>
            </div>
          </div>

          {/* 오른쪽: 모드 선택 및 템플릿 */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h2 className="font-bold text-gray-700">📜 통합 관리</h2>
              </div>
              <div className="p-4 space-y-3">
                <button 
                  onClick={generateIdentityCard}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${isIdentityCardMode ? 'border-teal-500 bg-teal-50 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-teal-600">
                      <QrIcon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">담당자 확인용 QR</h3>
                      <p className="text-xs text-gray-500">내 정보를 담은 기본 QR 명함</p>
                    </div>
                  </div>
                </button>

                {events.length > 0 && (
                  <div className="pt-4 mt-4 border-t border-gray-100">
                    <h3 className="text-xs font-bold text-gray-500 mb-3 ml-1">이벤트 홍보용 템플릿</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {events.map(event => (
                        <button
                          key={event.id}
                          onClick={() => generateQRWithTemplate(event)}
                          className={`p-2 rounded-lg border text-xs text-left transition-all ${selectedEvent?.id === event.id ? 'border-teal-500 bg-teal-50' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                          <div className="aspect-video bg-gray-100 rounded mb-1 overflow-hidden">
                            <img src={event.template_image_url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <p className="font-medium truncate">{event.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
              <p className="text-xs text-yellow-800 leading-relaxed font-medium">
                💡 팁: 태블릿 대여 시 담당자 확인용 QR을 스캔하면 빠르게 처리할 수 있습니다. 이미지를 저장하여 휴대폰에 보관하세요.
              </p>
            </div>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}