import React from 'react'
import { Bell } from 'lucide-react'

export default function NoticeFloatingButton({ onNavigate }) {
  return (
    <button
      onClick={() => onNavigate('AdminNotice')}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50"
      style={{ backgroundColor: '#249689' }}
      aria-label="공지사항 보기"
    >
      <Bell size={24} color="white" />
    </button>
  )
}