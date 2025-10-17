import { LogOut, FileText, Users, User, Building2, Package, Search } from 'lucide-react'

export default function Dashboard({ user, onNavigate, onLogout }) {
  // 지점관리자 여부 확인
  const isBranchManager = user?.user_type === '지점관리자'

  return (
    <div className="min-h-screen bg-white">
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
              매장관리
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
                value={user?.branch || '-'}
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
                value={user?.name || '-'}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
              />
            </div>
          </div>

          {/* 권한 표시 */}
          {isBranchManager && (
            <div className="mb-6 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm font-bold" style={{ color: '#8b5cf6' }}>
                🛡️ 지점관리자 권한
              </p>
              <p className="text-xs text-gray-600 mt-1">
                해당 지점의 모든 데이터를 관리할 수 있습니다
              </p>
            </div>
          )}

          {/* 버튼들 */}
          <div className="space-y-4">
            <button
              onClick={() => {
                console.log('근무일지 버튼 클릭')
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
                console.log('판매고객관리 버튼 클릭')
                onNavigate('customerManagement')
              }}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <Users size={20} />
              판매고객관리
            </button>
            
            <button
              onClick={() => {
                console.log('송장출력 버튼 클릭')
                onNavigate('shippingList')
              }}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <Package size={20} />
              송장출력
            </button>
            
            <button
              onClick={() => {
                console.log('구매자정보조회 버튼 클릭')
                onNavigate('purchaseHistory')
              }}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <Search size={20} />
              구매자정보조회
            </button>
            
            <button
              onClick={() => {
                console.log('내 정보관리 버튼 클릭')
                onNavigate('profile')
              }}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <User size={20} />
              내 정보관리
            </button>
            
            <button
              onClick={() => {
                console.log('로그아웃 버튼 클릭')
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