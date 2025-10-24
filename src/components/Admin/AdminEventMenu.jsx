import React, { useState, useEffect, useRef } from 'react'
import { LogOut, BarChart3, FileText, ArrowLeft } from 'lucide-react'

export default function AdminEventMenu({ user, onNavigate, onLogout, onBack }) {
  // 시스템관리자인 경우에만 템플릿 관리 표시
  const isSystemAdmin = user?.user_type === '시스템관리자'

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-center gap-1.5 mb-8">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-10 h-10 object-contain"
            />
            <h2 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
              이벤트 관리
            </h2>
          </div>

          {/* 사용자 정보 */}
          <div className="grid grid-cols-2 gap-1.5 mb-8">
            <div>
              <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                🏢 지점명
              </label>
              <input
                type="text"
                value={user?.branch || ''}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
              />
            </div>
            <div>
              <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                👤 이름
              </label>
              <input
                type="text"
                value={user?.name || ''}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
              />
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="space-y-4">
            {/* 1. 이벤트 대시보드 (참가자 관리) */}
            <button
              onClick={() => {
                console.log('🧭 Navigate to: adminEvent')
                onNavigate('adminEvent')
              }}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#4A9B8E', borderRadius: '10px', fontSize: '15px' }}
            >
              <BarChart3 size={20} />
              이벤트 대시보드
            </button>

            {/* 2. 이벤트 템플릿 관리 */}
            <button
              onClick={() => {
                console.log('🧭 Navigate to: AdminEventManager')
                onNavigate('AdminEventManager')
              }}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#5B9BD5', borderRadius: '10px', fontSize: '15px' }}
            >
              <FileText size={20} />
              이벤트 템플릿 관리
            </button>

            {/* 3. 나가기 */}
            <button
              onClick={() => {
                console.log('🧭 Navigate back')
                if (onBack) {
                  onBack()
                } else if (isSystemAdmin) {
                  onNavigate('SystemAdminDashboard')
                } else {
                  onNavigate('AdminDashboard')
                }
              }}
              className="w-full py-4 font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
              style={{ color: '#000000', border: '2px solid #A5AEE3', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
            >
              <ArrowLeft size={20} />
              나가기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}