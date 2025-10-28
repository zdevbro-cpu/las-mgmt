import React, { useState, useEffect, useRef } from 'react'
import { LogOut, FileText, ShoppingCart, Truck, Package, Shield, User, BarChart3 } from 'lucide-react'
import { isMonitoringAgent, isContractWorker, isOwner, canAccessManagement } from '../constants/roles'

export default function Dashboard({ user, onNavigate, onLogout }) {
  // 모니터링요원 또는 계약근무 여부 확인
  const isMonitoring = isMonitoringAgent(user)
  const isContract = isContractWorker(user)
  const isOwnerUser = isOwner(user)

  // 제한된 메뉴만 표시해야 하는 사용자
  const hasLimitedAccess = isMonitoring

  // 계약근무는 근무일지+판매관리+내정보만 가능
  const isContractUser = isContract

  // 매장관리 접근 권한 체크 함수
  const handleAdminDashboardClick = () => {
    if (!canAccessManagement(user)) {
      alert('❌ 접근 권한이 없습니다.\n\n매장관리는 점장 또는 지점관리자만 접근 가능합니다.')
      return
    }
    onNavigate('AdminDashboard')
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
              일반업무
            </h1>
          </div>

          {/* 매장관리 배너 - 점장/지점관리자만 표시 */}
          {canAccessManagement(user) && (
            <div className="mb-6">
              <div className="p-4 rounded-lg border-2" style={{ backgroundColor: '#f0f9ff', borderColor: '#0284c7' }}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-left gap-2 flex-1">
                    <Shield size={20} style={{ color: '#0284c7' }} />
                    <div>
                      <p className="font-bold" style={{ color: '#075985', fontSize: '14px' }}>
                        🛡️ 매장관리로 이동
                      </p>
                      <p className="text-xs" style={{ color: '#075985' }}>
                        직원 관리, 근무일지 관리, 고객 관리 등을 수행하세요
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleAdminDashboardClick}
                    className="px-4 py-2 bg-white border-2 rounded-lg hover:bg-gray-50 font-bold transition-colors text-sm whitespace-nowrap"
                    style={{ borderColor: '#0284c7', color: '#075985', borderRadius: '10px' }}
                  >
                    🛡️ 매장관리
                  </button>
                </div>
              </div>
            </div>
          )}

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

          {/* 메뉴 버튼들 */}
          <div className="space-y-4">
            {/* 계약근무: 근무일지 + 판매관리만 표시 */}
            {isContractUser && (
              <>
                <button
                  onClick={() => onNavigate('WorkDiary')}
                  className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
                >
                  <FileText size={20} />
                  근무일지
                </button>

                <button
                  onClick={() => onNavigate('CustomerManagement')}
                  className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
                >
                  <ShoppingCart size={20} />
                  판매관리
                </button>
              </>
            )}

            {/* 모니터링요원이 아니고 계약근무도 아닌 경우 전체 메뉴 표시 */}
            {!hasLimitedAccess && !isContractUser && (
              <>
                <button
                  onClick={() => onNavigate('WorkDiary')}
                  className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
                >
                  <FileText size={20} />
                  근무일지
                </button>

                <button
                  onClick={() => onNavigate('CustomerManagement')}
                  className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
                >
                  <ShoppingCart size={20} />
                  판매관리
                </button>

                <button
                  onClick={() => onNavigate('ShippingList')}
                  className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
                >
                  <Truck size={20} />
                  주문목록관리
                </button>

                <button
                  onClick={() => onNavigate('PurchaseHistory')}
                  className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
                >
                  <Package size={20} />
                  구매이력조회
                </button>
              </>
            )}

            {/* 이벤트관리 버튼 - 모든 사용자 표시 */}
            <button
              onClick={() => onNavigate('AdminEventDashboard')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#dc2626', borderRadius: '10px', fontSize: '15px' }}
            >
              <BarChart3 size={20} />
              내 이벤트관리
            </button>


            {/* 내정보관리 버튼 - 모든 사용자 표시 */}
            <button
              onClick={() => onNavigate('MyInfo')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#7f95eb', borderRadius: '10px', fontSize: '15px' }}
            >
              <User size={20} />
              내정보관리
            </button>

            {/* 로그아웃 버튼 */}
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
      </div>
    </div>
  )
}