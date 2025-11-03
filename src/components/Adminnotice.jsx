import React, { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Edit2, Trash2, Bell } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { canAccessManagement } from '../constants/roles'

export default function AdminNotice({ user, onNavigate }) {
  const [notices, setNotices] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingNotice, setEditingNotice] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  })
  const [loading, setLoading] = useState(false)

  // 관리자 권한 확인 (canAccessManagement 사용)
  const isManager = canAccessManagement(user)

  useEffect(() => {
    console.log('=== AdminNotice 디버깅 ===')
    console.log('user:', user)
    console.log('user.user_type:', user?.user_type)
    console.log('isManager:', isManager)
    console.log('=======================')
    
    // 권한 없는 사용자 체크
    if (!isManager) {
      alert('작성권한이 없습니다.')
      onNavigate('AdminDashboard')
      return
    }
    
    loadNotices()
  }, [])

  const loadNotices = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotices(data || [])
    } catch (error) {
      console.error('공지사항 로드 오류:', error)
      alert('공지사항을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }

    try {
      setLoading(true)

      if (editingNotice) {
        // 수정
        console.log('=== 공지사항 수정 시도 ===')
        console.log('수정할 데이터:', {
          title: formData.title,
          content: formData.content,
          updated_at: new Date().toISOString()
        })
        
        const { error } = await supabase
          .from('notices')
          .update({
            title: formData.title,
            content: formData.content,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingNotice.id)

        if (error) {
          console.error('수정 에러:', error)
          throw error
        }
        alert('공지사항이 수정되었습니다.')
      } else {
        // 신규 등록
        console.log('=== 공지사항 신규 등록 시도 ===')
        console.log('user 객체:', user)
        console.log('등록할 데이터:', {
          title: formData.title,
          content: formData.content,
          notice_type: 'normal',
          branch: user.branch,
          author_id: user.id,
          author_name: user.name,
          author_role: user.user_type,
          is_important: false
        })
        
        const { data, error } = await supabase
          .from('notices')
          .insert([{
            title: formData.title,
            content: formData.content,
            notice_type: 'normal',
            branch: user.branch,
            author_id: user.id,
            author_name: user.name,
            author_role: user.user_type,
            is_important: false
          }])
          .select()

        console.log('Insert 결과 data:', data)
        console.log('Insert 결과 error:', error)

        if (error) {
          console.error('등록 에러 상세:', JSON.stringify(error, null, 2))
          alert(`공지사항 저장 실패:\n${error.message}\n상세: ${error.details || error.hint || '없음'}`)
          throw error
        }
        alert('공지사항이 등록되었습니다.')
      }

      setFormData({ title: '', content: '' })
      setIsEditing(false)
      setEditingNotice(null)
      loadNotices()
    } catch (error) {
      console.error('공지사항 저장 오류:', error)
      console.error('에러 전체 객체:', JSON.stringify(error, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (notice) => {
    setEditingNotice(notice)
    setFormData({
      title: notice.title,
      content: notice.content
    })
    setIsEditing(true)
  }

  const handleDelete = async (noticeId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', noticeId)

      if (error) throw error
      alert('공지사항이 삭제되었습니다.')
      loadNotices()
    } catch (error) {
      console.error('공지사항 삭제 오류:', error)
      alert('공지사항 삭제에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditingNotice(null)
    setFormData({ title: '', content: '' })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full mx-auto px-3 py-4 max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-3">
          {/* 헤더 - 나가기와 타이틀 같은 줄 */}
          <div className="flex items-center justify-center relative mb-6">
            {/* 나가기 버튼 - 매장관리 대시보드로 */}
            <button
              onClick={() => onNavigate('AdminDashboard')}
              className="absolute left-0 flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} style={{ color: '#249689' }} />
              <span className="text-sm font-medium" style={{ color: '#249689' }}>나가기</span>
            </button>

            {/* 로고 + 타이틀 중앙 */}
            <div className="flex items-center gap-2">
              <img 
                src="/images/logo.png" 
                alt="LAS Logo" 
                className="w-8 h-8 object-cover"
                onError={(e) => e.target.style.display = 'none'}
              />
              <h2 className="font-bold text-lg" style={{ color: '#249689' }}>
                공지사항관리
              </h2>
            </div>
          </div>

          {/* 공지사항 목록 */}
          <div className="space-y-3 mb-4">
            {loading && notices.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                불러오는 중...
              </div>
            ) : notices.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Bell size={36} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm">등록된 공지사항이 없습니다.</p>
              </div>
            ) : (
              notices.map((notice) => (
                <div
                  key={notice.id}
                  className="border-2 rounded-lg p-3 hover:shadow-md transition-shadow"
                  style={{ borderColor: '#e5e7eb' }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold mb-1 text-sm break-words" style={{ color: '#249689' }}>
                        {notice.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="truncate">{notice.author_name}</span>
                        <span>•</span>
                        <span>{formatDate(notice.created_at)}</span>
                        {notice.updated_at !== notice.created_at && (
                          <>
                            <span>•</span>
                            <span className="text-orange-600">수정됨</span>
                          </>
                        )}
                      </div>
                    </div>

                    {isManager && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(notice)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          disabled={loading}
                        >
                          <Edit2 size={16} style={{ color: '#249689' }} />
                        </button>
                        <button
                          onClick={() => handleDelete(notice.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={loading}
                        >
                          <Trash2 size={16} style={{ color: '#dc2626' }} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div
                    className="text-gray-700 whitespace-pre-wrap break-words text-sm"
                    style={{ lineHeight: '1.6' }}
                  >
                    {notice.content}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 공지사항 작성 버튼 - 관리자만 */}
          {isManager && !isEditing && (
            <div className="mb-3">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-3 flex items-center justify-center gap-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity text-sm"
                style={{ backgroundColor: '#17a2b8' }}
              >
                <Plus size={18} />
                공지사항 작성
              </button>
            </div>
          )}

          {/* 작성/수정 폼 */}
          {isEditing && isManager && (
            <div className="mt-4 p-3 border-2 rounded-lg" style={{ borderColor: '#249689', backgroundColor: '#f0fdf4' }}>
              <h3 className="font-bold mb-3 text-sm" style={{ color: '#249689' }}>
                {editingNotice ? '공지사항 수정' : '새 공지사항 작성'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block mb-1 font-bold text-xs" style={{ color: '#000000' }}>
                    제목
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="공지사항 제목을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-xs" style={{ color: '#000000' }}>
                    내용
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="공지사항 내용을 입력하세요"
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm resize-none"
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
                    style={{ backgroundColor: '#249689' }}
                  >
                    {loading ? '처리중...' : editingNotice ? '수정하기' : '등록하기'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 py-2 font-bold rounded-lg hover:bg-gray-100 transition-colors border-2 text-sm"
                    style={{ borderColor: '#d1d5db', color: '#6b7280' }}
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}