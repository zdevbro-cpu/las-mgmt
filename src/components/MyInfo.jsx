import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, User, Mail, Building2, Briefcase, Phone, Edit2, Lock, QrCode, Download, X, Copy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import QRCode from 'qrcode'

export default function MyInfo({ user, onBack }) {
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [activeEvent, setActiveEvent] = useState(null)
  const [qrImage, setQrImage] = useState(null)
  const [generatingQR, setGeneratingQR] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    fetchUserInfo()
    fetchActiveEvent()
  }, [user])

  const fetchUserInfo = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      console.log('✅ 사용자 정보 로드:', data)
      setUserInfo(data)
      setFormData({
        name: data.name || '',
        phone: data.phone || ''
      })
    } catch (err) {
      console.error('❌ 사용자 정보 조회 오류:', err)
      alert('사용자 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.log('활성 이벤트 없음')
        return
      }

      console.log('✅ 활성 이벤트:', data)
      setActiveEvent(data)
    } catch (err) {
      console.error('이벤트 조회 오류:', err)
    }
  }

  const generateQRCode = async () => {
    if (!activeEvent || !userInfo) {
      alert('활성화된 이벤트가 없거나 사용자 정보가 없습니다.')
      return
    }

    try {
      setGeneratingQR(true)

      const qrData = `${activeEvent.landing_url}?ref=${userInfo.referral_code}`
      setShareUrl(qrData)
      console.log('🔗 QR 코드 URL:', qrData)
      console.log('📋 추천인 코드:', userInfo.referral_code)

      const qrCanvas = document.createElement('canvas')
      await QRCode.toCanvas(qrCanvas, qrData, {
        width: activeEvent.qr_position?.width || 200,
        margin: 0,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })

      const qrDataUrl = qrCanvas.toDataURL('image/png')
      
      const compositeImage = await composeImageWithQR(
        activeEvent.template_image_url,
        qrDataUrl,
        activeEvent.qr_position
      )

      setQrImage(compositeImage)
      console.log('✅ QR 코드 생성 완료')

      // 파일명 입력 받기
      const defaultFileName = `${userInfo.name}_QR페이지`
      const fileName = prompt('파일 이름을 입력하세요:', defaultFileName)
      
      if (fileName) {
        const link = document.createElement('a')
        link.download = `${fileName}.png`
        link.href = compositeImage
        link.click()
        
        alert('✅ QR 페이지가 다운로드되었습니다!')
      }
    } catch (error) {
      console.error('QR 코드 생성 실패:', error)
      alert('QR 코드 생성에 실패했습니다: ' + error.message)
    } finally {
      setGeneratingQR(false)
    }
  }

  const composeImageWithQR = (templateUrl, qrDataUrl, position) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      const templateImg = new Image()
      templateImg.crossOrigin = 'anonymous'
      
      templateImg.onload = () => {
        canvas.width = templateImg.width
        canvas.height = templateImg.height

        console.log('🖼️ 템플릿 이미지 크기:', { width: templateImg.width, height: templateImg.height })
        console.log('📍 QR 위치:', position)

        ctx.drawImage(templateImg, 0, 0)

        const qrImg = new Image()
        
        qrImg.onload = () => {
          console.log('✅ QR 이미지 로드 완료:', { width: qrImg.width, height: qrImg.height })
          
          ctx.drawImage(
            qrImg,
            position.x,
            position.y,
            position.width,
            position.height
          )

          console.log('✅ QR 합성 완료')

          const finalImage = canvas.toDataURL('image/png')
          resolve(finalImage)
        }

        qrImg.onerror = () => {
          reject(new Error('QR 이미지 로드 실패'))
        }

        qrImg.src = qrDataUrl
      }

      templateImg.onerror = () => {
        reject(new Error('템플릿 이미지 로드 실패'))
      }

      templateImg.src = templateUrl
    })
  }

  const downloadQRImage = () => {
    if (!qrImage) return

    const link = document.createElement('a')
    link.download = `${userInfo.name}_QR페이지.png`
    link.href = qrImage
    link.click()
  }

  const downloadQROnly = async () => {
    if (!activeEvent || !userInfo) {
      alert('활성화된 이벤트가 없거나 사용자 정보가 없습니다.')
      return
    }

    try {
      const qrData = `${activeEvent.landing_url}?ref=${userInfo.referral_code}`
      
      // QR 코드만 생성 (템플릿 없이)
      const qrCanvas = document.createElement('canvas')
      await QRCode.toCanvas(qrCanvas, qrData, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })

      const qrDataUrl = qrCanvas.toDataURL('image/png')
      
      // 파일명 입력 받기
      const defaultFileName = `${userInfo.name}_QR코드`
      const fileName = prompt('파일 이름을 입력하세요:', defaultFileName)
      
      if (fileName) {
        const link = document.createElement('a')
        link.download = `${fileName}.png`
        link.href = qrDataUrl
        link.click()
        
        alert('✅ QR 코드가 다운로드되었습니다!')
      }
    } catch (error) {
      console.error('QR 다운로드 실패:', error)
      alert('QR 다운로드에 실패했습니다.')
    }
  }

  const copyLink = async () => {
    if (!activeEvent || !userInfo) {
      alert('활성화된 이벤트가 없거나 사용자 정보가 없습니다.')
      return
    }

    try {
      const linkToCopy = shareUrl || `${activeEvent.landing_url}?ref=${userInfo.referral_code}`
      await navigator.clipboard.writeText(linkToCopy)
      alert('✅ 링크가 복사되었습니다!\n카톡에 붙여넣기 하세요.')
    } catch (err) {
      console.error('복사 실패:', err)
      alert('❌ 링크 복사에 실패했습니다.')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('이름을 입력해주세요.')
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone: formData.phone
        })
        .eq('id', user.id)

      if (error) throw error

      alert('정보가 수정되었습니다.')
      setEditing(false)
      fetchUserInfo()
    } catch (err) {
      console.error('❌ 정보 수정 오류:', err)
      alert('정보 수정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSave = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert('모든 필드를 입력해주세요.')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.')
      return
    }

    if (passwordData.newPassword.length < 6) {
      alert('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    try {
      setLoading(true)

      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('password')
        .eq('id', user.id)
        .single()

      if (fetchError) throw fetchError

      if (userData.password !== passwordData.currentPassword) {
        alert('현재 비밀번호가 일치하지 않습니다.')
        setLoading(false)
        return
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ password: passwordData.newPassword })
        .eq('id', user.id)

      if (updateError) throw updateError

      alert('비밀번호가 변경되었습니다.')
      handleCancelPasswordChange()
    } catch (err) {
      console.error('❌ 비밀번호 변경 오류:', err)
      alert('비밀번호 변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelPasswordChange = () => {
    setChangingPassword(false)
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  const openQRModal = () => {
    setShowQRModal(true)
    setQrImage(null)
    setShareUrl('')
  }

  const closeQRModal = () => {
    setShowQRModal(false)
    setQrImage(null)
    setShareUrl('')
  }

  if (loading && !userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#249689' }}></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-center gap-1.5 mb-8">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-10 h-10 object-cover"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
              내정보관리
            </h1>
          </div>

          <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>💡 안내:</strong> 이메일, 지점, 구분은 관리자만 수정할 수 있습니다. 변경이 필요한 경우 관리자에게 문의하세요.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-2 mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                <Mail size={18} style={{ color: '#249689' }} />
                이메일
              </label>
              <input
                type="email"
                value={userInfo?.email || ''}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                <User size={18} style={{ color: '#249689' }} />
                이름 {editing && <span style={{ color: '#ef4444' }}>*</span>}
              </label>
              {editing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                  placeholder="이름을 입력하세요"
                />
              ) : (
                <input
                  type="text"
                  value={userInfo?.name || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                  style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
                />
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                <Building2 size={18} style={{ color: '#249689' }} />
                지점
              </label>
              <input
                type="text"
                value={userInfo?.branch || ''}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                <Briefcase size={18} style={{ color: '#249689' }} />
                구분
              </label>
              <input
                type="text"
                value={userInfo?.user_type || ''}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                <Phone size={18} style={{ color: '#249689' }} />
                연락처
              </label>
              {editing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                  placeholder="연락처를 입력하세요"
                />
              ) : (
                <input
                  type="text"
                  value={userInfo?.phone || '-'}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                  style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
                />
              )}
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="mt-6 space-y-2.5">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
                >
                  {loading ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setFormData({
                      name: userInfo.name || '',
                      phone: userInfo.phone || ''
                    })
                  }}
                  className="w-full py-3 font-bold rounded-lg transition-colors"
                  style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
                >
                  취소
                </button>
              </>
            ) : changingPassword ? (
              <div className="space-y-2.5">
                <div>
                  <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '14px' }}>
                    현재 비밀번호
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                    placeholder="현재 비밀번호"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '14px' }}>
                    새 비밀번호
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                    placeholder="새 비밀번호 (6자 이상)"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '14px' }}>
                    새 비밀번호 확인
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                    placeholder="새 비밀번호 확인"
                  />
                </div>
                <button
                  onClick={handlePasswordSave}
                  disabled={loading}
                  className="w-full py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
                >
                  {loading ? '변경 중...' : '비밀번호 변경'}
                </button>
                <button
                  onClick={handleCancelPasswordChange}
                  className="w-full py-3 font-bold rounded-lg transition-colors"
                  style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
                >
                  취소
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="w-full py-3 flex items-center justify-center gap-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
                >
                  <Edit2 size={18} />
                  정보 수정
                </button>

                {/* 내 QR 코드 버튼 */}
                {activeEvent && (
                  <button
                    onClick={openQRModal}
                    className="w-full py-3 flex items-center justify-center gap-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#dc2626', borderRadius: '10px', fontSize: '15px' }}
                  >
                    <QrCode size={18} />
                    내 QR 코드
                  </button>
                )}

                <button
                  onClick={() => setChangingPassword(true)}
                  className="w-full py-3 flex items-center justify-center gap-2 font-bold rounded-lg transition-colors"
                  style={{ color: '#000000', border: '2px solid #249689', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
                >
                  <Lock size={18} />
                  비밀번호 변경
                </button>

                <button
                  onClick={onBack}
                  className="w-full py-3 flex items-center justify-center gap-2 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
                >
                  <ArrowLeft size={18} />
                  돌아가기
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* QR 코드 모달 */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            {/* 제목 */}
            <h2 className="text-center font-bold mb-4" style={{ color: '#14b8a6', fontSize: '24px' }}>
              추천 링크가 생성되었습니다!
            </h2>

            {/* QR 코드 이미지 */}
            {qrImage ? (
              <div className="bg-white p-4 rounded border text-center mb-4">
                <img 
                  src={qrImage} 
                  alt="QR Code" 
                  className="max-w-full mx-auto rounded"
                  style={{ maxHeight: '300px' }}
                />
              </div>
            ) : (
              <div className="bg-white p-4 rounded border text-center mb-4" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="text-gray-500">QR 페이지를 먼저 생성해주세요</p>
              </div>
            )}

            {/* 생성된 링크 */}
            {shareUrl && (
              <div className="mb-4">
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '14px' }}>
                  생성된 링크:
                </label>
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50 text-sm"
                  style={{ borderRadius: '10px' }}
                />
              </div>
            )}

            {/* 버튼들 */}
            <div className="space-y-2">
              <button
                onClick={generateQRCode}
                disabled={generatingQR}
                className="w-full py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#249689', fontSize: '15px' }}
              >
                {generatingQR ? '생성 중...' : '💾 QR페이지 만들기'}
              </button>

              <button
                onClick={downloadQROnly}
                className="w-full py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#249689', fontSize: '15px' }}
              >
                <Download size={18} className="inline mr-2" />
                QR 다운로드
              </button>

              <button
                onClick={copyLink}
                className="w-full py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#249689', fontSize: '15px' }}
              >
                <Copy size={18} className="inline mr-2" />
                링크 복사하기
              </button>

              <button
                onClick={closeQRModal}
                className="w-full py-3 font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                style={{ color: '#000000', backgroundColor: '#e5e7eb', fontSize: '15px' }}
              >
                <ArrowLeft size={18} />
                나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}