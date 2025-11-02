import React, { useState, useEffect } from 'react'
import { ArrowLeft, Bell } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function NoticeViewOnly({ user, onNavigate }) {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
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
            {/* 나가기 버튼 - 일반업무 대시보드로 */}
            <button
              onClick={() => onNavigate('Dashboard')}
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
                공지사항
              </h2>
            </div>

            {/* 일반업무 버튼 - 오른쪽 */}
            <button
              onClick={() => onNavigate('Dashboard')}
              className="absolute right-0 flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium" style={{ color: '#249689' }}>일반업무</span>
              <ArrowLeft size={18} style={{ color: '#249689', transform: 'rotate(180deg)' }} />
            </button>
          </div>

          {/* 공지사항 목록 - 읽기 전용 */}
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
                  className="border-2 rounded-lg p-3"
                  style={{ borderColor: '#e5e7eb', backgroundColor: '#fafafa' }}
                >
                  <h3 className="font-bold mb-1 text-sm break-words" style={{ color: '#249689' }}>
                    {notice.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-2">
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
        </div>
      </div>
    </div>
  )
}