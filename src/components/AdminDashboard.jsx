import React, { useState, useEffect, useRef } from 'react'
import { LogOut, Users, FileText, ShoppingCart, UserCircle, Calendar, BarChart3, X } from 'lucide-react'
import { LOGIN_MODES, canAccessEventDashboard } from '../constants/roles'
import NoticeFloatingButton from './NoticeFloatingButton'
import SalesDashboard from './SalesDashboard'

export default function AdminDashboard({ user, onNavigate, onLogout, onSwitchMode }) {
  console.log('🎨 AdminDashboard 렌더링')
  console.log('👤 user:', user)
  console.log('📦 onSwitchMode:', onSwitchMode)

  const handleEmployeeModeClick = () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👤 일반업무 버튼 클릭됨')
    console.log('📦 onSwitchMode 존재:', !!onSwitchMode)
    console.log('📦 LOGIN_MODES.EMPLOYEE:', LOGIN_MODES.EMPLOYEE)
    
    if (!onSwitchMode) {
      console.error('❌ onSwitchMode가 undefined입니다!')
      alert('모드 전환 기능이 연결되지 않았습니다.')
      return
    }

    if (typeof onSwitchMode !== 'function') {
      console.error('❌ onSwitchMode가 함수가 아닙니다!')
      alert('모드 전환 기능에 문제가 있습니다.')
      return
    }
    
    try {
      console.log('✅ onSwitchMode 호출 시작 (EMPLOYEE 모드)')
      onSwitchMode(LOGIN_MODES.EMPLOYEE)
      console.log('✅ onSwitchMode 호출 완료')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    } catch (error) {
      console.error('❌ onSwitchMode 호출 중 에러:', error)
      alert('모드 전환 중 오류가 발생했습니다: ' + error.message)
    }
  }

  // 이벤트 대시보드 접근 권한 확인
  const showEventDashboard = canAccessEventDashboard(user)
  const [showSalesDashboard, setShowSalesDashboard] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center gap-1.5 mb-8">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-10 h-10 object-cover"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h2 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
              매장관리
            </h2>
          </div>

          {/* 일반 업무로 돌아가기 버튼 */}
          <div className="mb-6">
            <div className="p-4 rounded-lg border-2" style={{ backgroundColor: '#f0f9ff', borderColor: '#0284c7' }}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-left gap-2 flex-1">
                  <UserCircle size={20} style={{ color: '#0284c7' }} />
                  <div>
                    <p className="font-bold" style={{ color: '#075985', fontSize: '14px' }}>
                      💼 일반업무로 돌아가기
                    </p>
                    <p className="text-xs" style={{ color: '#075985' }}>
                      근무일지, 판매관리 등 일상 업무를 수행하세요
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleEmployeeModeClick}
                  className="px-4 py-2 bg-white border-2 rounded-lg hover:bg-gray-50 font-bold transition-colors text-sm whitespace-nowrap"
                  style={{ borderColor: '#0284c7', color: '#075985', borderRadius: '10px' }}
                >
                  👤 일반업무
                </button>
              </div>
            </div>
          </div>

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

          <div className="space-y-4">
            <button
              onClick={() => {
                console.log('🧭 Navigate to: AdminWorkDiary')
                onNavigate('AdminWorkDiary')
              }}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <FileText size={20} />
              근무일지관리
            </button>

            <button
              onClick={() => setShowSalesDashboard(true)}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <BarChart3 size={20} />
              판매현황
            </button>

            <button
              onClick={() => {
                console.log('🧭 Navigate to: AdminNotice')
                onNavigate('AdminNotice')
              }}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <FileText size={20} />
              공지사항관리
            </button>

            <button
              onClick={() => {
                console.log('🧭 Navigate to: WeeklyScheduleGrid')
                onNavigate('WeeklyScheduleGrid')
              }}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <Calendar size={20} />
              근무편성관리
            </button>

            <button
              onClick={() => {
                console.log('🧭 Navigate to: AdminUsers')
                onNavigate('AdminUsers')
              }}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <Users size={20} />
              직원정보관리
            </button>
            
            <button
              onClick={() => {
                console.log('🧭 Navigate to: AdminCustomers')
                onNavigate('AdminCustomers')
              }}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <ShoppingCart size={20} />
              구매고객조회
            </button>





            {/* 이벤트 대시보드 버튼 - 지점관리자와 시스템관리자만 */}
            {showEventDashboard && (
              <button
                onClick={() => {
                  console.log('🧭 Navigate to: AdminEventDashboard')
                  onNavigate('AdminEventDashboard')
                }}
                className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                style={{ backgroundColor: '#dc2626', borderRadius: '10px', fontSize: '15px' }}
              >
                <Calendar size={20} />
                매장 이벤트관리
              </button>
            )}
            
            <button
              onClick={onLogout}
              className="w-full py-4 font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
              style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
            >
              <LogOut size={20} />
              LogOut
            </button>
          </div>
        </div>
      
      {/* 공지사항 플로팅 버튼 */}
      <NoticeFloatingButton onNavigate={onNavigate} />
      </div>

      {/* 판매현황 모달 - 모바일 최적화 */}
      {showSalesDashboard && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowSalesDashboard(false)}
          />
          <div className="fixed inset-0 sm:inset-x-auto sm:inset-y-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md bg-gray-50 rounded-none sm:rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
            {/* 모달 헤더 */}
            <div className="bg-white border-b border-gray-100 px-4 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-teal-600" />
                <span className="font-black text-gray-800 text-sm">{user?.branch || '매장'} 매출현황</span>
              </div>
              <button
                onClick={() => setShowSalesDashboard(false)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            {/* 대시보드 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto p-4">
              <SalesDashboard
                user={user}
                viewMode="admin"
                branchFilter={user?.branch}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}