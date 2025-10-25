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

  // URL 파라미터에서 추천인 코드 추출
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const refCode = params.get('ref')
      if (refCode) {
        setFormData(prev => ({ ...prev, referrerCode: refCode }))
        setIsFromReferralLink(true)
      }
    } catch (err) {
      console.error('URL 파라미터 파싱 오류:', err)
    }
  }, [])

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

    // 추천인 코드 검증
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
      return { exists: true, referrerId: null }
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, branch, referral_code')
        .eq('referral_code', code.trim().toUpperCase())
        .maybeSingle()

      if (error) {
        console.error('추천인 코드 확인 오류:', error)
        return { exists: false, referrerId: null, error: '추천인 코드 확인 중 오류가 발생했습니다' }
      }

      if (!data) {
        return { exists: false, referrerId: null, error: '존재하지 않는 고유번호입니다' }
      }

      console.log('✅ 고유번호 확인:', data.referral_code, '-', data.name, '(', data.branch, ')')
      return { exists: true, referrerId: data.id, referrerName: data.name, referrerBranch: data.branch }
    } catch (err) {
      console.error('추천인 코드 확인 예외:', err)
      return { exists: false, referrerId: null, error: '추천인 코드 확인 중 오류가 발생했습니다' }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)

    try {
      const phoneOnly = formData.phone.replace(/[^\d]/g, '')
      
      const { data: existing } = await supabase
        .from('event_participants')
        .select('id')
        .eq('phone', phoneOnly)
        .maybeSingle()

      let referrerCode = null
      if (formData.referrerCode.trim()) {
        const verification = await verifyReferralCodeExists(formData.referrerCode)
        if (!verification.exists) {
          alert(verification.error || '존재하지 않는 고유번호입니다')
          setLoading(false)
          return
        }
        referrerCode = formData.referrerCode.trim().toUpperCase()
      }

      const participantData = {
        parent_name: formData.parentName.trim(),
        phone: phoneOnly,
        child_gender: formData.childGender,
        child_age: parseInt(formData.childAge),
        inquiry: formData.inquiry.trim() || null,
        referrer_code: referrerCode,
        privacy_agreed: formData.privacyAgreed,
        marketing_agreed: formData.marketingAgreed,
        created_at: new Date().toISOString()
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from('event_participants')
          .update(participantData)
          .eq('id', existing.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('event_participants')
          .insert([participantData])

        if (insertError) throw insertError
      }

      setSubmitted(true)
    } catch (err) {
      console.error('신청 오류:', err)
      alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    window.location.href = '/'
  }

  const handleShareAfterSubmit = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?ref=${formData.referrerCode || 'SHARE'}`
    
    if (navigator.share) {
      navigator.share({
        title: '수학편지 신청',
        text: '아이들의 인생을 수학으로 디자인하자!',
        url: shareUrl
      }).catch(err => console.log('공유 취소:', err))
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('링크가 복사되었습니다!')
      }).catch(() => {
        prompt('링크를 복사하세요:', shareUrl)
      })
    }
  }

  // 제출 완료 화면
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-bold mb-2" style={{ color: '#249689', fontSize: '24px' }}>
              신청이 완료되었습니다!
            </h2>
            <p style={{ color: '#666', fontSize: '15px' }}>
              소중한 참여 감사드립니다.<br/>
              아이들의 인생을 수학으로 '디자인'하겠습니다!
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleShareAfterSubmit}
              className="w-full py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#249689', fontSize: '16px' }}
            >
              친구에게 공유하기
            </button>
            <button
              onClick={handleClose}
              className="w-full py-3 font-bold rounded-lg hover:bg-gray-50 transition-colors"
              style={{ color: '#000000', border: '2px solid #d1d5db', backgroundColor: 'white', fontSize: '16px' }}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-3">
        
        {/* 헤더 */}
        <div className="mb-3">
          <div className="bg-red-700 text-white text-center py-6 rounded-lg mb-1.5">
            <h1 className="font-bold mb-1.5" style={{ fontSize: '20px' }}>
              우리나라를 살리는
            </h1>
            <h2 className="font-bold" style={{ fontSize: '24px' }}>
              수학 대중화 운동
            </h2>
          </div>
          <div className="text-center py-1">
            <p className="font-bold !mt-0" style={{ color: '#249689', fontSize: '18px' }}>
              아이들의 인생을 수학으로 '디자인'하자!
            </p>
          </div>
        </div>

        {/* 신청 폼 제목 */}
        <div className="text-center mt-0 mb-2" style={{ marginTop: '-4px' }}>
          <h2 className="font-bold" style={{ color: '#dc2626', fontSize: '28px', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: '900' }}>
            수학편지 신청하기
          </h2>
        </div>

        <div className="space-y-2" style={{ marginTop: '16px' }}>
          {/* 학부모 이름 */}
          <div>
            <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              학부모이름 *
            </label>
            <input
              type="text"
              name="parentName"
              value={formData.parentName}
              onChange={handleChange}
              placeholder="학부모님 이름을 입력해주세요"
              className="w-full px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            />
          </div>

          {/* 휴대전화 */}
          <div>
            <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              휴대전화 *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="010-0000-0000"
              maxLength={13}
              className="w-full px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            />
          </div>

          {/* 자녀 성별 */}
          <div>
            <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              자녀성별 *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="radio"
                  name="childGender"
                  value="남"
                  checked={formData.childGender === '남'}
                  onChange={handleChange}
                  className="w-5 h-5"
                />
                <span style={{ fontSize: '15px' }}>남</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="radio"
                  name="childGender"
                  value="여"
                  checked={formData.childGender === '여'}
                  onChange={handleChange}
                  className="w-5 h-5"
                />
                <span style={{ fontSize: '15px' }}>여</span>
              </label>
            </div>
          </div>

          {/* 자녀 연령 */}
          <div>
            <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              자녀나이 *
            </label>
            <input
              type="number"
              name="childAge"
              value={formData.childAge}
              onChange={handleChange}
              placeholder="자녀나이를 입력해주세요"
              min="1"
              max="20"
              className="w-full px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            />
          </div>

          {/* 문의사항 */}
          <div>
            <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              문의사항
            </label>
            <textarea
              name="inquiry"
              value={formData.inquiry}
              onChange={handleChange}
              placeholder="궁금한 사항이 있으시면 입력해주세요"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            />
          </div>

          {/* 추천인 + 링크 생성 버튼 */}
          <div>
            <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              추천인 (선택)
            </label>
            {isFromReferralLink ? (
              <>
                <input
                  type="text"
                  name="referrerCode"
                  value={formData.referrerCode}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
                <p className="mt-1 text-xs" style={{ color: '#249689' }}>
                  ✓ 추천인 코드가 자동으로 입력되었습니다
                </p>
              </>
            ) : (
              <>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      name="referrerCode"
                      value={formData.referrerCode}
                      onChange={handleReferrerCodeChange}
                      placeholder="추천인 코드를 입력해주세요 (예: LAS1000)"
                      className={`w-full px-4 py-2 border ${referralCodeError ? 'border-red-500' : 'border-gray-300'}`}
                      style={{ borderRadius: '10px', fontSize: '15px' }}
                    />
                    {referralCodeError && (
                      <p className="mt-1 text-xs text-red-600">
                        {referralCodeError}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateQR}
                    disabled={!formData.referrerCode.trim() || !!referralCodeError}
                    className="px-4 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#249689', fontSize: '14px' }}
                  >
                    링크생성
                  </button>
                </div>
              </>
            )}
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
            
            {/* QR 코드 */}
            <div className="flex justify-center mb-4">
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="w-64 h-64 border-2 border-gray-300 rounded-lg"
              />
            </div>

            {/* 링크 */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-2">생성된 링크:</p>
              <div className="bg-white p-3 rounded border border-gray-300 break-all text-sm">
                {referralLink}
              </div>
            </div>

            {/* 버튼 */}
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
    </div>
  )
}