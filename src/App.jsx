import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { canAccessManagement, canAccessEventDashboard, LOGIN_MODES } from './constants/roles'
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
import ShippingList from './components/ShippingList'
// 🔄 업데이트: 기존 PurchaseHistory를 BranchPurchases로 변경
import BranchPurchases from './components/purchases/BranchPurchases'
import Profile from './components/Profile'
import SystemAdminDashboard from './components/SystemAdminDashboard'
import SystemAdminBranches from './components/SystemAdminBranches'
import SystemAdminUsers from './components/SystemAdminUsers'
import SystemAdminCustomers from './components/SystemAdminCustomers'
// 🔄 업데이트: SystemAdminPurchases 경로 변경
import SystemAdminPurchases from './components/purchases/SystemAdminPurchases'
import SystemAdminShipping from './components/SystemAdminShipping'
import MyInfo from './components/MyInfo'
import MyQRCode from './components/MyQRCode'
import EventLandingPage from './components/event/EventLandingPage'
import AdminEventDashboard from './components/Admin/AdminEventDashboard'
import AdminEventMenu from './components/Admin/AdminEventMenu'
import AdminEventManager from './components/Admin/AdminEventManager'
import ScrollToTop from './components/ScrollToTop'

function AppContent() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    console.log('Current User:', user)
    console.log('Current Path:', location.pathname)
  }, [user, location])

  const handleAutoLogin = (userData) => {
    console.log('Auto login:', userData)
    setUser(userData)
    
    if (userData.user_type === '시스템관리자') {
      navigate('/system-admin')
    } else {
      navigate('/dashboard')
    }
  }

  const handleLogout = async () => {
    try {
      console.log('Logging out...')
      await supabase.auth.signOut()
      setUser(null)
      navigate('/')
    } catch (err) {
      console.error('로그아웃 오류:', err)
      alert('로그아웃 중 오류가 발생했습니다.')
    }
  }

  // onNavigate 함수 - 기존 컴포넌트와 호환성 유지
  const handleNavigate = (page) => {
    console.log('Navigate to:', page)
    
    const pageMap = {
      'hero': '/',
      'login': '/login',
      'signup': '/signup',
      'event': '/event',
      'Dashboard': '/dashboard',
      'AdminDashboard': '/admin',
      'AdminUsers': '/admin/users',
      'AdminWorkDiary': '/admin/workdiary',
      'AdminCustomers': '/admin/customers',
      'AdminEventMenu': '/admin/event-menu',
      'adminEvent': '/admin/event',
      'AdminEventDashboard': '/admin/event',
      'AdminEventManager': '/admin/event-manager',
      'MyInfo': '/myinfo',
      'MyQRCode': '/myqrcode',
      'WorkDiary': '/workdiary',
      'CustomerManagement': '/customers',
      'ShippingList': '/shipping',
      'PurchaseHistory': '/purchases',
      'SystemAdminDashboard': '/system-admin',
      'SystemAdminBranches': '/system-admin/branches',
      'SystemAdminUsers': '/system-admin/users',
      'SystemAdminCustomers': '/system-admin/customers',
      'SystemAdminPurchases': '/system-admin/purchases',
      'SystemAdminShipping': '/system-admin/shipping',
      'Profile': '/profile'
    }
    
    const targetPath = pageMap[page]
    if (!targetPath) {
      console.error('⌛ 알 수 없는 페이지:', page)
      navigate('/')
      return
    }
    
    console.log('✅ 이동:', page, '→', targetPath)
    navigate(targetPath)
  }

  const handleLogin = (userData) => {
    console.log('Login:', userData)
    setUser(userData)
    
    if (userData.user_type === '시스템관리자') {
      navigate('/system-admin')
    } else {
      navigate('/dashboard')
    }
  }

  const handleSwitchMode = (newMode) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('App.jsx - handleSwitchMode 호출됨')
    console.log('현재 모드:', user?.loginMode)
    console.log('새로운 모드:', newMode)
    
    const updatedUser = {
      ...user,
      loginMode: newMode
    }
    
    setUser(updatedUser)
    
    if (newMode === LOGIN_MODES.MANAGER) {
      console.log('MANAGER 모드로 전환 → /admin으로 이동')
      navigate('/admin')
    } else if (newMode === LOGIN_MODES.EMPLOYEE) {
      console.log('EMPLOYEE 모드로 전환 → /dashboard로 이동')
      navigate('/dashboard')
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  }

  return (
    <>
      <Routes>
        {/* 공개 페이지 */}

        <Route path="/" element={<HeroPage onNavigate={handleNavigate} onAutoLogin={handleAutoLogin} />} /> 

      <Route path="/login" element={<Login onNavigate={handleNavigate} onLogin={handleLogin} />} />
      <Route path="/signup" element={<Signup onNavigate={handleNavigate} />} />
      
      {/* ⭐ 이벤트 랜딩 페이지 - 공개 */}
      <Route path="/event" element={<EventLandingPage />} />
      
      {/* 인증 필요 페이지 */}
      <Route 
        path="/dashboard" 
        element={
          user ? (
            <Dashboard 
              user={user} 
              onNavigate={handleNavigate} 
              onLogout={handleLogout} 
              onSwitchMode={handleSwitchMode}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      <Route 
        path="/admin" 
        element={
          user && canAccessManagement(user) ? (
            <AdminDashboard 
              user={user} 
              onNavigate={handleNavigate} 
              onLogout={handleLogout} 
              onSwitchMode={handleSwitchMode}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      <Route 
        path="/admin/users" 
        element={
          user && canAccessManagement(user) ? (
            <AdminUsers user={user} onNavigate={handleNavigate} />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      <Route 
        path="/admin/workdiary" 
        element={
          user && canAccessManagement(user) ? (
            <AdminWorkDiary user={user} onNavigate={handleNavigate} />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      <Route 
        path="/admin/customers" 
        element={
          user && canAccessManagement(user) ? (
            <AdminCustomers user={user} onNavigate={handleNavigate} />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* ⭐ 이벤트 템플릿 관리 - 시스템관리자 전용 */}
      
      {/* ⭐ 이벤트 관리 메뉴 - 시스템관리자 전용 */}
      <Route 
        path="/admin/event-menu" 
        element={
          user && user.user_type === '시스템관리자' ? (
            <AdminEventMenu 
              user={user} 
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              onBack={() => navigate('/system-admin')}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      <Route 
        path="/admin/event-manager" 
        element={
          user && user.user_type === '시스템관리자' ? (
            <AdminEventManager 
              user={user} 
              onBack={() => navigate('/admin/event-menu')}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* ⭐ 이벤트 대시보드 - 지점관리자/시스템관리자 전용 */}
      <Route 
        path="/admin/event" 
        element={
          user && canAccessEventDashboard(user) ? (
            <AdminEventDashboard 
              user={user} 
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              onBack={() => {
                if (user.user_type === '시스템관리자') {
                  navigate('/admin/event-menu')
                } else {
                  navigate('/admin')
                }
              }}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      <Route 
        path="/myinfo" 
        element={
          user ? (
            <MyInfo user={user} onBack={() => navigate('/dashboard')} onNavigate={handleNavigate} />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* ⭐ 내 QR 코드 페이지 */}
      <Route 
        path="/myqrcode" 
        element={
          user ? (
            <MyQRCode user={user} onBack={() => navigate('/myinfo')} />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      <Route 
        path="/workdiary" 
        element={
          user ? (
            <WorkDiary user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      <Route 
        path="/customers" 
        element={
          user ? (
            <SalesManagement user={user} onNavigate={handleNavigate} />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      <Route 
        path="/shipping" 
        element={
          user ? (
            <ShippingList user={user} onNavigate={handleNavigate} />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* 🔄 업데이트: 지점 사용자용 구매이력 페이지 (BranchPurchases) */}
      <Route 
        path="/purchases" 
        element={
          user ? (
            <BranchPurchases user={user} onNavigate={handleNavigate} />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* 시스템 관리자 페이지 */}
      <Route 
        path="/system-admin" 
        element={
          user && user.user_type === '시스템관리자' ? (
            <SystemAdminDashboard user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      <Route 
        path="/system-admin/branches" 
        element={
          user && user.user_type === '시스템관리자' ? (
            <SystemAdminBranches user={user} onNavigate={handleNavigate} />
          ) : (
            <Navigate to="/system-admin" replace />
          )
        } 
      />
      
      <Route 
        path="/system-admin/users" 
        element={
          user && user.user_type === '시스템관리자' ? (
            <SystemAdminUsers user={user} onNavigate={handleNavigate} />
          ) : (
            <Navigate to="/system-admin" replace />
          )
        } 
      />
      
      <Route 
        path="/system-admin/customers" 
        element={
          user && user.user_type === '시스템관리자' ? (
            <SystemAdminCustomers user={user} onNavigate={handleNavigate} />
          ) : (
            <Navigate to="/system-admin" replace />
          )
        } 
      />
      
      {/* 🔄 업데이트: 시스템 관리자용 구매이력 페이지 (SystemAdminPurchases) */}
      <Route 
        path="/system-admin/purchases" 
        element={
          user && user.user_type === '시스템관리자' ? (
            <SystemAdminPurchases user={user} onNavigate={handleNavigate} />
          ) : (
            <Navigate to="/system-admin" replace />
          )
        } 
      />
      
      <Route 
        path="/system-admin/shipping" 
        element={
          user && user.user_type === '시스템관리자' ? (
            <SystemAdminShipping user={user} onNavigate={handleNavigate} />
          ) : (
            <Navigate to="/system-admin" replace />
          )
        } 
      />

      <Route 
        path="/profile" 
        element={
          user ? (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#249689' }}>
                  내 정보관리
                </h2>
                <div className="mb-4 space-y-2">
                  <p className="text-gray-600">이름: {user.name}</p>
                  <p className="text-gray-600">이메일: {user.email}</p>
                  <p className="text-gray-600">지점: {user.branch}</p>
                </div>
                <p className="text-gray-500 text-sm mb-4">상세 프로필 페이지는 준비중입니다.</p>
                <button
                  onClick={() => {
                    if (user.user_type === '시스템관리자') {
                      navigate('/system-admin')
                    } else {
                      navigate('/dashboard')
                    }
                  }}
                  className="w-full py-2 text-white font-bold rounded-lg"
                  style={{ backgroundColor: '#249689' }}
                >
                  대시보드로 돌아가기
                </button>
              </div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* 404 처리 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <ScrollToTop />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App