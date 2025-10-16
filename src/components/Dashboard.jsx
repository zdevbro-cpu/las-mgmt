import { LogOut } from 'lucide-react'

export default function Dashboard({ user, onNavigate, onLogout }) {
  return (
    <div className="min-h-screen bg-white">
      {/* 메인 컨텐츠 */}
      <div className="max-w-xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* 페이지 타이틀 */}
          <div className="flex items-center justify-center gap-1.5 mb-8">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-10 h-10 object-cover"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h2 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
              LAS 매장관리
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

          {/* 버튼들 */}
          <div className="space-y-4">
            <button
              onClick={() => onNavigate('workDiary')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              근무일지
            </button>
            <button
              onClick={() => onNavigate('sales')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              판매관리
            </button>
            <button
              onClick={() => onNavigate('shippingList')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              송장출력
            </button>
            <button
              onClick={() => onNavigate('purchaseHistory')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              구매이력조회
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