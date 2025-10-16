import { LogOut } from 'lucide-react'

export default function HeroPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-start pt-8 pb-8"> {/* 배경색 변경 및 중앙 정렬을 위한 스타일 추가 */}
      <div className="bg-white flex flex-col w-full max-w-md rounded-lg shadow-lg overflow-hidden"> {/* 컨텐츠 영역의 최대 너비 설정 */}
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between p-2 border-b"> {/* 패딩 조정 */}
          <div className="flex items-center gap-1.5"> {/* 간격 조정 */}
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-10 h-10 object-cover"
              // 로고 크기 조정 
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="text-2xl font-bold" style={{ color: '#249689' }}> {/* 텍스트 크기 조정 */}
              LAS 근무관리시스템
            </h1>
          </div>
          <button
            onClick={() => window.close()}
            className="flex items-center gap-1 px-3 py-1 text-sm rounded-lg hover:bg-gray-100 transition-colors"
            // 버튼 패딩, 텍스트 크기 조정 
            style={{ color: '#000000', border: '2px solid #7f95eb' }}
          >
            <LogOut size={16} /> {/* 아이콘 크기 조정 */}
            <span className="font-medium"></span> {/* 버튼 텍스트 추가 */}
          </button>
        </div>

        {/* 중앙 컨텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center p-6"> {/* 패딩 조정 */}
          {/* 세포 이미지 */}
          <div className="mb-4"> {/* 마진 조정 */}
            <img 
              src="/images/hero-cell.jpg" 
              alt="The Rise of Life Forms with a Nucleus" 
              className="w-full max-w-xs rounded-lg shadow-lg" 
              // 이미지 크기 조정 (w-1/2 -> w-full, max-w-xl -> max-w-xs)
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextElementSibling.style.display = 'block'
              }}
            />
            <div 
              className="hidden w-full max-w-xs h-64 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg shadow-lg flex items-center justify-center"
              // 백업 이미지 크기 조정
            >
              <p className="text-white text-xl font-bold">The Rise of Life Forms with a Nucleus</p> {/* 텍스트 크기 조정 */}
            </div>
          </div>

          {/* 로그인/회원가입 버튼 */}
          <div className="flex flex-col gap-2 w-full px-4"> {/* 버튼을 세로로 정렬하고 너비를 꽉 채우도록 변경 */}
            <button
              onClick={() => onNavigate('login')}
              className="px-8 py-2.5 text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-opacity w-full" 
              // 너비 꽉 채우기 
              style={{ backgroundColor: '#249689', fontSize: '15px' }}
            >
              로그인
            </button>
            <button
              onClick={() => onNavigate('signup')}
              className="px-8 py-2.5 font-bold rounded-lg shadow-md hover:bg-gray-50 transition-colors w-full" 
              // 너비 꽉 채우기 
              style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', fontSize: '15px' }}
            >
              회원가입
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}