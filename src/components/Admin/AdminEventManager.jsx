'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AdminEventManager({ user, onBack }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [filter])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      let query = supabase.from('events').select('*').order('created_at', { ascending: false })
      if (filter !== 'all') query = query.eq('status', filter)
      const { data, error } = await query
      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('이벤트 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-3 items-center mb-8">
            <div className="flex justify-start">
              <button
                onClick={onBack}
                className="flex items-center gap-1 font-bold hover:opacity-70 transition-opacity"
                style={{ color: '#4A9B8E', fontSize: '16px' }}
              >
                <ArrowLeft size={20} />
                나가기
              </button>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              <img src="/images/logo.png" alt="LAS Logo" className="w-10 h-10 object-contain" onError={(e) => e.target.style.display = 'none'} />
              <h2 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>이벤트 템플릿 관리</h2>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 font-bold" style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}>
                <Plus size={20} />생성하기
              </button>
            </div>
          </div>
          <div className="mb-6 p-3 rounded-lg" style={{ backgroundColor: '#f0f9ff', border: '2px solid #3b82f6', borderRadius: '10px' }}>
            <p className="text-sm" style={{ color: '#1e40af' }}>ℹ️ 이벤트 템플릿을 생성하고 관리합니다</p>
          </div>
          <div className="flex gap-2 border-b border-gray-200">
            {[{ value: 'all', label: '전체' }, { value: 'active', label: '진행중' }, { value: 'scheduled', label: '예정' }, { value: 'ended', label: '종료' }, { value: 'inactive', label: '비활성' }].map((tab) => (
              <button key={tab.value} onClick={() => setFilter(tab.value)} className={`px-4 py-2 font-medium transition-colors ${filter === tab.value ? 'border-b-2' : 'text-gray-600 hover:text-gray-900'}`} style={filter === tab.value ? { color: '#249689', borderColor: '#249689' } : {}}>{tab.label}</button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#249689' }}></div></div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm border"><div className="text-6xl mb-4">📅</div><p className="text-gray-600 mb-4">등록된 이벤트가 없습니다</p><button onClick={() => setShowCreateModal(true)} className="px-6 py-2 text-white rounded-lg hover:opacity-90" style={{ backgroundColor: '#249689', borderRadius: '10px' }}>첫 이벤트 만들기</button></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{events.map((event) => (<EventCard key={event.id} event={event} onRefresh={fetchEvents} />))}</div>
        )}
      </div>
      {showCreateModal && (<CreateEventModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); fetchEvents() }} />)}
    </div>
  )
}

function EventCard({ event, onRefresh }) {
  const [showEditModal, setShowEditModal] = useState(false)
  const toggleStatus = async () => {
    try {
      const newStatus = event.status === 'active' ? 'inactive' : 'active'
      const { error } = await supabase.from('events').update({ status: newStatus }).eq('id', event.id)
      if (error) throw error
      onRefresh()
    } catch (error) {
      console.error('상태 변경 실패:', error)
    }
  }
  const deleteEvent = async () => {
    if (!confirm('정말 이 이벤트를 삭제하시겠습니까?')) return
    try {
      const { error } = await supabase.from('events').delete().eq('id', event.id)
      if (error) throw error
      onRefresh()
    } catch (error) {
      console.error('삭제 실패:', error)
    }
  }
  const getStatusBadge = (status) => {
    const badges = { active: { text: '진행중', color: 'bg-green-100 text-green-800' }, inactive: { text: '비활성', color: 'bg-gray-100 text-gray-800' }, scheduled: { text: '예정', color: 'bg-blue-100 text-blue-800' }, ended: { text: '종료', color: 'bg-red-100 text-red-800' } }
    const badge = badges[status] || badges.inactive
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>{badge.text}</span>
  }
  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('ko-KR')
  }
  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
        {event.template_image_url ? (
          <div className="h-48 bg-gray-100 relative overflow-hidden"><img src={event.template_image_url} alt={event.name} className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><span>이미지를 불러올 수 없습니다</span></div>' }} /></div>
        ) : (
          <div className="h-48 bg-gray-100 flex items-center justify-center"><span className="text-gray-400">이미지 없음</span></div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
            {getStatusBadge(event.status)}
          </div>
          {event.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>}
          <div className="text-xs text-gray-500 space-y-1 mb-4">
            <div>시작일: {formatDate(event.start_date)}</div>
            <div>종료일: {formatDate(event.end_date)}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleStatus} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm" style={{ borderRadius: '10px' }}>
              <span>{event.status === 'active' ? '👁️‍🗨️' : '👁️'}</span>
              {event.status === 'active' ? '비활성화' : '활성화'}
            </button>
            <button onClick={() => setShowEditModal(true)} className="px-3 py-2 rounded hover:opacity-80" style={{ backgroundColor: '#249689', color: 'white', borderRadius: '10px' }}>✏️</button>
            <button onClick={deleteEvent} className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200" style={{ borderRadius: '10px' }}>🗑️</button>
          </div>
        </div>
      </div>
      {showEditModal && (<EditEventModal event={event} onClose={() => setShowEditModal(false)} onSuccess={() => { setShowEditModal(false); onRefresh() }} />)}
    </>
  )
}

function QRImageSelector({ imageUrl, position, onPositionChange }) {
  const [isSelecting, setIsSelecting] = useState(false)
  const [startPos, setStartPos] = useState(null)
  const [currentPos, setCurrentPos] = useState(null)
  const containerRef = useRef(null)
  const imageRef = useRef(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  // 이미지의 실제 렌더링 크기와 위치 계산
  const getImageBounds = () => {
    if (!imageRef.current) return null
    const img = imageRef.current
    return img.getBoundingClientRect()
  }
  
  const handleMouseDown = (e) => {
    if (!imageRef.current || !imageLoaded) return
    const imgRect = getImageBounds()
    if (!imgRect) return
    
    // 이미지 영역 밖 클릭 무시
    if (e.clientX < imgRect.left || e.clientX > imgRect.right || 
        e.clientY < imgRect.top || e.clientY > imgRect.bottom) {
      return
    }
    
    const x = ((e.clientX - imgRect.left) / imgRect.width) * 100
    const y = ((e.clientY - imgRect.top) / imgRect.height) * 100
    console.log('🖱️ 드래그 시작:', { clientX: e.clientX, clientY: e.clientY, imgLeft: imgRect.left, imgTop: imgRect.top, imgWidth: imgRect.width, imgHeight: imgRect.height, x, y })
    setStartPos({ x, y })
    setCurrentPos({ x, y })
    setIsSelecting(true)
  }
  
  const handleMouseMove = (e) => {
    if (!isSelecting || !imageRef.current) return
    const imgRect = getImageBounds()
    if (!imgRect) return
    
    // 마우스가 이미지 밖으로 나가도 좌표는 0-100% 범위로 제한
    const rawX = ((e.clientX - imgRect.left) / imgRect.width) * 100
    const rawY = ((e.clientY - imgRect.top) / imgRect.height) * 100
    const x = Math.max(0, Math.min(100, rawX))
    const y = Math.max(0, Math.min(100, rawY))
    setCurrentPos({ x, y })
  }
  const handleMouseUp = () => {
    if (!isSelecting || !startPos || !currentPos) return
    const x = Math.min(startPos.x, currentPos.x)
    const y = Math.min(startPos.y, currentPos.y)
    const width = Math.abs(currentPos.x - startPos.x)
    const height = Math.abs(currentPos.y - startPos.y)
    if (width > 1 && height > 1) {
      const newPosition = { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)), width: Math.min(100 - x, width), height: Math.min(100 - y, height) }
      onPositionChange(newPosition)
      console.log('✅ QR 위치 선택됨:', newPosition)
      console.log('📊 실제 좌표:', {
        left: `${x.toFixed(2)}%`,
        top: `${y.toFixed(2)}%`,
        right: `${(x + width).toFixed(2)}%`,
        bottom: `${(y + height).toFixed(2)}%`,
        width: `${width.toFixed(2)}%`,
        height: `${height.toFixed(2)}%`
      })
    }
    setIsSelecting(false)
    setStartPos(null)
    setCurrentPos(null)
  }
  const getSelectionStyle = () => {
    if (!isSelecting || !startPos || !currentPos) return {}
    const x = Math.min(startPos.x, currentPos.x)
    const y = Math.min(startPos.y, currentPos.y)
    const width = Math.abs(currentPos.x - startPos.x)
    const height = Math.abs(currentPos.y - startPos.y)
    return { left: `${x}%`, top: `${y}%`, width: `${width}%`, height: `${height}%` }
  }
  const getQRBoxStyle = () => {
    if (!position || position.width === 0) return {}
    return { left: `${position.x}%`, top: `${position.y}%`, width: `${position.width}%`, height: `${position.height}%` }
  }
  return (
    <div ref={containerRef} className="relative w-full cursor-crosshair" style={{ minHeight: '450px' }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <img 
        ref={imageRef}
        src={imageUrl} 
        alt="Template" 
        className="w-full h-auto" 
        style={{ maxHeight: '600px', objectFit: 'contain' }} 
        draggable="false"
        onDragStart={(e) => e.preventDefault()}
        onLoad={() => { 
          setImageLoaded(true); 
          console.log('✅ 이미지 로드 완료:', imageUrl) 
        }} 
        onError={(e) => { 
          console.error('❌ 이미지 로드 실패:', imageUrl); 
          setImageLoaded(false) 
        }} 
      />
      {isSelecting && startPos && currentPos && (
        <div className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-30 pointer-events-none" style={getSelectionStyle()} />
      )}
      {!isSelecting && position && position.width > 0 && (
        <div className="absolute border-4 border-green-500 bg-green-200 bg-opacity-40 pointer-events-none flex items-center justify-center" style={getQRBoxStyle()}>
          <span className="text-xs font-bold text-green-700 bg-white px-2 py-1 rounded shadow-lg">QR 위치</span>
        </div>
      )}
    </div>
  )
}

function CreateEventModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    landing_url: '',
    template_image_url: '',
    qr_position: null,
    start_date: '',
    end_date: '',
    status: 'active'
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' })
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) {
      console.log('❌ 파일이 선택되지 않음')
      return
    }
    
    console.log('📂 선택된 파일:', file.name, file.size, 'bytes')
    
    // 즉시 미리보기 표시
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    setUploadStatus({ type: 'uploading', message: '이미지 업로드 중...' })
    console.log('👁️ 미리보기 URL 생성:', localUrl)
    
    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `event-templates/${fileName}`
      console.log('📁 업로드 경로:', filePath)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, file)
      
      if (uploadError) {
        console.error('❌ Storage 업로드 실패:', uploadError)
        setUploadStatus({ type: 'error', message: '이미지 업로드 실패: ' + uploadError.message })
        setUploading(false)
        return
      }
      
      console.log('✅ 업로드 성공:', uploadData)
      console.log('📁 저장된 경로:', filePath)
      
      // Supabase URL 가져오기
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sgxnxbhbyvrmgrzhosyh.supabase.co'
      console.log('🔧 Supabase URL:', supabaseUrl)
      
      // Public URL 직접 구성
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/event-images/${filePath}`
      console.log('🔗 구성한 Public URL:', publicUrl)
      
      // formData 업데이트
      setFormData(prev => {
        const newData = { ...prev, template_image_url: publicUrl }
        console.log('✅ FormData 업데이트!')
        console.log('   → template_image_url:', newData.template_image_url)
        return newData
      })
      
      // 업로드 완료 후 previewUrl 제거 (template_image_url 사용하도록)
      setTimeout(() => {
        console.log('🔄 previewUrl 제거, template_image_url로 교체')
        setPreviewUrl('')
      }, 100)
      
      setUploadStatus({ type: 'success', message: '✅ 이미지 업로드 완료! 이제 QR 위치를 선택하세요.' })
      console.log('🎉 이미지 업로드 프로세스 완료!')
      
    } catch (error) {
      console.error('❌ 이미지 업로드 에러:', error)
      setUploadStatus({ type: 'error', message: '이미지 업로드 중 오류 발생: ' + error.message })
    } finally {
      setUploading(false)
      console.log('🔄 업로딩 상태 종료')
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    console.log('🚀 생성하기 버튼 클릭!')
    console.log('📋 현재 formData:', formData)
    
    if (!formData.name) {
      console.log('❌ 검증 실패: 이벤트명 없음')
      setUploadStatus({ type: 'error', message: '이벤트명을 입력해주세요.' })
      return
    }
    
    if (!formData.landing_url) {
      console.log('❌ 검증 실패: 랜딩페이지 URL 없음')
      setUploadStatus({ type: 'error', message: '랜딩페이지 URL을 입력해주세요.' })
      return
    }
    
    if (uploading) {
      console.log('❌ 검증 실패: 업로드 진행 중')
      setUploadStatus({ type: 'error', message: '이미지 업로드가 진행 중입니다. 잠시만 기다려주세요.' })
      return
    }
    
    console.log('🔍 template_image_url 확인:', formData.template_image_url)
    if (!formData.template_image_url || formData.template_image_url === '') {
      console.log('❌ 검증 실패: template_image_url 없음')
      console.log('   - previewUrl:', previewUrl)
      setUploadStatus({ type: 'error', message: '템플릿 이미지를 업로드해주세요.' })
      return
    }
    
    console.log('🔍 qr_position 확인:', formData.qr_position)
    if (!formData.qr_position || formData.qr_position.width === 0) {
      console.log('❌ 검증 실패: QR 위치 미선택')
      setUploadStatus({ type: 'error', message: 'QR 코드 위치를 선택해주세요. 이미지에서 마우스로 드래그하여 QR 영역을 선택하세요.' })
      return
    }
    
    try {
      setSaving(true)
      setUploadStatus({ type: 'uploading', message: '이벤트 생성 중...' })
      console.log('📝 저장할 데이터:', formData)
      
      const { error } = await supabase.from('events').insert([formData])
      
      if (error) {
        console.error('❌ DB 저장 실패:', error)
        throw error
      }
      
      console.log('✅ 이벤트 생성 성공!')
      setUploadStatus({ type: 'success', message: '✅ 이벤트가 성공적으로 생성되었습니다!' })
      setTimeout(onSuccess, 500)
    } catch (error) {
      console.error('❌ 이벤트 생성 실패:', error)
      setUploadStatus({ type: 'error', message: '❌ 이벤트 생성에 실패했습니다: ' + error.message })
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto" style={{ paddingTop: '2rem' }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative" style={{ borderRadius: '10px' }}>
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          {/* 나가기 버튼 - 상단 왼쪽 */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors font-medium"
            style={{ fontSize: '14px' }}
          >
            <ArrowLeft size={18} />
            나가기
          </button>
          
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="flex items-center gap-1.5 mb-4">
              <img src="/images/logo.png" alt="LAS Logo" className="w-10 h-10 object-contain" onError={(e) => e.target.style.display = 'none'} />
              <h2 className="font-bold" style={{ color: '#249689', fontSize: '28px' }}>새 템플릿 만들기</h2>
            </div>
          </div>
          
          {/* 상태 메시지 */}
          {uploadStatus.message && (
            <div className={`mb-4 p-3 rounded-lg ${
              uploadStatus.type === 'error' ? 'bg-red-50 border-2 border-red-300' : 
              uploadStatus.type === 'success' ? 'bg-green-50 border-2 border-green-300' :
              'bg-blue-50 border-2 border-blue-300'
            }`} style={{ borderRadius: '10px' }}>
              <p className={`text-sm font-medium ${
                uploadStatus.type === 'error' ? 'text-red-700' :
                uploadStatus.type === 'success' ? 'text-green-700' :
                'text-blue-700'
              }`}>{uploadStatus.message}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이벤트명 <span style={{ color: 'red' }}>*</span>
              </label>
              <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="예: 수학편지 신청 이벤트" style={{ borderRadius: '10px' }} required />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows="3" placeholder="이벤트에 대한 간단한 설명" style={{ borderRadius: '10px' }} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                랜딩페이지 URL <span style={{ color: 'red' }}>*</span>
              </label>
              <input type="url" value={formData.landing_url} onChange={(e) => setFormData(prev => ({ ...prev, landing_url: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="https://example.com/event" style={{ borderRadius: '10px' }} required />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                템플릿 이미지 <span style={{ color: 'red' }}>*</span>
              </label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full px-3 py-2 border border-gray-300 rounded-lg" style={{ borderRadius: '10px' }} disabled={uploading} />
            </div>
            
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-300 shadow-md" style={{ borderRadius: '10px' }}>
              <label className="block text-sm font-bold text-gray-700 mb-3 text-center">📍 QR코드 위치를 선택하세요</label>
              <div className="relative inline-block border-4 border-blue-400 rounded bg-white shadow-xl w-full" style={{ borderRadius: '10px', minHeight: '450px' }}>
                {uploading ? (
                  <div className="flex items-center justify-center" style={{ minHeight: '450px' }}>
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                      <p className="text-sm text-blue-700 font-medium">⏳ 이미지 업로드 중...</p>
                    </div>
                  </div>
                ) : (previewUrl || formData.template_image_url) ? (
                  <QRImageSelector imageUrl={previewUrl || formData.template_image_url} position={formData.qr_position} onPositionChange={(pos) => setFormData(prev => ({ ...prev, qr_position: pos }))} />
                ) : (
                  <div className="flex items-center justify-center" style={{ minHeight: '450px' }}>
                    <div className="text-center text-gray-400">
                      <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">이미지를 선택해주세요</p>
                    </div>
                  </div>
                )}
              </div>
              {formData.qr_position && formData.qr_position.width > 0 && (
                <div className="mt-3 p-2 bg-green-50 rounded border border-green-300" style={{ borderRadius: '10px' }}>
                  <p className="text-xs text-green-700 font-medium text-center">✅ QR 위치가 선택되었습니다!</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                <input type="date" value={formData.start_date} onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" style={{ borderRadius: '10px' }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                <input type="date" value={formData.end_date} onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" style={{ borderRadius: '10px' }} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
              <select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" style={{ borderRadius: '10px' }}>
                <option value="active">진행중</option>
                <option value="scheduled">예정</option>
                <option value="inactive">비활성</option>
                <option value="ended">종료</option>
              </select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button type="submit" disabled={saving || uploading} className="w-full py-3 flex items-center justify-center gap-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-bold" style={{ backgroundColor: '#4A9B8E', borderRadius: '10px', fontSize: '15px' }}>
                <Plus size={18} />
                {saving ? '생성 중...' : '생성하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function EditEventModal({ event, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: event.name || '', description: event.description || '', landing_url: event.landing_url || '', template_image_url: event.template_image_url || '',
    qr_position: event.qr_position || { x: 0, y: 0, width: 0, height: 0 }, status: event.status || 'active', start_date: event.start_date || '', end_date: event.end_date || ''
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' })
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    setUploadStatus({ type: 'uploading', message: '이미지 업로드 중...' })
    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `event-templates/${fileName}`
      const { error: uploadError } = await supabase.storage.from('event-images').upload(filePath, file)
      if (uploadError) {
        setUploadStatus({ type: 'error', message: '이미지 업로드 실패: ' + uploadError.message })
        setUploading(false)
        return
      }
      
      // Supabase URL로 직접 Public URL 구성
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sgxnxbhbyvrmgrzhosyh.supabase.co'
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/event-images/${filePath}`
      console.log('🔗 EditModal - 구성한 Public URL:', publicUrl)
      
      setFormData(prev => ({ ...prev, template_image_url: publicUrl }))
      setUploadStatus({ type: 'success', message: '✅ 이미지 업로드 완료!' })
    } catch (error) {
      setUploadStatus({ type: 'error', message: '이미지 업로드 중 오류 발생' })
    } finally {
      setUploading(false)
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.landing_url) {
      setUploadStatus({ type: 'error', message: '필수 항목을 입력해주세요.' })
      return
    }
    if (uploading) {
      setUploadStatus({ type: 'error', message: '이미지 업로드가 진행 중입니다.' })
      return
    }
    if (!formData.template_image_url) {
      setUploadStatus({ type: 'error', message: '템플릿 이미지를 업로드해주세요.' })
      return
    }
    if (!formData.qr_position || formData.qr_position.width === 0) {
      setUploadStatus({ type: 'error', message: 'QR 코드 위치를 선택해주세요.' })
      return
    }
    try {
      setSaving(true)
      setUploadStatus({ type: 'uploading', message: '이벤트 수정 중...' })
      const { error } = await supabase.from('events').update(formData).eq('id', event.id)
      if (error) throw error
      setUploadStatus({ type: 'success', message: '✅ 이벤트가 성공적으로 수정되었습니다!' })
      setTimeout(onSuccess, 500)
    } catch (error) {
      setUploadStatus({ type: 'error', message: '❌ 이벤트 수정에 실패했습니다: ' + error.message })
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto" style={{ paddingTop: '2rem' }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative" style={{ borderRadius: '10px' }}>
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          {/* 나가기 버튼 - 상단 왼쪽 */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors font-medium z-10"
            style={{ fontSize: '14px' }}
          >
            <ArrowLeft size={18} />
            나가기
          </button>
          
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="flex items-center gap-1.5 mb-4">
              <img src="/images/logo.png" alt="LAS Logo" className="w-10 h-10 object-contain" onError={(e) => e.target.style.display = 'none'} />
              <h2 className="font-bold" style={{ color: '#249689', fontSize: '28px' }}>이벤트 수정하기</h2>
            </div>
          </div>
          
          {uploadStatus.message && (
            <div className={`mb-4 p-3 rounded-lg ${
              uploadStatus.type === 'error' ? 'bg-red-50 border-2 border-red-300' : 
              uploadStatus.type === 'success' ? 'bg-green-50 border-2 border-green-300' :
              'bg-blue-50 border-2 border-blue-300'
            }`} style={{ borderRadius: '10px' }}>
              <p className={`text-sm font-medium ${
                uploadStatus.type === 'error' ? 'text-red-700' :
                uploadStatus.type === 'success' ? 'text-green-700' :
                'text-blue-700'
              }`}>{uploadStatus.message}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이벤트명 <span style={{ color: 'red' }}>*</span>
              </label>
              <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="예: 수학편지 신청 이벤트" style={{ borderRadius: '10px' }} required />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows="3" placeholder="이벤트에 대한 간단한 설명" style={{ borderRadius: '10px' }} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                랜딩페이지 URL <span style={{ color: 'red' }}>*</span>
              </label>
              <input type="url" value={formData.landing_url} onChange={(e) => setFormData(prev => ({ ...prev, landing_url: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="https://example.com/event" style={{ borderRadius: '10px' }} required />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                템플릿 이미지 <span style={{ color: 'red' }}>*</span>
              </label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full px-3 py-2 border border-gray-300 rounded-lg" style={{ borderRadius: '10px' }} disabled={uploading} />
            </div>
            
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-300 shadow-md" style={{ borderRadius: '10px' }}>
              <label className="block text-sm font-bold text-gray-700 mb-3 text-center">📍 QR코드 위치를 선택하세요</label>
              <div className="relative inline-block border-4 border-blue-400 rounded bg-white shadow-xl w-full" style={{ borderRadius: '10px', minHeight: '450px' }}>
                {uploading ? (
                  <div className="flex items-center justify-center" style={{ minHeight: '450px' }}>
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                      <p className="text-sm text-blue-700 font-medium">⏳ 이미지 업로드 중...</p>
                    </div>
                  </div>
                ) : (previewUrl || formData.template_image_url) ? (
                  <QRImageSelector imageUrl={previewUrl || formData.template_image_url} position={formData.qr_position} onPositionChange={(pos) => setFormData(prev => ({ ...prev, qr_position: pos }))} />
                ) : (
                  <div className="flex items-center justify-center" style={{ minHeight: '450px' }}>
                    <div className="text-center text-gray-400">
                      <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">이미지를 선택해주세요</p>
                    </div>
                  </div>
                )}
              </div>
              {formData.qr_position && formData.qr_position.width > 0 && (
                <div className="mt-3 p-2 bg-green-50 rounded border border-green-300" style={{ borderRadius: '10px' }}>
                  <p className="text-xs text-green-700 font-medium text-center">✅ QR 위치가 선택되었습니다!</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                <input type="date" value={formData.start_date} onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" style={{ borderRadius: '10px' }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                <input type="date" value={formData.end_date} onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" style={{ borderRadius: '10px' }} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
              <select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" style={{ borderRadius: '10px' }}>
                <option value="active">진행중</option>
                <option value="scheduled">예정</option>
                <option value="inactive">비활성</option>
                <option value="ended">종료</option>
              </select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button type="submit" disabled={saving || uploading} className="w-full py-3 flex items-center justify-center gap-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-bold" style={{ backgroundColor: '#4A9B8E', borderRadius: '10px', fontSize: '15px' }}>
                <Plus size={18} />
                {saving ? '저장 중...' : '수정하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}