import { useState, useEffect } from 'react'
import HeroPage from './components/HeroPage'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import WorkDiary from './components/WorkDiary'
import SalesManagement from './components/SalesManagement'
import AdminApproval from './components/AdminApproval'
import PurchaseHistory from './components/PurchaseHistory'

function App() {
  const [currentPage, setCurrentPage] = useState('hero')
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    // 로그인 상태 확인 (sessionStorage 사용)
    const userStr = sessionStorage.getItem('las_current_user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
        if (user.userType === '관리자' || user.user_type === '관리자') {
          setCurrentPage('admin')
        } else {
          setCurrentPage('dashboard')
        }
      } catch (err) {
        console.error('사용자 정보 복원 오류:', err)
        sessionStorage.removeItem('las_current_user')
      }
    }
  }, [])

  const handleLogin = (user) => {
    setCurrentUser(user)
    sessionStorage.setItem('las_current_user', JSON.stringify(user))
    if (user.userType === '관리자' || user.user_type === '관리자') {
      setCurrentPage('admin')
    } else {
      setCurrentPage('dashboard')
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    sessionStorage.removeItem('las_current_user')
    setCurrentPage('hero')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'hero':
        return <HeroPage onNavigate={setCurrentPage} />
      case 'login':
        return <Login onNavigate={setCurrentPage} onLogin={handleLogin} />
      case 'signup':
        return <Signup onNavigate={setCurrentPage} />
      case 'dashboard':
        return <Dashboard user={currentUser} onNavigate={setCurrentPage} onLogout={handleLogout} />
      case 'workDiary':
        return <WorkDiary user={currentUser} onNavigate={setCurrentPage} />
      case 'sales':
        return <SalesManagement user={currentUser} onNavigate={setCurrentPage} />
      case 'purchaseHistory':
        return <PurchaseHistory user={currentUser} onNavigate={setCurrentPage} />
      case 'admin':
        return <AdminApproval user={currentUser} onLogout={handleLogout} />
      default:
        return <HeroPage onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {renderPage()}
    </div>
  )
}

export default App