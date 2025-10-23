import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sgxnxbhbyvrmgrzhosyh.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNneG54YmhieXZybWdyemhvc3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MDAzMzMsImV4cCI6MjA3MzQ3NjMzM30.1qS_3Qr-zv7woSyPbkdiLkhuXp2pVHJHGiF3iKWEBkc'

export const supabase = createClient(supabaseUrl, supabaseKey)

// LocalStorage 기반 임시 DB (Supabase 설정 전까지 사용)
export const localDB = {
  // 사용자 관리
  getUsers: () => JSON.parse(localStorage.getItem('las_users') || '[]'),
  setUsers: (users) => localStorage.setItem('las_users', JSON.stringify(users)),
  
  // 근무일지 관리
  getWorkDiaries: () => JSON.parse(localStorage.getItem('las_work_diaries') || '[]'),
  setWorkDiaries: (diaries) => localStorage.setItem('las_work_diaries', JSON.stringify(diaries)),
  
  // 판매 관리
  getSales: () => JSON.parse(localStorage.getItem('las_sales') || '[]'),
  setSales: (sales) => localStorage.setItem('las_sales', JSON.stringify(sales)),
  
  // 현재 로그인 사용자
  getCurrentUser: () => JSON.parse(localStorage.getItem('las_current_user') || 'null'),
  setCurrentUser: (user) => localStorage.setItem('las_current_user', JSON.stringify(user)),
  clearCurrentUser: () => localStorage.removeItem('las_current_user'),
  
  // 초기 관리자 계정 생성
  initAdmin: () => {
    const users = localDB.getUsers()
    if (users.length === 0) {
      const admin = {
        id: '1',
        email: 'admin@las.com',
        password: 'admin123',
        name: '시스템관리자',
        branch: '본사',
        phone: '010-0000-0000',
        userType: '관리자',
        status: 'approved',
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString()
      }
      localDB.setUsers([admin])
      console.log('✅ 초기 관리자 계정 생성됨: admin@las.com / admin123')
    }
  }
}

// 앱 시작시 관리자 계정 초기화
localDB.initAdmin()