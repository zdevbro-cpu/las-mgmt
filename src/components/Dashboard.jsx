import { LogOut, FileText, ShoppingCart, Package, Truck, Shield } from 'lucide-react'
import { canAccessManagement, LOGIN_MODES } from '../constants/roles'

export default function Dashboard({ user, onNavigate, onLogout, onSwitchMode }) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎨 Dashboard 렌더링')
  console.log('👤 user:', user)
  console.log('👤 user.user_type:', user?.user_type)
  console.log('👑 canAccessManagement:', canAccessManagement(user))
  console.log('📦 onSwitchMode:', typeof onSwitchMode)
  console.log('📦 onNavigate:', typeof onNavigate)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const handleManagerModeClick = () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🛡️ 지점관리 버튼 클릭됨')
    console.log('📦 onSwitchMode 존재:', !!onSwitchMode)
    console.log('📦 onSwitchMode 타입:', typeof onSwitchMode)
    console.log('📦 LOGIN_MODES.MANAGER:', LOGIN_MODES.MANAGER)
    
    if (!onSwitchMode) {
      console.error('❌ onSwitchMode가 undefined입니다!')
      alert('모드 전환 기능이 연결되지 않았습니다. 개발자 콘솔을 확인하세요.')
      return
    }

    if (typeof onSwitchMode !== 'function') {
      console.error('❌ onSwitchMode가 함수가 아닙니다!', typeof onSwitchMode)
      alert('모드 전환 기능에 문제가 있습니다.')
      return
    }
    
    try {
      console.log('✅ onSwitchMode 호출 시작')
      onSwitchMode(LOGIN_MODES.MANAGER)
      console.log('✅ onSwitchMode 호출 완료')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    } catch (error) {
      console.error('❌ onSwitchMode 호출 중 에러:', error)
      alert('모드 전환 중 오류가 발생했습니다: ' + error.message)
    }
  }

  // 직접 adminDashboard로 이동하는 버튼 (백업)
  const handleDirectAdminNavigation = () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔄 직접 adminDashboard로 이동')
    if (onNavigate) {
      onNavigate('adminDashboard')
      console.log('✅ adminDashboard로 이동 완료')
    } else {
      console.error('❌ onNavigate가 없습니다!')
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  }

  // 점주 또는 지점관리자인지 확인
  const hasManagementAccess = canAccessManagement(user)

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

          {/* 점장 이상이면 관리자 모드 안내 */}
          {hasManagementAccess && (
            <div className="mb-6">
              <div className="p-4 rounded-lg border-2" style={{ backgroundColor: '#fef3c7', borderColor: '#f59e0b' }}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <Shield size={20} style={{ color: '#f59e0b' }} />
                    <div>
                      <p className="font-bold" style={{ color: '#92400e', fontSize: '14px' }}>
                        👑 점장님, 지점 관리가 필요하신가요?
                      </p>
                      <p className="text-xs" style={{ color: '#92400e' }}>
                        지점 관리 모드로 전환하여 직원 및 통계를 확인하세요
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleManagerModeClick}
                    className="px-4 py-2 bg-white border-2 rounded-lg hover:bg-gray-50 font-bold transition-colors text-sm whitespace-nowrap"
                    style={{ borderColor: '#f59e0b', color: '#92400e', borderRadius: '10px' }}
                  >
                    🛡️ 지점관리
                  </button>
                </div>
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
              onClick={() => {
                console.log('🧭 Navigate to: workDiary')
                onNavigate('workDiary')
              }}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <FileText size={20} />
              근무일지
            </button>
            
            <button
              onClick={() => {
                console.log('🧭 Navigate to: customerManagement')
                onNavigate('customerManagement')
              }}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <ShoppingCart size={20} />
              판매관리
            </button>
            
            <button
              onClick={() => {
                console.log('🧭 Navigate to: shippingList')
                onNavigate('shippingList')
              }}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <Truck size={20} />
              배송목록
            </button>
            
            <button
              onClick={() => {
                console.log('🧭 Navigate to: purchaseHistory')
                onNavigate('purchaseHistory')
              }}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <Package size={20} />
              구매내역
            </button>
            
            <button
              onClick={() => {
                console.log('🚪 Logout 클릭')
                onLogout()
              }}
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