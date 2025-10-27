import React, { useState, useEffect, useRef } from 'react'
import { LogOut, Users, ShoppingCart, Building2, Package, Truck, BarChart3 } from 'lucide-react'

export default function SystemAdminDashboard({ user, onNavigate, onLogout }) {
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
              시스템관리
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mb-8">
            <div>
              <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                🏢 지점명
              </label>
              <input
                type="text"
                value={user?.branch || '본사'}
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
              onClick={() => onNavigate('SystemAdminUsers')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <Users size={20} />
              직원정보관리
            </button>

            <button
              onClick={() => onNavigate('SystemAdminBranches')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <Building2 size={20} />
              지점관리
            </button>

            <button
              onClick={() => onNavigate('SystemAdminShipping')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <Truck size={20} />
              주문목록관리
            </button>

            <button
              onClick={() => onNavigate('SystemAdminPurchases')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <Package size={20} />
              구매이력조회
            </button>

            <button
              onClick={() => onNavigate('SystemAdminCustomers')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <ShoppingCart size={20} />
              구매자정보
            </button>

            {/* ⭐ 이벤트 관리로 이동 */}
            <button
              onClick={() => {
                console.log('🧭 Navigate to: AdminEventMenu')
                onNavigate('AdminEventMenu')
              }}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#dc2626', borderRadius: '10px', fontSize: '15px' }}
            >
              <BarChart3 size={20} />
              이벤트관리
            </button>

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