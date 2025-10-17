import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import HeroPage from './components/HeroPage'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import AdminDashboard from './components/AdminDashboard'
// ... 다른 컴포넌트 import

function App() {
  const [currentPage, setCurrentPage] = useState('hero')
  const [user, setUser] = useState(null)

  // 자동 로그인 핸들러
  const handleAutoLogin = (userData) => {
    setUser(userData)
    
    // 사용자 타입에 따라 대시보드 이동
    if (userData.user_type === '상위관리자') {
      setCurrentPage('adminDashboard')
    } else if (userData.user_type === '지점관리자') {
      setCurrentPage('dashboard') // 또는 'branchAdminDashboard'
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
    }
  }

  // 페이지 네비게이션
  const handleNavigate = (page) => {
    setCurrentPage(page)
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
            onLogin={(userData) => {
              setUser(userData)
              if (userData.user_type === '상위관리자') {
                setCurrentPage('adminDashboard')
              } else {
                setCurrentPage('dashboard')
              }
            }}
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
      // ... 다른 페이지들
      default:
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