import { useState } from 'react'

// 30분 단위 시간 옵션 생성
const generateTimeOptions = () => {
  const options = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      options.push(timeString)
    }
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

export default function WorkDiary({ user: propUser, onNavigate }) {
  // 사용자 정보 (props로 받거나 기본값 사용)
  const [user] = useState(propUser || {
    id: 'demo-user-1',
    name: '홍길동',
    branch: '강남점',
    userType: '점장'
  })

  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    dailyCheck1: false,
    dailyCheck2: false,
    dailyCheck3: false,
    outContent: '',
    exemplary: '',
    memorable: '',
    suggestions: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const calculateWorkHours = () => {
    if (!formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
      return 0
    }
    const start = new Date(`${formData.startDate}T${formData.startTime}`)
    const end = new Date(`${formData.endDate}T${formData.endTime}`)
    const diff = (end - start) / (1000 * 60 * 60)
    return diff > 0 ? diff.toFixed(1) : 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const workHours = calculateWorkHours()
      
      const diaryEntry = {
        id: Date.now().toString(),
        user_id: user.id,
        user_name: user.name,
        user_branch: user.branch,
        user_type: user.userType,
        start_date: formData.startDate,
        start_time: formData.startTime,
        end_date: formData.endDate,
        end_time: formData.endTime,
        work_hours: parseFloat(workHours),
        daily_check1: formData.dailyCheck1,
        daily_check2: formData.dailyCheck2,
        daily_check3: formData.dailyCheck3,
        out_content: formData.outContent,
        exemplary: formData.exemplary,
        memorable: formData.memorable,
        suggestions: formData.suggestions,
        created_at: new Date().toISOString()
      }

      // 실제 환경에서는 여기서 데이터베이스에 저장
      console.log('제출된 근무일지:', diaryEntry)
      
      // 시뮬레이션을 위한 지연
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert('근무일지가 제출되었습니다!')
      
      if (onNavigate) {
        onNavigate('dashboard')
      }
      
      // 폼 초기화
      setFormData({
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        dailyCheck1: false,
        dailyCheck2: false,
        dailyCheck3: false,
        outContent: '',
        exemplary: '',
        memorable: '',
        suggestions: ''
      })
    } catch (err) {
      console.error('근무일지 제출 오류:', err)
      alert('근무일지 제출 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (window.confirm('작성 중인 내용이 사라집니다. 취소하시겠습니까?')) {
      setFormData({
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        dailyCheck1: false,
        dailyCheck2: false,
        dailyCheck3: false,
        outContent: '',
        exemplary: '',
        memorable: '',
        suggestions: ''
      })
      if (onNavigate) {
        onNavigate('dashboard')
      }
    }
  }

  const isManager = user?.userType === '점장'

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        {/* 헤더 - 중앙정렬 */}
        <div className="flex flex-col items-center justify-center mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-10 h-10 object-cover"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
              {(user?.userType === '점주' || user?.user_type === '점주') ? '점주근무일지' : 'SM점장 근무일지'}
            </h1>
          </div>
        </div>

        {/* 사용자 정보 */}
        <div className="grid grid-cols-2 gap-1.5 mb-4">
          <div>
            <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              지점명
            </label>
            <input
              type="text"
              value={user?.branch || ''}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>
          <div>
            <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              이름
            </label>
            <input
              type="text"
              value={user?.name || ''}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 근무일자 선택 */}
          <div className="border-t pt-6">
            <h3 className="font-bold mb-4" style={{ color: '#000000', fontSize: '15px' }}>
              근무일자 시간을 선택해 주세요
            </h3>
            {/* 출근시간 */}
            <div className="mb-4">
              <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                출근시간
              </label>
              <div className="flex gap-1.5">
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="flex-1 px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
                <select
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  className="px-4 py-2 border border-gray-300 bg-white"
                  style={{ borderRadius: '10px', fontSize: '15px', minWidth: '100px' }}
                >
                  <option value="">선택</option>
                  {TIME_OPTIONS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* 퇴근시간 */}
            <div>
              <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                퇴근시간
              </label>
              <div className="flex gap-1.5">
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="flex-1 px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
                <select
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className="px-4 py-2 border border-gray-300 bg-white"
                  style={{ borderRadius: '10px', fontSize: '15px', minWidth: '100px' }}
                >
                  <option value="">선택</option>
                  {TIME_OPTIONS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 p-2 bg-teal-50 rounded-lg">
              <p className="font-bold" style={{ color: '#249689', fontSize: '15px' }}>
                총 근무시간: {calculateWorkHours()} 시간
              </p>
            </div>
          </div>

          {/* 일일 확인목록 (점장만) */}
          {isManager && (
            <div className="border-t pt-6">
              <h3 className="font-bold mb-4" style={{ color: '#000000', fontSize: '15px' }}>
                일일 확인목록
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="dailyCheck1"
                    checked={formData.dailyCheck1}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <span style={{ color: '#000000', fontSize: '15px' }}>매장 청결점검</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="dailyCheck2"
                    checked={formData.dailyCheck2}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <span style={{ color: '#000000', fontSize: '15px' }}>직원 업무교육</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="dailyCheck3"
                    checked={formData.dailyCheck3}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <span style={{ color: '#000000', fontSize: '15px' }}>직원 체크리스트 점검</span>
                </label>
              </div>
            </div>
          )}

          {/* 외근 시 내용 */}
          <div className="border-t pt-6">
            <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              외근 시 내용을 적어주세요
            </label>
            <textarea
              name="outContent"
              value={formData.outContent}
              onChange={handleChange}
              placeholder="외근 시 내용을 적어주세요"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>

          {/* 주인형 모집내용 */}
          <div>
            <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              주인형 모집내용을 적어주세요
            </label>
            <textarea
              name="exemplary"
              value={formData.exemplary}
              onChange={handleChange}
              placeholder="주인형 모집내용을 적어주세요"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>

          {/* 인상깊은 고객 */}
          <div>
            <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              오늘 인상깊은 고객에 대해 적어주세요
            </label>
            <textarea
              name="memorable"
              value={formData.memorable}
              onChange={handleChange}
              placeholder="오늘 인상깊은 고객에 대해 적어주세요"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>

          {/* 건의사항 */}
          <div>
            <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              건의사항이 있으시면 적어주세요
            </label>
            <textarea
              name="suggestions"
              value={formData.suggestions}
              onChange={handleChange}
              placeholder="건의사항이 있으시면 적어주세요"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>

          {/* 버튼들 - 제출/취소만 */}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              {loading ? '저장 중...' : '제출'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 py-2.5 font-bold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}