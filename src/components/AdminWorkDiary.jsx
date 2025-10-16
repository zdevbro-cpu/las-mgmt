import { useState, useEffect } from 'react'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AdminWorkDiary({ user, onNavigate }) {
  const [diaries, setDiaries] = useState([])
  const [selectedDiary, setSelectedDiary] = useState(null)
  const [loading, setLoading] = useState(false)

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
    return timeString
  }

  const calculateWorkHours = (startTime, endTime) => {
    if (!startTime || !endTime) return '-'
    
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    
    let diffMinutes = endMinutes - startMinutes
    if (diffMinutes < 0) diffMinutes += 24 * 60 // 다음날로 넘어간 경우
    
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    
    return `${hours}시간 ${minutes}분`
  }

  // 근무일지 목록별 이모지 - 옵션 1: 중요도 기반
  const getStatusEmoji = (diary) => {
    // 우선순위: 인상깊은 고객 > 건의사항 > 외근 > 일반
    if (diary.memorable) return '⭐'
    if (diary.suggestions) return '💡'
    if (diary.out_content) return '🚗'
    return '📝'
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
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <div>⭐ 인상깊은 고객</div>
                <div>💡 건의사항</div>
                <div>🚗 외근 내용</div>
                <div>📝 일반</div>
              </div>
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
                            {diary.user_name}
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            📍 {diary.user_branch} · {diary.user_type}
                          </div>
                          <div className="text-sm text-gray-600 mt-1.5">
                            📅 {formatDate(diary.start_date || diary.created_at)}
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
                            이름
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
                            {selectedDiary.user_branch}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 font-bold bg-gray-50" style={{ fontSize: '15px' }}>
                            직원구분
                          </td>
                          <td className="py-3 px-4" style={{ fontSize: '15px' }}>
                            {selectedDiary.user_type}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 font-bold bg-gray-50" style={{ fontSize: '15px' }}>
                            작성일
                          </td>
                          <td className="py-3 px-4" style={{ fontSize: '15px' }}>
                            {formatDate(selectedDiary.start_date || selectedDiary.created_at)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 근무 시간 정보 */}
                  {(selectedDiary.start_time || selectedDiary.end_time) && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-3 pb-2 border-b-2" style={{ color: '#249689', fontSize: '16px' }}>
                        🕐 근무 시간
                      </h3>
                      <table className="w-full">
                        <tbody>
                          <tr className="border-b">
                            <td className="py-3 px-4 font-bold bg-gray-50" style={{ width: '150px', fontSize: '15px' }}>
                              출근시간
                            </td>
                            <td className="py-3 px-4" style={{ fontSize: '15px' }}>
                              {formatTime(selectedDiary.start_time)}
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-3 px-4 font-bold bg-gray-50" style={{ fontSize: '15px' }}>
                              퇴근시간
                            </td>
                            <td className="py-3 px-4" style={{ fontSize: '15px' }}>
                              {formatTime(selectedDiary.end_time)}
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-3 px-4 font-bold bg-gray-50" style={{ fontSize: '15px' }}>
                              총 근무시간
                            </td>
                            <td className="py-3 px-4 font-bold" style={{ fontSize: '15px', color: '#249689' }}>
                              {calculateWorkHours(selectedDiary.start_time, selectedDiary.end_time)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 일일 체크사항 */}
                  {(selectedDiary.daily_check1 || selectedDiary.daily_check2 || selectedDiary.daily_check3) && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-3 pb-2 border-b-2" style={{ color: '#249689', fontSize: '16px' }}>
                        ✅ 일일 체크사항
                      </h3>
                      <div className="space-y-2">
                        {selectedDiary.daily_check1 && (
                          <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                            <span className="text-green-600">✓</span>
                            <span style={{ fontSize: '14px' }}>매장 청결 검수</span>
                          </div>
                        )}
                        {selectedDiary.daily_check2 && (
                          <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                            <span className="text-green-600">✓</span>
                            <span style={{ fontSize: '14px' }}>직원 업무교육</span>
                          </div>
                        )}
                        {selectedDiary.daily_check3 && (
                          <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                            <span className="text-green-600">✓</span>
                            <span style={{ fontSize: '14px' }}>직원 체크리스트 점검</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 외근 시 내용 */}
                  {selectedDiary.out_content && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-3 pb-2 border-b-2" style={{ color: '#249689', fontSize: '16px' }}>
                        🚗 외근 시 내용
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                          {selectedDiary.out_content}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* 주인형 모집 내용 */}
                  {selectedDiary.exemplary && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-3 pb-2 border-b-2" style={{ color: '#249689', fontSize: '16px' }}>
                        👥 주인형 모집 내용
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                          {selectedDiary.exemplary}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* 인상깊은 고객에 대한 내용 */}
                  {selectedDiary.memorable && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-3 pb-2 border-b-2" style={{ color: '#249689', fontSize: '16px' }}>
                        ⭐ 인상깊은 고객에 대한 내용
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                          {selectedDiary.memorable}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* 건의사항 내용 */}
                  {selectedDiary.suggestions && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-3 pb-2 border-b-2" style={{ color: '#249689', fontSize: '16px' }}>
                        💡 건의사항 내용
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                          {selectedDiary.suggestions}
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