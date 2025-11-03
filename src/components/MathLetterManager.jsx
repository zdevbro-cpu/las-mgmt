import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Upload, Plus, X, ArrowLeft, Trash2 } from 'lucide-react'

export default function MathLetterManager({ user, onBack }) {
  const [letters, setLetters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [editingLetter, setEditingLetter] = useState(null)

  // 폼 상태
  const [formData, setFormData] = useState({
    day_number: '',
    title: '',
    video_url: '',
    thumbnail_url: '',
    description: '',
    duration: '',
    is_ready: false
  })

  useEffect(() => {
    loadLetters()
  }, [])

  const loadLetters = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('math_letters')
        .select('*')
        .order('day_number', { ascending: true })

      if (error) throw error
      setLetters(data || [])
    } catch (error) {
      console.error('편지 목록 로드 실패:', error)
      alert('목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 개별 등록/수정 모달 열기
  const handleOpenAddModal = (letter = null) => {
    if (letter) {
      setEditingLetter(letter)
      setFormData(letter)
    } else {
      setEditingLetter(null)
      setFormData({
        day_number: '',
        title: '',
        video_url: '',
        thumbnail_url: '',
        description: '',
        duration: '',
        is_ready: false
      })
    }
    setShowAddModal(true)
  }

  // 저장
  const handleSave = async () => {
    try {
      if (!formData.day_number || !formData.title) {
        alert('일차와 제목은 필수입니다.')
        return
      }

      if (editingLetter) {
        // 수정
        const { error } = await supabase
          .from('math_letters')
          .update(formData)
          .eq('id', editingLetter.id)

        if (error) throw error
        alert('수정되었습니다.')
      } else {
        // 등록
        const { error } = await supabase
          .from('math_letters')
          .insert([formData])

        if (error) throw error
        alert('등록되었습니다.')
      }

      setShowAddModal(false)
      loadLetters()
    } catch (error) {
      console.error('저장 실패:', error)
      alert('저장에 실패했습니다.')
    }
  }

  // 삭제
  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('math_letters')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('삭제되었습니다.')
      loadLetters()
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  // 배치 업로드
  const handleBatchUpload = async (jsonData) => {
    try {
      const data = JSON.parse(jsonData)
      
      if (!Array.isArray(data)) {
        alert('배열 형식의 JSON이어야 합니다.')
        return
      }

      // DB에 일괄 삽입
      const { error } = await supabase
        .from('math_letters')
        .upsert(data, { onConflict: 'day_number' })

      if (error) throw error

      alert(`${data.length}개의 컨텐츠가 업로드되었습니다.`)
      setShowBatchModal(false)
      loadLetters()
    } catch (error) {
      console.error('배치 업로드 실패:', error)
      alert('업로드에 실패했습니다.')
    }
  }

  // 전체 일차 목록 생성 (1~100일차)
  const allDays = Array.from({ length: 100 }, (_, i) => i + 1)
  const letterMap = letters.reduce((acc, letter) => {
    acc[letter.day_number] = letter
    return acc
  }, {})

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-center gap-1.5 mb-8">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-10 h-10 object-cover"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h2 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
              수학편지관리
            </h2>
          </div>

          {/* 버튼 영역 */}
          <div className="space-y-4 mb-8">
            <button
              onClick={onBack}
              className="w-full py-4 font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
              style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
            >
              <ArrowLeft size={20} />
              돌아가기
            </button>

            <button
              onClick={() => handleOpenAddModal()}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <Plus size={20} />
              개별 등록
            </button>

            <button
              onClick={() => setShowBatchModal(true)}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#5B9BD5', borderRadius: '10px', fontSize: '15px' }}
            >
              <Upload size={20} />
              배치 업로드
            </button>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">📚 전체</div>
              <div className="text-2xl font-bold" style={{ color: '#249689' }}>
                100일차
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">✅ 등록완료</div>
              <div className="text-2xl font-bold" style={{ color: '#70AD47' }}>
                {letters.filter(l => l.is_ready).length}일차
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">⏳ 준비중</div>
              <div className="text-2xl font-bold" style={{ color: '#FFA500' }}>
                {100 - letters.filter(l => l.is_ready).length}일차
              </div>
            </div>
          </div>

          {/* 목록 */}
          <div>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#249689' }}>
              📋 컨텐츠 목록
            </h3>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
              {allDays.map(day => {
                const letter = letterMap[day]
                const isReady = letter?.is_ready
                
                return (
                  <div
                    key={day}
                    onClick={() => letter && handleOpenAddModal(letter)}
                    className={`p-3 rounded-lg text-center cursor-pointer transition-all ${
                      isReady
                        ? 'bg-green-50 border-2 border-green-500 hover:bg-green-100'
                        : letter
                        ? 'bg-orange-50 border-2 border-orange-400 hover:bg-orange-100'
                        : 'bg-gray-50 border-2 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-sm font-bold mb-1">
                      {day}일차
                    </div>
                    <div className="text-xl">
                      {isReady ? '✅' : letter ? '⏳' : '➕'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 개별 등록/수정 모달 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: '#249689' }}>
                  {editingLetter ? '✏️ 컨텐츠 수정' : '➕ 컨텐츠 등록'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-bold">일차 *</label>
                    <input
                      type="number"
                      value={formData.day_number}
                      onChange={(e) => setFormData({ ...formData, day_number: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderRadius: '10px' }}
                      disabled={!!editingLetter}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-bold">영상 길이(초)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderRadius: '10px' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-bold">제목 *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderRadius: '10px' }}
                    placeholder="예: 피타고라스 정리"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-bold">영상 URL</label>
                  <input
                    type="text"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderRadius: '10px' }}
                    placeholder="https://bucket.com/videos/day1.mp4"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-bold">썸네일 URL</label>
                  <input
                    type="text"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderRadius: '10px' }}
                    placeholder="https://bucket.com/thumbnails/day1.jpg"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-bold">설명</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderRadius: '10px' }}
                    rows="3"
                    placeholder="편지 내용 설명"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_ready}
                    onChange={(e) => setFormData({ ...formData, is_ready: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <label className="font-bold">제작 완료</label>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                {editingLetter && (
                  <button
                    onClick={() => {
                      handleDelete(editingLetter.id)
                      setShowAddModal(false)
                    }}
                    className="px-6 py-3 border-2 border-red-500 text-red-500 rounded-lg font-bold hover:bg-red-50 flex items-center gap-2"
                    style={{ borderRadius: '10px' }}
                  >
                    <Trash2 size={20} />
                    삭제
                  </button>
                )}
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border-2 rounded-lg font-bold hover:bg-gray-50"
                  style={{ borderColor: '#249689', color: '#249689', borderRadius: '10px' }}
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-6 py-3 text-white rounded-lg font-bold hover:opacity-90"
                  style={{ backgroundColor: '#249689', borderRadius: '10px' }}
                >
                  {editingLetter ? '수정' : '등록'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 배치 업로드 모달 */}
        {showBatchModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-2xl w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: '#249689' }}>
                  📤 배치 업로드
                </h2>
                <button
                  onClick={() => setShowBatchModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">JSON 배열 형식으로 붙여넣기:</p>
                <textarea
                  id="batchJson"
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                  style={{ borderRadius: '10px' }}
                  rows="15"
                  placeholder={`[
  {
    "day_number": 1,
    "title": "피타고라스 정리",
    "video_url": "https://...",
    "thumbnail_url": "https://...",
    "description": "...",
    "duration": 300,
    "is_ready": true
  }
]`}
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowBatchModal(false)}
                  className="flex-1 px-6 py-3 border-2 rounded-lg font-bold hover:bg-gray-50"
                  style={{ borderColor: '#249689', color: '#249689', borderRadius: '10px' }}
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    const json = document.getElementById('batchJson').value
                    handleBatchUpload(json)
                  }}
                  className="flex-1 px-6 py-3 text-white rounded-lg font-bold hover:opacity-90"
                  style={{ backgroundColor: '#5B9BD5', borderRadius: '10px' }}
                >
                  업로드
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}