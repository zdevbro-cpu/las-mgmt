import React, { useState, useEffect } from 'react'

// 30분 단위 시간 옵션 생성 (08:30 ~ 22:30)
const generateTimeOptions = () => {
  const options = []
  
  const startHour = 8;
  const startMinute = 30;
  const endHour = 22;
  const endMinute = 30;

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === startHour && minute < startMinute) {
        continue;
      }
      if (hour === endHour && minute > endMinute) {
        break; 
      }
      
      const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      options.push(timeString)
    }
    
    if (hour === endHour && options.includes(`${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`)) {
        break;
    }
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

export default function WorkDiary({ user, onNavigate }) {
  const [formData, setFormData] = useState({
    workDate: '',
    startTime: '',
    endTime: '',
    dailyCheckClean: false,
    dailyCheckTraining: false,
    dailyCheckList: false,
    outContent: '',
    exemplaryContent: '',
    memorableCustomer: '',
    suggestions: ''
  })
  const [workHours, setWorkHours] = useState(0)
  const [loading, setLoading] = useState(false)

  // 점장 또는 지점관리자 여부 확인
  const isManager = user?.user_type === '점장' || user?.user_type === '지점관리자' || 
                    user?.userType === '점장' || user?.userType === '지점관리자'

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  // 총 근무시간 계산 - useEffect로 자동 계산
  useEffect(() => {
    if (!formData.workDate || !formData.startTime || !formData.endTime) {
      setWorkHours(0)
      return
    }

    try {
      const startDateTime = new Date(`${formData.workDate}T${formData.startTime}:00`)
      const endDateTime = new Date(`${formData.workDate}T${formData.endTime}:00`)
      
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        setWorkHours(0)
        return
      }
      
      const diffMs = endDateTime - startDateTime
      const diffHours = diffMs / (1000 * 60 * 60)
      
      setWorkHours(diffHours > 0 ? parseFloat(diffHours.toFixed(1)) : 0)
    } catch (error) {
      console.error('시간 계산 오류:', error)
      setWorkHours(0)
    }
  }, [formData.workDate, formData.startTime, formData.endTime])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.workDate) {
      alert('출근일을 선택해주세요')
      return
    }
    if (!formData.startTime) {
      alert('출근시간을 선택해주세요')
      return
    }
    if (!formData.endTime) {
      alert('퇴근시간을 선택해주세요')
      return
    }

    if (workHours <= 0) {
      alert('퇴근시간이 출근시간보다 늦어야 합니다')
      return
    }

    setLoading(true)

    try {
      // Supabase 연동 부분은 실제 환경에서 사용
      const diaryData = {
        user_id: user.id,
        user_name: user.name,
        branch_name: user.branch,
        work_date: formData.workDate,
        start_time: formData.startTime,
        end_time: formData.endTime,
        work_hours: workHours,
        daily_check_clean: formData.dailyCheckClean,
        daily_check_training: formData.dailyCheckTraining,
        daily_check_list: formData.dailyCheckList,
        out_content: formData.outContent.trim() || null,
        exemplary_content: formData.exemplaryContent.trim() || null,
        memorable_customer: formData.memorableCustomer.trim() || null,
        suggestions: formData.suggestions.trim() || null
      }

      console.log('근무일지 저장 데이터:', diaryData)

      // 실제 환경에서는 supabase 호출
      // const { data, error } = await supabase
      //   .from('work_diaries')
      //   .insert([diaryData])
      //   .select()

      alert('근무일지가 제출되었습니다!')
      
      // Dashboard로 이동
      if (onNavigate) {
        onNavigate('dashboard')
      }
      
    } catch (err) {
      console.error('근무일지 제출 오류:', err)
      alert('근무일지 제출 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    const hasContent = formData.workDate || formData.startTime || formData.endTime || 
                       formData.outContent || formData.exemplaryContent || 
                       formData.memorableCustomer || formData.suggestions ||
                       formData.dailyCheckClean || formData.dailyCheckTraining || formData.dailyCheckList
    
    if (hasContent) {
      if (window.confirm('작성 중인 내용이 있습니다. 나가기하시겠습니까?')) {
        if (onNavigate) {
          onNavigate('Dashboard')
        }
      }
    } else {
      if (onNavigate) {
        onNavigate('Dashboard')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-4">
        {/* 헤더 */}
        <div className="flex flex-col items-center justify-center mb-2">
          <div className="flex items-center gap-1.5 mb-1">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-10 h-10 object-cover"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
              {isManager ? 'SM점장 근무일지' : '점주근무일지'}
            </h1>
          </div>
        </div>

        {/* 사용자 정보 */}
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <div>
            <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              지점명
            </label>
            <input
              type="text"
              value={user?.branch || 'Current User\'s brname'}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>
          <div>
            <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              이름
            </label>
            <input
              type="text"
              value={user?.name || 'Current User\'s name'}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>
        </div>

        <div className="space-y-2">
          {/* 근무일자 시간 선택 */}
          <div className="border-t pt-2">
            <h3 className="font-bold mb-2" style={{ color: '#000000', fontSize: '15px' }}>
              근무일자 시간을 선택해 주세요
            </h3>
            
            {/* 출근일 */}
            <div className="mb-2">
              <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                출근일
              </label>
              <input
                type="date"
                name="workDate"
                value={formData.workDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300"
                style={{ borderRadius: '10px', fontSize: '15px' }}
              />
            </div>

            {/* 출근시간 / 퇴근시간 */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  출근시간
                </label>
                <select
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 bg-white"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                >
                  <option value="">선택</option>
                  {TIME_OPTIONS.map(time => (
                    <option key={`start-${time}`} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  퇴근시간
                </label>
                <select
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 bg-white"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                >
                  <option value="">선택</option>
                  {TIME_OPTIONS.map(time => (
                    <option key={`end-${time}`} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 총 근무시간 */}
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#d1fae5', border: '2px solid #10b981' }}>
              <p className="font-bold text-center" style={{ color: '#059669', fontSize: '16px' }}>
                총 근무시간: {workHours} 시간
              </p>
            </div>
          </div>

          {/* 일일 확인목록 - 점장 또는 지점관리자만 표시 */}
          {isManager && (
            <div className="border-t pt-2">
              <h3 className="font-bold mb-2" style={{ color: '#000000', fontSize: '15px' }}>
                일일 확인목록
              </h3>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="dailyCheckClean"
                    checked={formData.dailyCheckClean}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <span style={{ color: '#000000', fontSize: '15px' }}>매장 청결점검</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="dailyCheckTraining"
                    checked={formData.dailyCheckTraining}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <span style={{ color: '#000000', fontSize: '15px' }}>직원 업무교육</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="dailyCheckList"
                    checked={formData.dailyCheckList}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <span style={{ color: '#000000', fontSize: '15px' }}>직원 체크리스트 점검</span>
                </label>
              </div>
            </div>
          )}

          {/* 외근 시 내용 */}
          <div className="border-t pt-2">
            <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
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
            <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              주인형 모집내용을 적어주세요
            </label>
            <textarea
              name="exemplaryContent"
              value={formData.exemplaryContent}
              onChange={handleChange}
              placeholder="주인형 모집내용을 적어주세요"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>

          {/* 오늘 인상깊은 고객 */}
          <div>
            <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              오늘 인상깊은 고객에 대해 적어주세요
            </label>
            <textarea
              name="memorableCustomer"
              value={formData.memorableCustomer}
              onChange={handleChange}
              placeholder="오늘 인상깊은 고객에 대해 적어주세요"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>

          {/* 건의사항 */}
          <div>
            <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
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

          {/* 버튼들 */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleSubmit}
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
              나가기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}