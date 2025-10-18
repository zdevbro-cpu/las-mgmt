import { useState } from 'react'
import { LogOut, FileText, ShoppingCart, Package, Truck, User, Shield } from 'lucide-react'
import { isBranchManager, LOGIN_MODES } from '../constants/roles'

export default function Dashboard({ user, onNavigate, onLogout, onSwitchMode }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto p-6">
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

          {/* ✅ 점장이면 관리자 모드로 전환 안내 */}
          {isBranchManager(user) && (
            <div className="mb-6 p-4 rounded-lg border-2" style={{ backgroundColor: '#fef3c7', borderColor: '#f59e0b' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={20} style={{ color: '#f59e0b' }} />
                  <div>
                    <p className="font-bold" style={{ color: '#92400e', fontSize: '14px' }}>
                      👑 점장님이시군요!
                    </p>
                    <p className="text-xs" style={{ color: '#92400e' }}>
                      지점 관리가 필요하시면 관리자 모드로 전환하세요
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onSwitchMode && onSwitchMode(LOGIN_MODES.MANAGER)}
                  className="px-4 py-2 bg-white border-2 rounded-lg hover:bg-gray-50 font-bold transition-colors text-sm"
                  style={{ borderColor: '#f59e0b', color: '#92400e', borderRadius: '10px' }}
                >
                  🛡️ 관리자 모드
                </button>
              </div>
            </div>
          )}
          
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
              onClick={() => onNavigate('workDiary')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <FileText size={20} />
              근무일지
            </button>
            
            <button
              onClick={() => onNavigate('customerManagement')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <ShoppingCart size={20} />
              판매관리
            </button>
            
            <button
              onClick={() => onNavigate('shippingList')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <Truck size={20} />
              배송목록
            </button>
            
            <button
              onClick={() => onNavigate('purchaseHistory')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <Package size={20} />
              구매내역
            </button>
            
            <button
              onClick={onLogout}
              className="w-full py-4 font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
              style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
            >
              <LogOut size={20} />
              나가기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
