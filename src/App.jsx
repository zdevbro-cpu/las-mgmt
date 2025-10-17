import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import HeroPage from './components/HeroPage'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import AdminDashboard from './components/AdminDashboard'
import AdminUsers from './components/AdminUsers'
import AdminWorkDiary from './components/AdminWorkDiary'
import AdminCustomers from './components/AdminCustomers'
import WorkDiary from './components/WorkDiary'
import SalesManagement from './components/SalesManagement'

function App() {
  const [currentPage, setCurrentPage] = useState('hero')
  const [user, setUser] = useState(null)

  // 디버깅: 상태 변경 추적
  useEffect(() => {
    console.log('Current Page:', currentPage)
    console.log('Current User:', user)
  }, [currentPage, user])

  // 자동 로그인 핸들러
  const handleAutoLogin = (userData) => {
    console.log('Auto login with user:', userData)
    setUser(userData)
    
    // 사용자 타입에 따라 대시보드 이동
    if (userData.user_type === '상위관리자') {
      setCurrentPage('adminDashboard')
    } else if (userData.user_type === '지점관리자') {
      setCurrentPage('dashboard')
    } else {
      setCurrentPage('dashboard')
    }
  }

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      console.log('Logging out...')
      await supabase.auth.signOut()
      setUser(null)
      setCurrentPage('hero')
    } catch (err) {
      console.error('로그아웃 오류:', err)
      alert('로그아웃 중 오류가 발생했습니다.')
    }
  }

  // 페이지 네비게이션 - user 정보 유지하면서 페이지만 변경
  const handleNavigate = (page) => {
    console.log('Navigate to:', page, 'Current user:', user)
    setCurrentPage(page)
  }

  // 로그인 핸들러
  const handleLogin = (userData) => {
    console.log('Login with user:', userData)
    setUser(userData)
    if (userData.user_type === '상위관리자') {
      setCurrentPage('adminDashboard')
    } else {
      setCurrentPage('dashboard')
    }
  }

  // 페이지 렌더링
  const renderPage = () => {
    console.log('Rendering page:', currentPage)
    
    switch (currentPage) {
      case 'hero':
        return (
          <HeroPage 
            onNavigate={handleNavigate}
            onAutoLogin={handleAutoLogin}
          />
        )
      
      case 'login':
        return (
          <Login 
            onNavigate={handleNavigate}
            onLogin={handleLogin}
          />
        )
      
      case 'signup':
        return <Signup onNavigate={handleNavigate} />
      
      case 'dashboard':
        if (!user) {
          console.error('No user data for dashboard, redirecting to login')
          setCurrentPage('login')
          return null
        }
        return (
          <Dashboard 
            user={user}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )
      
      case 'adminDashboard':
        if (!user) {
          console.error('No user data for adminDashboard, redirecting to login')
          setCurrentPage('login')
          return null
        }
        return (
          <AdminDashboard 
            user={user}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )
      
      case 'adminUsers':
        if (!user) {
          setCurrentPage('login')
          return null
        }
        return (
          <AdminUsers 
            user={user}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )
      
      case 'adminWorkDiary':
        if (!user) {
          setCurrentPage('login')
          return null
        }
        return (
          <AdminWorkDiary 
            user={user}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )
      
      case 'adminCustomers':
        if (!user) {
          setCurrentPage('login')
          return null
        }
        return (
          <AdminCustomers 
            user={user}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )
      
      // 일반 사용자 페이지들
      case 'workDiary':
        if (!user) {
          setCurrentPage('login')
          return null
        }
        return (
          <WorkDiary 
            user={user}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )
      
      case 'customerManagement':
        if (!user) {
          setCurrentPage('login')
          return null
        }
        return (
          <SalesManagement 
            user={user}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )
      
      case 'profile':
        if (!user) {
          setCurrentPage('login')
          return null
        }
        // Profile 컴포넌트가 없으므로 임시 페이지 표시
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#249689' }}>
                내 정보관리
              </h2>
              <div className="mb-4 space-y-2">
                <p className="text-gray-600">이름: {user.name}</p>
                <p className="text-gray-600">이메일: {user.email}</p>
                <p className="text-gray-600">지점: {user.branch}</p>
                <p className="text-gray-600">구분: {user.user_type}</p>
              </div>
              <p className="text-gray-500 text-sm mb-4">상세 프로필 페이지는 준비중입니다.</p>
              <button
                onClick={() => handleNavigate('dashboard')}
                className="w-full py-2 text-white font-bold rounded-lg"
                style={{ backgroundColor: '#249689' }}
              >
                대시보드로 돌아가기
              </button>
            </div>
          </div>
        )
      
      default:
        console.log('Default case - checking user:', user)
        // user가 있으면 적절한 대시보드로, 없으면 hero로
        if (user) {
          if (user.user_type === '상위관리자') {
            return (
              <AdminDashboard 
                user={user}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
              />
            )
          } else {
            return (
              <Dashboard 
                user={user}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
              />
            )
          }
        }
        return (
          <HeroPage 
            onNavigate={handleNavigate}
            onAutoLogin={handleAutoLogin}
          />
        )
    }
  }

  return (
    <div className="App">
      {renderPage()}
    </div>
  )
}

export default App

  // 자동 로그인 핸들러
  const handleAutoLogin = (userData) => {
    setUser(userData)
    
    // 사용자 타입에 따라 대시보드 이동
    if (userData.user_type === '상위관리자') {
      setCurrentPage('adminDashboard')
    } else if (userData.user_type === '지점관리자') {
      setCurrentPage('dashboard')
    } else {
      setCurrentPage('dashboard')
    }
  }

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setCurrentPage('hero')
    } catch (err) {
      console.error('로그아웃 오류:', err)
      alert('로그아웃 중 오류가 발생했습니다.')
    }
  }

  // 페이지 네비게이션 - user 정보 유지하면서 페이지만 변경
  const handleNavigate = (page) => {
    console.log('Navigate to:', page, 'Current user:', user) // 디버깅용
    setCurrentPage(page)
  }

  // 로그인 핸들러
  const handleLogin = (userData) => {
    setUser(userData)
    if (userData.user_type === '상위관리자') {
      setCurrentPage('adminDashboard')
    } else {
      setCurrentPage('dashboard')
    }
  }

  // 페이지 렌더링
  const renderPage = () => {
    switch (currentPage) {
      case 'hero':
        return (
          <HeroPage 
            onNavigate={handleNavigate}
            onAutoLogin={handleAutoLogin}
          />
        )
      case 'login':
        return (
          <Login 
            onNavigate={handleNavigate}
            onLogin={handleLogin}
          />
        )
      case 'signup':
        return <Signup onNavigate={handleNavigate} />
      
      case 'dashboard':
        return (
          <Dashboard 
            user={user}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )
      
      case 'adminDashboard':
        return (
          <AdminDashboard 
            user={user}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )
      
      case 'adminUsers':
        return (
          <AdminUsers 
            user={user}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )
      
      case 'adminWorkDiary':
        return (
          <AdminWorkDiary 
            user={user}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )
      
      case 'adminCustomers':
        return (
          <AdminCustomers 
            user={user}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )
      
      // 일반 사용자 페이지들
      case 'workDiary':
        return (
          <WorkDiary 
            user={user}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )
      
      case 'customerManagement':
        return (
          <SalesManagement 
            user={user}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )
      
      case 'profile':
        // Profile 컴포넌트가 없으므로 임시 페이지 표시
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#249689' }}>
                내 정보관리
              </h2>
              <p className="text-gray-600 mb-4">이 페이지는 준비중입니다.</p>
              <button
                onClick={() => handleNavigate('dashboard')}
                className="w-full py-2 text-white font-bold rounded-lg"
                style={{ backgroundColor: '#249689' }}
              >
                대시보드로 돌아가기
              </button>
            </div>
          </div>
        )
      
      default:
        // user가 있으면 적절한 대시보드로, 없으면 hero로
        if (user) {
          if (user.user_type === '상위관리자') {
            return (
              <AdminDashboard 
                user={user}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
              />
            )
          } else {
            return (
              <Dashboard 
                user={user}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
              />
            )
          }
        }
        return (
          <HeroPage 
            onNavigate={handleNavigate}
            onAutoLogin={handleAutoLogin}
          />
        )
    }
  }

  return (
    <div className="App">
      {renderPage()}
    </div>
  )
}

export default App