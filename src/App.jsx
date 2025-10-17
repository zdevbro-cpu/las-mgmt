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
          <CustomerManagement 
            user={user}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )
      
      case 'profile':
        return (
          <Profile 
            user={user}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
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