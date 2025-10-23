import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
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
      let query = supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

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
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onBack}
              className="flex items-center gap-2 font-bold hover:opacity-70 transition-opacity"
              style={{ color: '#249689', fontSize: '15px' }}
            >
              <ArrowLeft size={20} />
              나가기
            </button>
            <div className="flex items-center gap-1.5">
              <img 
                src="/images/logo.png" 
                alt="LAS Logo" 
                className="w-10 h-10 object-contain"
              />
              <h2 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
                이벤트 템플릿 관리
              </h2>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 font-bold"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <span>➕</span>새 이벤트 만들기
            </button>
          </div>

          {/* 안내 메시지 */}
          <div className="mb-6 p-3 rounded-lg" style={{ backgroundColor: '#f0f9ff', border: '2px solid #3b82f6' }}>
            <p className="text-sm" style={{ color: '#1e40af' }}>
              ℹ️ 이벤트 템플릿을 생성하고 관리합니다
            </p>
          </div>

          <div className="flex gap-2 border-b border-gray-200">
            {[
              { value: 'all', label: '전체' },
              { value: 'active', label: '진행중' },
              { value: 'scheduled', label: '예정' },
              { value: 'ended', label: '종료' },
              { value: 'inactive', label: '비활성' }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-4 py-2 font-medium transition-colors ${
                  filter === tab.value ? 'border-b-2' : 'text-gray-600 hover:text-gray-900'
                }`}
                style={filter === tab.value ? { color: '#249689', borderColor: '#249689' } : {}}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#249689' }}></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm border">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-gray-600 mb-4">등록된 이벤트가 없습니다</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 text-white rounded-lg hover:opacity-90"
              style={{ backgroundColor: '#249689' }}
            >
              첫 이벤트 만들기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} onRefresh={fetchEvents} />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchEvents()
          }}
        />
      )}
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
      alert('상태 변경에 실패했습니다.')
    }
  }

  const deleteEvent = async () => {
    if (!confirm('정말 이 이벤트를 삭제하시겠습니까?')) return
    try {
      const { error } = await supabase.from('events').delete().eq('id', event.id)
      if (error) throw error
      alert('삭제되었습니다.')
      onRefresh()
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: '진행중', color: 'bg-green-100 text-green-800' },
      inactive: { text: '비활성', color: 'bg-gray-100 text-gray-800' },
      scheduled: { text: '예정', color: 'bg-blue-100 text-blue-800' },
      ended: { text: '종료', color: 'bg-red-100 text-red-800' }
    }
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
          <div className="h-48 bg-gray-100 relative overflow-hidden">
            <img 
              src={event.template_image_url} 
              alt={event.name} 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><span>이미지를 불러올 수 없습니다</span></div>'
              }}
            />
          </div>
        ) : (
          <div className="h-48 bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400">이미지 없음</span>
          </div>
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
            <button
              onClick={toggleStatus}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
            >
              <span>{event.status === 'active' ? '👁️‍🗨️' : '👁️'}</span>
              {event.status === 'active' ? '비활성화' : '활성화'}
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="px-3 py-2 rounded hover:opacity-80"
              style={{ backgroundColor: '#249689', color: 'white' }}
            >
              ✏️
            </button>
            <button onClick={deleteEvent} className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200">
              🗑️
            </button>
          </div>
        </div>
      </div>
      {showEditModal && <EditEventModal event={event} onClose={() => setShowEditModal(false)} onSuccess={() => { setShowEditModal(false); onRefresh(); }} />}
    </>
  )
}

function QRPositionSelector({ imageUrl, position, onPositionChange }) {
  const [isSelecting, setIsSelecting] = useState(false)
  const [startPos, setStartPos] = useState(null)
  const [currentPos, setCurrentPos] = useState(null)
  const [imageScale, setImageScale] = useState({ scaleX: 1, scaleY: 1 })
  const containerRef = useRef(null)
  const imgRef = useRef(null)

  // 이미지 로드 시 스케일 계산
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      calculateScale()
    }
  }, [imageUrl])

  const calculateScale = () => {
    if (!imgRef.current) return
    const naturalWidth = imgRef.current.naturalWidth
    const naturalHeight = imgRef.current.naturalHeight
    const displayWidth = imgRef.current.clientWidth
    const displayHeight = imgRef.current.clientHeight
    
    setImageScale({
      scaleX: naturalWidth / displayWidth,
      scaleY: naturalHeight / displayHeight
    })
    
    console.log('📐 이미지 스케일:', {
      natural: `${naturalWidth}x${naturalHeight}`,
      display: `${displayWidth}x${displayHeight}`,
      scale: `${naturalWidth / displayWidth}x${naturalHeight / displayHeight}`
    })
  }

  const handleMouseDown = (e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setStartPos({ x, y })
    setIsSelecting(true)
  }

  const handleMouseMove = (e) => {
    if (!isSelecting || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setCurrentPos({ x, y })
  }

  const handleMouseUp = () => {
    if (!isSelecting || !startPos || !currentPos) return
    
    const x = Math.min(startPos.x, currentPos.x)
    const y = Math.min(startPos.y, currentPos.y)
    const width = Math.abs(currentPos.x - startPos.x)
    const height = Math.abs(currentPos.y - startPos.y)
    
    // 실제 이미지 크기로 변환
    const realX = Math.round(x * imageScale.scaleX)
    const realY = Math.round(y * imageScale.scaleY)
    const realWidth = Math.round(width * imageScale.scaleX)
    const realHeight = Math.round(height * imageScale.scaleY)
    
    console.log('✅ 선택된 좌표 (화면):', { x, y, width, height })
    console.log('✅ 변환된 좌표 (실제):', { x: realX, y: realY, width: realWidth, height: realHeight })
    
    onPositionChange({ 
      x: realX, 
      y: realY, 
      width: realWidth, 
      height: realHeight 
    })
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
    return { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` }
  }

  const getQRBoxStyle = () => {
    if (!position || position.width === 0) return {}
    // 실제 좌표를 화면 좌표로 역변환
    const displayX = position.x / imageScale.scaleX
    const displayY = position.y / imageScale.scaleY
    const displayWidth = position.width / imageScale.scaleX
    const displayHeight = position.height / imageScale.scaleY
    return { 
      left: `${displayX}px`, 
      top: `${displayY}px`, 
      width: `${displayWidth}px`, 
      height: `${displayHeight}px` 
    }
  }

  if (!imageUrl) return null

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
      <label className="block text-sm font-bold text-gray-700 mb-2">📍 QR 코드 위치 선택</label>
      <p className="text-xs text-gray-600 mb-3 bg-blue-50 p-2 rounded border border-blue-200">
        💡 <strong>사용방법:</strong> 이미지에서 마우스로 드래그하여 QR 코드가 들어갈 영역을 선택하세요
      </p>
      
      <div className="relative inline-block border-2 border-gray-400 rounded bg-white shadow-lg">
        <div
          ref={containerRef}
          className="relative cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img 
            ref={imgRef}
            src={imageUrl} 
            alt="Template" 
            className="max-w-full h-auto block" 
            style={{ maxHeight: '500px' }} 
            draggable={false}
            onLoad={calculateScale}
          />
          
          {isSelecting && startPos && currentPos && (
            <div className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-30 pointer-events-none" style={getSelectionStyle()} />
          )}
          
          {!isSelecting && position && position.width > 0 && (
            <div className="absolute border-2 border-green-500 bg-green-200 bg-opacity-40 pointer-events-none flex items-center justify-center" style={getQRBoxStyle()}>
              <span className="text-xs font-bold text-green-700 bg-white px-2 py-1 rounded shadow">QR</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-3 p-3 bg-white rounded border border-gray-300 text-sm text-gray-700">
        <div className="grid grid-cols-2 gap-2">
          <div><strong>X 위치:</strong> {position?.x || 0}px</div>
          <div><strong>Y 위치:</strong> {position?.y || 0}px</div>
          <div><strong>너비:</strong> {position?.width || 0}px</div>
          <div><strong>높이:</strong> {position?.height || 0}px</div>
        </div>
      </div>
    </div>
  )
}

function CreateEventModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    landing_url: '',
    template_image_url: '',
    qr_position: { x: 0, y: 0, width: 0, height: 0 },
    status: 'active',
    start_date: '',
    end_date: ''
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // 즉시 미리보기를 위해 로컬 URL 생성
    const localUrl = URL.createObjectURL(file)
    setFormData({ ...formData, template_image_url: localUrl })

    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `event-templates/${fileName}`

      console.log('📤 파일 업로드 시작:', filePath)
      console.log('📁 파일 정보:', {
        name: file.name,
        size: file.size,
        type: file.type
      })
      
      const { data, error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, file)
      
      console.log('📦 업로드 응답:', { data, error: uploadError })
      
      if (uploadError) {
        console.error('❌ Storage 업로드 실패:', uploadError)
        alert('⚠️ 이미지 업로드 실패: ' + uploadError.message + '\n\nStorage 설정을 확인해주세요.')
        // 로컬 미리보기는 유지하지만 저장 버튼 비활성화를 위해 표시
        setUploading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(filePath)
      console.log('✅ Storage URL:', publicUrl)
      
      setFormData({ ...formData, template_image_url: publicUrl })
      alert('✅ 이미지 업로드 성공!')
    } catch (error) {
      console.error('❌ 이미지 업로드 에러:', error)
      alert('이미지 업로드 중 오류가 발생했습니다: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.landing_url || !formData.template_image_url) {
      alert('필수 항목을 모두 입력해주세요.')
      return
    }

    if (!formData.qr_position || formData.qr_position.width === 0) {
      alert('QR 코드 위치를 선택해주세요.')
      return
    }

    try {
      setSaving(true)
      const { error } = await supabase.from('events').insert([formData])
      if (error) throw error
      alert('이벤트가 생성되었습니다.')
      onSuccess()
    } catch (error) {
      console.error('이벤트 생성 실패:', error)
      alert('이벤트 생성에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: '#249689' }}>새 이벤트 만들기</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이벤트명 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="예: 수학편지 신청 이벤트"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="3"
                placeholder="이벤트에 대한 간단한 설명"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">랜딩페이지 URL *</label>
              <input
                type="url"
                value={formData.landing_url}
                onChange={(e) => setFormData({ ...formData, landing_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="https://example.com/event"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">템플릿 이미지 *</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={uploading}
              />
              {uploading && <p className="text-sm text-blue-600 mt-1 font-medium">⏳ Storage 업로드 중...</p>}
              {formData.template_image_url && !uploading && (
                <p className="text-sm text-green-600 mt-1 font-medium">✅ 이미지 선택됨 (미리보기 아래에서 확인)</p>
              )}
            </div>

            {/* QR 위치 수동 입력 */}
            <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <label className="block text-sm font-bold text-gray-700 mb-2">📍 QR 코드 위치 설정</label>
              <p className="text-xs text-gray-600 mb-3">
                {formData.template_image_url 
                  ? "💡 이미지에서 드래그하여 QR 위치를 선택하거나, 아래에서 직접 입력하세요"
                  : "💡 먼저 이미지를 업로드하면 드래그로 선택할 수 있습니다. 또는 아래에 직접 입력하세요"}
              </p>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">X 위치 (px)</label>
                  <input
                    type="number"
                    value={formData.qr_position.x}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      qr_position: { ...formData.qr_position, x: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Y 위치 (px)</label>
                  <input
                    type="number"
                    value={formData.qr_position.y}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      qr_position: { ...formData.qr_position, y: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">너비 (px)</label>
                  <input
                    type="number"
                    value={formData.qr_position.width}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      qr_position: { ...formData.qr_position, width: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">높이 (px)</label>
                  <input
                    type="number"
                    value={formData.qr_position.height}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      qr_position: { ...formData.qr_position, height: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="100"
                  />
                </div>
              </div>
            </div>

            {formData.template_image_url && (
              <QRPositionSelector
                imageUrl={formData.template_image_url}
                position={formData.qr_position}
                onPositionChange={(pos) => setFormData({ ...formData, qr_position: pos })}
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="active">진행중</option>
                <option value="scheduled">예정</option>
                <option value="inactive">비활성</option>
                <option value="ended">종료</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#249689' }}
              >
                {saving ? '저장 중...' : '생성하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function EditEventModal({ event, onClose, onSuccess }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6">
        <p>수정 기능 준비중...</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">닫기</button>
      </div>
    </div>
  )
}