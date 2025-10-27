import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { validateReferralCodeFormat } from '../../constants/roles'

export default function EventLandingPage() {
  const [formData, setFormData] = useState({
    parentName: '',
    phone: '',
    childGender: '',
    childAge: '',
    inquiry: '',
    referrerCode: '',
    privacyAgreed: false,
    marketingAgreed: false
  })
  const [loading, setLoading] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [referralLink, setReferralLink] = useState('')
  const [isFromReferralLink, setIsFromReferralLink] = useState(false)
  const [referralCodeError, setReferralCodeError] = useState('')
  const [referrerName, setReferrerName] = useState('')
  const [showVideoModal, setShowVideoModal] = useState(false)
  
  // 🔒 접근 제어 상태
  const [accessDenied, setAccessDenied] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  
  // MP4 영상 파일 경로 (public 폴더 기준)
  const sampleVideoUrl = "/videos/mathletter.mp4"

  // 🔒 무조건 추천인 링크 필수 - URL 파라미터 검증
  useEffect(() => {
    const validateAccess = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const refCode = params.get('ref')
        
        // ref 파라미터 없으면 무조건 차단
        if (!refCode) {
          console.log('❌ 접근 차단: ref 파라미터 없음')
          setAccessDenied(true)
          setIsValidating(false)
          return
        }
        
        // ref 파라미터가 있으면 DB에서 검증
        console.log('🔍 추천인 코드 검증 중:', refCode)
        const verification = await verifyReferralCodeExists(refCode)
        
        if (verification.exists && verification.referrerName) {
          // 유효한 추천인 코드
          console.log('✅ 유효한 추천인:', verification.referrerName)
          setFormData(prev => ({ ...prev, referrerCode: refCode }))
          setReferrerName(verification.referrerName)
          setIsFromReferralLink(true)
          setAccessDenied(false)
        } else {
          // 무효한 추천인 코드
          console.log('❌ 접근 차단: 유효하지 않은 추천인 코드')
          setAccessDenied(true)
        }
        
        setIsValidating(false)
      } catch (err) {
        console.error('❌ 접근 검증 오류:', err)
        setAccessDenied(true)
        setIsValidating(false)
      }
    }
    
    validateAccess()
  }, [])

  // 영상 프리로드
  useEffect(() => {
    if (accessDenied) return
    
    const preloadLink = document.createElement('link')
    preloadLink.rel = 'preload'
    preloadLink.as = 'video'
    preloadLink.href = sampleVideoUrl
    document.head.appendChild(preloadLink)
    
    const preloadVideo = document.createElement('video')
    preloadVideo.src = sampleVideoUrl
    preloadVideo.preload = 'auto'
    preloadVideo.muted = true
    preloadVideo.style.display = 'none'
    preloadVideo.style.position = 'absolute'
    preloadVideo.style.pointerEvents = 'none'
    document.body.appendChild(preloadVideo)
    
    preloadVideo.load()
    
    preloadVideo.addEventListener('loadeddata', () => {
      console.log('✅ 영상 프리로드 완료')
    })
    
    preloadVideo.addEventListener('error', (e) => {
      console.error('❌ 영상 로드 실패:', e)
    })
    
    return () => {
      document.head.removeChild(preloadLink)
      document.body.removeChild(preloadVideo)
    }
  }, [accessDenied])

  const handleReferrerCodeChange = (e) => {
    const value = e.target.value.toUpperCase()
    
    setFormData(prev => ({
      ...prev,
      referrerCode: value
    }))

    if (value.trim() !== '') {
      const validation = validateReferralCodeFormat(value)
      if (!validation.isValid) {
        setReferralCodeError(validation.error)
      } else {
        setReferralCodeError('')
      }
    } else {
      setReferralCodeError('')
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData({ ...formData, phone: formatted })
  }

  const handleGenerateQR = () => {
    if (!formData.referrerCode.trim()) {
      alert('추천인 코드를 입력해주세요')
      return
    }

    const validation = validateReferralCodeFormat(formData.referrerCode)
    if (!validation.isValid) {
      alert(validation.error)
      return
    }

    const baseUrl = window.location.origin + window.location.pathname
    const link = `${baseUrl}?ref=${encodeURIComponent(formData.referrerCode.trim())}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`
    
    setReferralLink(link)
    setQrCodeUrl(qrUrl)
    setShowQRModal(true)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      alert('링크가 복사되었습니다!')
    }).catch(() => {
      prompt('링크를 복사하세요:', referralLink)
    })
  }

  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: '수학편지 신청',
        text: '아이들의 인생을 수학으로 디자인하자!',
        url: referralLink
      }).catch(err => console.log('공유 취소:', err))
    } else {
      handleCopyLink()
    }
  }

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `QR_${formData.referrerCode}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('QR 다운로드 오류:', error)
      alert('QR 코드 다운로드에 실패했습니다.')
    }
  }

  const validateForm = () => {
    if (!formData.parentName.trim()) {
      alert('학부모 이름을 입력해주세요')
      return false
    }
    if (!formData.phone || formData.phone.replace(/[^\d]/g, '').length !== 11) {
      alert('휴대전화 번호를 정확히 입력해주세요')
      return false
    }
    if (!formData.childGender) {
      alert('자녀 성별을 선택해주세요')
      return false
    }
    if (!formData.childAge || formData.childAge < 1 || formData.childAge > 20) {
      alert('자녀 연령을 정확히 입력해주세요 (1-20세)')
      return false
    }
    if (!formData.privacyAgreed) {
      alert('개인정보 수집 및 이용에 동의해주세요')
      return false
    }

    if (formData.referrerCode.trim()) {
      const validation = validateReferralCodeFormat(formData.referrerCode)
      if (!validation.isValid) {
        alert(validation.error)
        return false
      }
    }

    return true
  }

  const verifyReferralCodeExists = async (code) => {
    if (!code || code.trim() === '') {
      return { exists: false, referrerId: null }
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, branch, referral_code')
        .eq('referral_code', code.trim().toUpperCase())
        .single()

      if (error || !data) {
        return { exists: false, referrerId: null, referrerName: null }
      }

      return { 
        exists: true, 
        referrerId: data.id,
        referrerName: data.name,
        referrerBranch: data.branch
      }
    } catch (error) {
      console.error('추천인 코드 검증 오류:', error)
      return { exists: false, referrerId: null, referrerName: null }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      let referrerId = null
      if (formData.referrerCode.trim()) {
        const verification = await verifyReferralCodeExists(formData.referrerCode)
        if (!verification.exists) {
          alert('존재하지 않는 추천인 코드입니다.')
          setLoading(false)
          return
        }
        referrerId = verification.referrerId
      }

      const { data, error } = await supabase
        .from('event_applications')
        .insert([{
          parent_name: formData.parentName,
          phone: formData.phone.replace(/[^\d]/g, ''),
          child_gender: formData.childGender,
          child_age: parseInt(formData.childAge),
          inquiry: formData.inquiry || null,
          referrer_code: formData.referrerCode.trim() || null,
          referrer_id: referrerId,
          privacy_agreed: formData.privacyAgreed,
          marketing_agreed: formData.marketingAgreed
        }])
        .select()

      if (error) throw error

      setSubmitted(true)
      alert('신청이 완료되었습니다!')
      
      setFormData({
        parentName: '',
        phone: '',
        childGender: '',
        childAge: '',
        inquiry: '',
        referrerCode: isFromReferralLink ? formData.referrerCode : '',
        privacyAgreed: false,
        marketingAgreed: false
      })

    } catch (error) {
      console.error('신청 오류:', error)
      alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  // 🔒 검증 중 화면
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0fffe' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#249689' }}></div>
          <p style={{ color: '#249689', fontSize: '16px' }}>링크 검증 중...</p>
        </div>
      </div>
    )
  }

  // 🔒 접근 차단 화면
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f0fffe' }}>
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-full" style={{ backgroundColor: '#fee' }}>
              <svg className="w-12 h-12" style={{ color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="font-bold mb-3" style={{ color: '#249689', fontSize: '24px' }}>
              접근이 제한되었습니다
            </h2>
            <p className="text-gray-600 mb-2" style={{ fontSize: '15px' }}>
              이 페이지는 초대 링크를 통해서만 접근할 수 있습니다.
            </p>
            <p className="text-gray-500 text-sm">
              추천인으로부터 받은 링크나 QR코드를 통해 다시 접속해주세요.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-600 mb-2">💡 올바른 접근 방법</p>
            <ul className="text-xs text-left space-y-1" style={{ color: '#666' }}>
              <li>✓ 추천인에게 받은 QR코드 스캔</li>
              <li>✓ 추천인에게 받은 링크 클릭</li>
              <li>✓ 카카오톡 등으로 공유받은 링크 사용</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-yellow-800">
              <strong>⚠️ 주의:</strong> 직접 URL 입력이나 북마크로는 접근할 수 없습니다.
            </p>
          </div>

          <button
            onClick={() => window.history.back()}
            className="w-full py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#249689' }}
          >
            이전 페이지로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  // ✅ 정상 접근 - 신청 완료 화면
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f0fffe' }}>
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-full" style={{ backgroundColor: '#d1fae5' }}>
              <svg className="w-12 h-12" style={{ color: '#249689' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-bold mb-3" style={{ color: '#249689', fontSize: '24px' }}>
              신청 완료!
            </h2>
            <p className="text-gray-600" style={{ fontSize: '15px' }}>
              수학편지 이벤트 신청이 완료되었습니다.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 mb-3">
              담당자가 곧 연락드릴 예정입니다.
            </p>
            {referrerName && (
              <p className="text-xs text-gray-600">
                추천인: <span className="font-bold">{referrerName}</span>
              </p>
            )}
          </div>

          <button
            onClick={() => {
              setSubmitted(false)
            }}
            className="w-full py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#249689' }}
          >
            추가 신청하기
          </button>
        </div>
      </div>
    )
  }

  // ✅ 정상 접근 - 신청 폼
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f0fffe' }}>
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
        
        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img 
              src="/las-logo.png" 
              alt="LAS Logo" 
              className="h-16"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
          <p className="text-sm mb-3" style={{ color: '#249689' }}>
            LAS 매장관리 시스템에 오신것을 환영합니다.
          </p>
          <h1 className="font-bold mb-2" style={{ color: '#249689', fontSize: '32px' }}>
            수학편지 신청
          </h1>
          
          {referrerName && (
            <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: '#e0f2f1' }}>
              <p className="text-sm" style={{ color: '#249689' }}>
                <span className="font-bold">{referrerName}</span>님의 추천으로 신청하시는군요! 🎉
              </p>
            </div>
          )}
        </div>

        {/* 샘플 영상 섹션 */}
        <div className="mb-6">
          <button
            onClick={() => setShowVideoModal(true)}
            className="w-full relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow"
            style={{ aspectRatio: '16/9' }}
          >
            <img 
              src="/event-thumbnail.jpg" 
              alt="수학편지 소개 영상" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.style.backgroundColor = '#249689'
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <div className="text-center text-white">
                <div className="w-16 h-16 mx-auto mb-2 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" style={{ color: '#249689' }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
                <p className="text-sm font-bold">소개 영상 보기</p>
              </div>
            </div>
          </button>
        </div>

        {/* 폼 */}
        <div className="space-y-4">
          {/* 학부모 이름 */}
          <div>
            <label className="flex items-center gap-1 mb-2 font-semibold" style={{ color: '#000000', fontSize: '15px' }}>
              <svg className="w-5 h-5" style={{ color: '#249689' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              학부모 이름 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              name="parentName"
              value={formData.parentName}
              onChange={handleChange}
              placeholder="이름을 입력해주세요"
              className="w-full px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px', fontSize: '15px' }}
              required
            />
          </div>

          {/* 휴대전화 */}
          <div>
            <label className="flex items-center gap-1 mb-2 font-semibold" style={{ color: '#000000', fontSize: '15px' }}>
              <svg className="w-5 h-5" style={{ color: '#249689' }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              휴대전화 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="010-0000-0000"
              maxLength="13"
              className="w-full px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px', fontSize: '15px' }}
              required
            />
          </div>

          {/* 자녀 성별 & 연령 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-2 font-semibold" style={{ color: '#000000', fontSize: '15px' }}>
                자녀 성별 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                name="childGender"
                value={formData.childGender}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '15px' }}
                required
              >
                <option value="">선택</option>
                <option value="male">남아</option>
                <option value="female">여아</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold" style={{ color: '#000000', fontSize: '15px' }}>
                자녀 연령 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                name="childAge"
                value={formData.childAge}
                onChange={handleChange}
                placeholder="나이"
                min="1"
                max="20"
                className="w-full px-4 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '15px' }}
                required
              />
            </div>
          </div>

          {/* 문의사항 */}
          <div>
            <label className="block mb-2 font-semibold" style={{ color: '#000000', fontSize: '15px' }}>
              문의사항 (선택)
            </label>
            <textarea
              name="inquiry"
              value={formData.inquiry}
              onChange={handleChange}
              placeholder="궁금하신 점을 자유롭게 작성해주세요"
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 resize-none"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            />
          </div>

          {/* 추천인 코드 (읽기 전용) */}
          <div>
            <label className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1 font-semibold" style={{ color: '#000000', fontSize: '15px' }}>
                <svg className="w-5 h-5" style={{ color: '#249689' }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                추천인 코드
              </span>
              <button
                type="button"
                onClick={handleGenerateQR}
                className="text-xs px-3 py-1 rounded-full text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#249689' }}
              >
                내 QR/링크 생성
              </button>
            </label>
            <input
              type="text"
              name="referrerCode"
              value={formData.referrerCode}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            />
          </div>

          {/* 개인정보 동의 */}
          <div className="border-2 border-gray-200 rounded-lg p-3 bg-gray-50">
            <h3 className="font-bold mb-2 text-lg" style={{ color: '#249689', fontSize: '18px' }}>
              개인정보 수집 및 이용 동의
            </h3>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="privacyAgreed"
                  checked={formData.privacyAgreed}
                  onChange={handleChange}
                  className="w-5 h-5 mt-0.5"
                />
                <span style={{ color: '#000000', fontSize: '14px' }}>
                  개인정보 수집 및 이용에 동의합니다 <span style={{ color: '#ef4444' }}>*</span>
                </span>
              </label>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="text-sm underline whitespace-nowrap"
                style={{ color: '#249689' }}
              >
                📄 내용보기
              </button>
            </div>

            <div className="pt-2 border-t border-gray-300">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="marketingAgreed"
                  checked={formData.marketingAgreed}
                  onChange={handleChange}
                  className="w-5 h-5 mt-0.5"
                />
                <span style={{ fontSize: '14px', flex: 1 }}>
                  <span className="font-bold">(선택)</span> 이벤트 및 마케팅 정보 수신에 동의합니다
                </span>
              </label>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#dc2626', fontSize: '16px' }}
            >
              {loading ? '신청 중...' : '신청하기'}
            </button>
          </div>
        </div>

        <div className="mt-3 text-center">
          <p style={{ fontSize: '13px', color: '#666' }}>
            오늘도 수고하셨습니다.
          </p>
        </div>
      </div>

      {/* QR코드/링크 모달 */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="font-bold mb-4 text-center" style={{ color: '#249689', fontSize: '22px' }}>
              추천 링크가 생성되었습니다!
            </h2>
            
            <div className="flex justify-center mb-4">
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="w-64 h-64 border-2 border-gray-300 rounded-lg"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-2">생성된 링크:</p>
              <div className="bg-white p-3 rounded border border-gray-300 break-all text-sm">
                {referralLink}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleDownloadQR}
                className="w-full py-2.5 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#249689' }}
              >
                💾 QR 다운로드
              </button>
              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#2ca89f' }}
              >
                📋 링크 복사하기
              </button>
              <button
                onClick={handleShareLink}
                className="w-full py-2.5 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#3bb5ab' }}
              >
                📤 공유하기
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="w-full py-2.5 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#6b7280' }}
              >
                ✕ 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 개인정보 동의 모달 */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 my-8 max-h-[80vh] overflow-y-auto">
            <h2 className="font-bold mb-4 text-center" style={{ color: '#249689', fontSize: '22px' }}>
              개인정보 수집 및 이용 동의
            </h2>
            
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h3 className="font-bold mb-2">1. 수집하는 개인정보 항목</h3>
                <p>학부모 이름, 휴대전화 번호, 자녀 성별, 자녀 연령, 문의사항</p>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">2. 개인정보의 수집 및 이용 목적</h3>
                <p>이벤트 참여 확인, 당첨자 연락, 상품 배송, 마케팅 및 프로모션 정보 제공</p>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">3. 개인정보의 보유 및 이용 기간</h3>
                <p>이벤트 종료 후 3개월까지 보관 후 파기</p>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">4. 동의 거부 권리 및 불이익</h3>
                <p>귀하는 개인정보 수집 및 이용을 거부할 권리가 있으나, 거부 시 이벤트 참여가 제한될 수 있습니다.</p>
              </div>
            </div>

            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full mt-6 py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#249689' }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 샘플 영상 모달 */}
      {showVideoModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setShowVideoModal(false)}
        >
          <div 
            className="relative bg-black rounded-lg shadow-2xl max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
            style={{ aspectRatio: '16/9' }}
          >
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors z-10"
              style={{ fontSize: '32px', fontWeight: 'bold' }}
            >
              ✕
            </button>
            
            {/* HTML5 Video 태그 */}
            <video
              className="w-full h-full rounded-lg"
              controls
              autoPlay
              playsInline
              controlsList="nodownload"
              onError={(e) => {
                console.error('비디오 재생 오류:', e)
                alert('영상을 불러올 수 없습니다. 파일 경로를 확인해주세요.\n경로: ' + sampleVideoUrl)
              }}
              onLoadedData={() => console.log('영상 로드 완료')}
              style={{ 
                border: 'none',
                backgroundColor: '#000'
              }}
            >
              <source src={sampleVideoUrl} type="video/mp4" />
              브라우저가 비디오 태그를 지원하지 않습니다.
            </video>
          </div>
        </div>
      )}
    </div>
  )
}