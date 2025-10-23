import React, { useState, useEffect } from 'react'
import { LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function HeroPage({ onNavigate, onAutoLogin }) {
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkExistingSession()
  }, [])

  const checkExistingSession = async () => {
    try {
      // Supabase 세션 확인
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('세션 확인 오류:', error)
        setIsChecking(false)
        return
      }

      if (session && session.user) {
        // 세션이 있으면 사용자 정보 가져오기
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (userError) {
          console.error('사용자 정보 조회 오류:', userError)
          setIsChecking(false)
          return
        }

        if (userData && userData.status === 'approved') {
          // ✅ 승인된 사용자면 자동 로그인 (user_type 체크는 App.jsx에서 처리)
          console.log('자동 로그인:', userData.name, '/', userData.user_type)
          if (onAutoLogin) {
            onAutoLogin(userData)
          }
        } else {
          console.log('승인 대기 중인 사용자:', userData?.name)
          setIsChecking(false)
        }
      } else {
        setIsChecking(false)
      }
    } catch (err) {
      console.error('자동 로그인 체크 오류:', err)
      setIsChecking(false)
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#249689' }}></div>
          <p className="text-gray-600">로그인 확인 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-start pt-8 pb-8">
      <div className="bg-white flex flex-col w-full max-w-md rounded-lg shadow-lg overflow-hidden">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between p-2 border-b">
          <div className="flex items-center gap-1.5">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-10 h-10 object-cover"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="text-2xl font-bold" style={{ color: '#249689' }}>
              LAS 근무관리시스템
            </h1>
          </div>
        </div>

        {/* 중앙 컨텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {/* 세포 이미지 */}
          <div className="mb-4">
            <img 
              src="/images/hero-cell.jpg" 
              alt="The Rise of Life Forms with a Nucleus" 
              className="w-full max-w-xs rounded-lg shadow-lg" 
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextElementSibling.style.display = 'block'
              }}
            />
            <div 
              className="hidden w-full max-w-xs h-64 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg shadow-lg flex items-center justify-center"
            >
              <p className="text-white text-xl font-bold">The Rise of Life Forms with a Nucleus</p>
            </div>
          </div>

          {/* 로그인/직원가입 버튼 */}
          <div className="flex flex-col gap-2 w-full px-10">
            <button
              onClick={() => onNavigate('login')}
              className="px-8 py-2.5 text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-opacity w-full" 
              style={{ backgroundColor: '#249689', fontSize: '15px' }}
            >
              로그인
            </button>
            <button
              onClick={() => onNavigate('signup')}
              className="px-8 py-2.5 font-bold rounded-lg shadow-md hover:bg-gray-50 transition-colors w-full" 
              style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', fontSize: '15px' }}
            >
              직원등록
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}