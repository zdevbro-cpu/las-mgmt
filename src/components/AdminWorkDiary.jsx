import { useState, useEffect } from 'react'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AdminWorkDiary({ user, onNavigate }) {
  const [diaries, setDiaries] = useState([])
  const [selectedDiary, setSelectedDiary] = useState(null)
  const [loading, setLoading] = useState(false)

  // TODO List
  const todoList = [
    '✅ 1. AdminApproval.jsx 톤앤매너 동일 유지',
    '✅ 2. 근무일지 내용을 목록으로 표시',
    '✅ 3. 좌측 목록별 상세 이모지 사용',
    '✅ 4. 목록 선택시 우측에 상세 내용 표시',
    '✅ 5. 테이블 형식으로 데이터 표시',
    '✅ 6. 삭제 기능 구현'
  ]

  useEffect(() => {
    loadDiaries()
  }, [])

  const loadDiaries = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('work_diaries')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('근무일지 조회 오류:', error)
        alert('근무일지를 불러오는 중 오류가 발생했습니다: ' + error.message)
        return
      }

      console.log('근무일지 데이터:', data)
      setDiaries(data || [])
      if (data && data.length > 0) {
        setSelectedDiary(data[0])
      }
    } catch (err) {
      console.error('근무일지 로드 오류:', err)
      alert('근무일지 로드 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDiary = async (diaryId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      const { error } = await supabase
        .from('work_diaries')
        .delete()
        .eq('id', diaryId)

      if (error) {
        console.error('근무일지 삭제 오류:', error)
        alert('삭제 중 오류가 발생했습니다.')
        return
      }

      alert('근무일지가 삭제되었습니다.')
      setSelectedDiary(null)
      loadDiaries()
    } catch (err) {
      console.error('근무일지 삭제 오류:', err)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return '-'
    // HH:MM 형식이면 그대로 반환
    if (timeString.includes(':') && timeString.length <= 5) {
      return timeString
    }
    // ISO 날짜 형식이면 시간만 추출
    const date = new Date(timeString)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 근무일지 목록별 이모지
  const getStatusEmoji = (diary) => {
    const now = new Date()
    const createdDate = new Date(diary.created_at)
    const isToday = createdDate.toDateString() === now.toDateString()
    
    if (isToday) return '📝'
    if (diary.special_notes) return '⭐'
    return '📄'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-md p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => onNavigate('adminDashboard')}
            className="flex items-center gap-2 font-bold hover:opacity-70 transition-opacity"
            style={{ color: '#249689', fontSize: '15px' }}
          >
            <ArrowLeft size={20} />
            뒤로가기
          </button>
          <div className="flex items-center gap-1.5">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-10 h-10 object-cover"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
              근무일지관리
            </h1>
          </div>
          <div style={{ width: '100px' }}></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-4 h-[calc(100vh-200px)]">
          {/* 좌측 목록 */}
          <div className="w-80 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h2 className="font-bold" style={{ color: '#249689', fontSize: '18px' }}>
                근무일지 목록
              </h2>
              <p className="text-sm text-gray-600 mt-1">총 {diaries.length}건</p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#249689' }}></div>
                </div>
              ) : diaries.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  등록된 근무일지가 없습니다
                </div>
              ) : (
                <div className="divide-y">
                  {diaries.map((diary) => (
                    <div
                      key={diary.id}
                      onClick={() => setSelectedDiary(diary)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedDiary?.id === diary.id ? 'bg-blue-50 border-l-4' : ''
                      }`}
                      style={selectedDiary?.id === diary.id ? { borderColor: '#249689' } : {}}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-2xl">{getStatusEmoji(diary)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold truncate" style={{ fontSize: '14px' }}>
                            {diary.user_name} ({diary.branch_name})
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            📅 {formatDate(diary.created_at)}
                          </div>
                          {diary.start_time && diary.end_time && (
                            <div className="text-xs text-gray-500 mt-1">
                              🕐 {formatTime(diary.start_time)} ~ {formatTime(diary.end_time)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 우측 상세 내용 */}
          <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden">
            {selectedDiary ? (
              <div className="h-full flex flex-col">
                <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
                  <h2 className="font-bold text-xl" style={{ color: '#249689' }}>
                    근무일지 상세
                  </h2>
                  <button
                    onClick={() => handleDeleteDiary(selectedDiary.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    title="삭제"
                  >
                    <Trash2 size={20} style={{ color: '#dc2626' }} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {/* 기본 정보 */}
                  <div className="mb-6">
                    <h3 className="font-bold mb-3 pb-2 border-b-2" style={{ color: '#249689', fontSize: '16px' }}>
                      👤 기본 정보
                    </h3>
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3 px-4 font-bold bg-gray-50" style={{ width: '150px', fontSize: '15px' }}>
                            작성자
                          </td>
                          <td className="py-3 px-4" style={{ fontSize: '15px' }}>
                            {selectedDiary.user_name}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 font-bold bg-gray-50" style={{ fontSize: '15px' }}>
                            지점명
                          </td>
                          <td className="py-3 px-4" style={{ fontSize: '15px' }}>
                            {selectedDiary.branch_name}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 font-bold bg-gray-50" style={{ fontSize: '15px' }}>
                            작성일
                          </td>
                          <td className="py-3 px-4" style={{ fontSize: '15px' }}>
                            {formatDate(selectedDiary.created_at)}
                          </td>
                        </tr>
                        {selectedDiary.start_time && selectedDiary.end_time && (
                          <tr className="border-b">
                            <td className="py-3 px-4 font-bold bg-gray-50" style={{ fontSize: '15px' }}>
                              근무시간
                            </td>
                            <td className="py-3 px-4" style={{ fontSize: '15px' }}>
                              {formatTime(selectedDiary.start_time)} ~ {formatTime(selectedDiary.end_time)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* 근무 시간 선택 */}
                  {selectedDiary.schedule && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-3 pb-2 border-b-2" style={{ color: '#249689', fontSize: '16px' }}>
                        🕐 근무 시간
                      </h3>
                      <table className="w-full">
                        <tbody>
                          <tr className="border-b">
                            <td className="py-3 px-4 font-bold bg-gray-50" style={{ width: '150px', fontSize: '15px' }}>
                              시간대
                            </td>
                            <td className="py-3 px-4" style={{ fontSize: '15px' }}>
                              {selectedDiary.schedule}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 일일 확인 목록 */}
                  {selectedDiary.checklist && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-3 pb-2 border-b-2" style={{ color: '#249689', fontSize: '16px' }}>
                        ✅ 일일 확인 목록
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                          {selectedDiary.checklist}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* 외근 시 내용 */}
                  {selectedDiary.outside_work && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-3 pb-2 border-b-2" style={{ color: '#249689', fontSize: '16px' }}>
                        🚗 외근 시 내용
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                          {selectedDiary.outside_work}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* 주인 모닝 내용 */}
                  {selectedDiary.weekly_notes && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-3 pb-2 border-b-2" style={{ color: '#249689', fontSize: '16px' }}>
                        📋 주인 모닝 내용
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                          {selectedDiary.weekly_notes}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* 오늘도 수고하셨습니다 */}
                  {selectedDiary.special_notes && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-3 pb-2 border-b-2" style={{ color: '#249689', fontSize: '16px' }}>
                        ⭐ 오늘도 수고하셨습니다
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                          {selectedDiary.special_notes}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* 작성일시 */}
                  <div className="mt-6 pt-4 border-t text-sm text-gray-500 text-right">
                    작성일시: {new Date(selectedDiary.created_at).toLocaleString('ko-KR')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                좌측 목록에서 근무일지를 선택하세요
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}