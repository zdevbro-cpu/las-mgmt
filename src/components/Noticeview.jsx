import React, { useState, useEffect } from 'react'
import { Bell, ArrowLeft, Briefcase } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function NoticeView({ user, onNavigate, onLogout }) {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)

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
        .limit(5) // 최근 5개만 표시

      if (error) throw error
      setNotices(data || [])
    } catch (error) {
      console.error('공지사항 로드 오류:', error)
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

  const handleWorkClick = () => {
    console.log('일반업무 버튼 클릭')
    onNavigate('Dashboard')
  }

  const handleBackClick = () => {
    console.log('나가기 버튼 클릭 - 로그인 페이지로')
    onNavigate('login')
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full mx-auto px-4 py-6 max-w-2xl">
        {/* 헤더 - 나가기와 타이틀 같은 줄 */}
        <div className="flex items-center justify-center relative mb-6">
          {/* 나가기 버튼 - 절대 위치 왼쪽 */}
          <button
            onClick={handleBackClick}
            className="absolute left-0 flex items-center gap-1 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} style={{ color: '#249689' }} />
            <span className="text-sm font-medium" style={{ color: '#249689' }}>나가기</span>
          </button>

          {/* 로고 + 타이틀 중앙 */}
          <div className="flex items-center gap-2">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-10 h-10 object-cover"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="font-bold text-2xl" style={{ color: '#249689' }}>
              공지사항
            </h1>
          </div>
        </div>

        {/* 공지사항 목록 */}
        <div className="mb-8 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-pulse">불러오는 중...</div>
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell size={40} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">등록된 공지사항이 없습니다.</p>
            </div>
          ) : (
            notices.map((notice) => (
              <div
                key={notice.id}
                className="border rounded-lg p-4"
                style={{ borderColor: '#e5e7eb', backgroundColor: '#fafafa' }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-base break-words flex-1" style={{ color: '#249689' }}>
                    {notice.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <span>{notice.author_name}</span>
                  <span>•</span>
                  <span>{formatDate(notice.created_at)}</span>
                </div>
                <div
                  className="text-gray-700 whitespace-pre-wrap break-words text-sm leading-relaxed"
                >
                  {notice.content}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 하단 일반업무 버튼 */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleWorkClick}
              className="w-full py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689' }}
            >
              <Briefcase size={20} />
              일반업무
            </button>
          </div>
        </div>

        {/* 하단 여백 (고정 버튼 공간 확보) */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}