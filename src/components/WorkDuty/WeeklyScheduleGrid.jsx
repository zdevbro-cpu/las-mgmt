import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Save, RefreshCw, Plus, Search, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getWeekDates, formatDate } from '../../lib/dateUtils';

const WeeklyScheduleGrid = ({ user }) => {
  const navigate = useNavigate();
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPartTimeInput, setShowPartTimeInput] = useState(false);
  const [partTimeName, setPartTimeName] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showBranchSelect, setShowBranchSelect] = useState(false);

  const weekDates = getWeekDates(currentWeekStart);

  useEffect(() => {
    loadEmployees();
    loadAllEmployees();
    loadSchedules();
    loadBranches();
  }, [currentWeekStart, selectedBranch]);

  const loadEmployees = async () => {
    const targetBranch = selectedBranch || user?.branch;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('branch', targetBranch)
      .order('name');
    
    if (!error) setEmployees(data || []);
  };

  const loadAllEmployees = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('branch', 'name');
    
    if (!error) setAllEmployees(data || []);
  };

  const loadBranches = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('branch')
      .not('branch', 'is', null);
    
    if (!error && data) {
      const uniqueBranches = [...new Set(data.map(item => item.branch))];
      setBranches(uniqueBranches);
    }
  };

  const getBranchId = async (branchName) => {
    const { data, error } = await supabase
      .from('branches')
      .select('id')
      .eq('name', branchName)
      .single();
    
    return data?.id || null;
  };

  const loadSchedules = async () => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const { data, error } = await supabase
      .from('duties')
      .select('*')
      .gte('work_date', formatDate(currentWeekStart))
      .lte('work_date', formatDate(weekEnd));

    if (!error && data) {
      const scheduleMap = {};
      data.forEach(duty => {
        const key = `${duty.user_id}_${duty.work_date}`;
        scheduleMap[key] = duty;
      });
      setSchedules(scheduleMap);
    }
  };

  const updateSchedule = async (userId, date, startTime, endTime) => {
    const branch_id = await getBranchId(user?.branch);
    const dateStr = typeof date === 'string' ? date : formatDate(date);
    console.log('=== updateSchedule 시작 ===');
    console.log('userId:', userId);
    console.log('date:', dateStr);
    console.log('startTime:', startTime);
    console.log('endTime:', endTime);
    
    const key = `${userId}_${dateStr}`;
    console.log('key:', key);
    
    if (!startTime && !endTime) {
      console.log('삭제 처리');
      setSchedules(prev => {
        const newSchedules = { ...prev };
        delete newSchedules[key];
        console.log('삭제 후 schedules:', newSchedules);
        return newSchedules;
      });
      return;
    }

    if (!startTime || !endTime) {
      console.log('시작 또는 종료 시간 없음 - 부분 업데이트');
      setSchedules(prev => {
        const current = prev[key] || {};
        const updated = {
          ...current,
          user_id: userId,
          work_date: dateStr,
          start_time: startTime || current.start_time,
          end_time: endTime || current.end_time,
          branch_id,
          created_by: user?.id,
        };
        console.log('부분 업데이트:', updated);
        return { ...prev, [key]: updated };
      });
      return;
    }

    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const work_hours = Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10;

    const updated = {
      user_id: userId,
      work_date: dateStr,
      start_time: startTime,
      end_time: endTime,
      work_hours,
      branch_id,
      created_by: user?.id,
    };

    console.log('전체 업데이트:', updated);

    setSchedules(prev => {
      const newSchedules = { ...prev, [key]: updated };
      console.log('업데이트 후 schedules:', newSchedules);
      return newSchedules;
    });
    
    console.log('=== updateSchedule 종료 ===');
  };

  const saveSchedules = async () => {
    setLoading(true);
    const schedulesToSave = Object.values(schedules).filter(s => 
      s.start_time && s.end_time && s.work_hours > 0
    );

    console.log('저장할 스케줄:', schedulesToSave);

    try {
      for (const schedule of schedulesToSave) {
        const { data: existing, error: selectError } = await supabase
          .from('duties')
          .select('id')
          .eq('user_id', schedule.user_id)
          .eq('work_date', schedule.work_date)
          .single();

        if (selectError && selectError.code !== 'PGRST116') {
          console.error('조회 에러:', selectError);
        }

        if (existing) {
          const { error: updateError } = await supabase
            .from('duties')
            .update(schedule)
            .eq('id', existing.id);
          
          if (updateError) {
            console.error('업데이트 에러:', updateError);
            alert(`업데이트 실패: ${updateError.message}`);
          } else {
            console.log('업데이트 성공:', schedule);
          }
        } else {
          const { error: insertError } = await supabase
            .from('duties')
            .insert(schedule);
          
          if (insertError) {
            console.error('삽입 에러:', insertError);
            alert(`삽입 실패: ${insertError.message}`);
          } else {
            console.log('삽입 성공:', schedule);
          }
        }
      }

      setLoading(false);
      alert('저장되었습니다.');
    } catch (error) {
      console.error('저장 중 에러:', error);
      setLoading(false);
      alert(`저장 실패: ${error.message}`);
    }
  };

  const changeWeek = (direction) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentWeekStart(newDate);
  };

  const addEmployee = (employeeId) => {
    const employee = allEmployees.find(emp => emp.id === employeeId);
    if (employee && !employees.find(emp => emp.id === employeeId)) {
      setEmployees([...employees, employee]);
      setShowAddEmployee(false);
      setSearchTerm('');
    }
  };

  const addPartTime = () => {
    if (!partTimeName.trim()) {
      alert('아르바이트 이름을 입력하세요.');
      return;
    }
    
    const partTimeEmployee = {
      id: `parttime_${Date.now()}`,
      name: partTimeName.trim(),
      branch: user?.branch,
      user_type: '아르바이트',
      isPartTime: true
    };
    
    setEmployees([...employees, partTimeEmployee]);
    setPartTimeName('');
    setShowPartTimeInput(false);
  };

  const filteredEmployees = allEmployees.filter(emp => 
    emp.branch !== user?.branch && 
    (emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     emp.branch?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getWeeklyHours = (userId) => {
    let total = 0;
    weekDates.forEach(date => {
      const key = `${userId}_${formatDate(date)}`;
      if (schedules[key]?.work_hours) {
        total += schedules[key].work_hours;
      }
    });
    return total;
  };

  const timeToPercent = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 9 * 60;
    const endMinutes = 22 * 60;
    return ((totalMinutes - startMinutes) / (endMinutes - startMinutes)) * 100;
  };

  const handleBarClick = (employeeId, date) => {
    console.log('바 클릭:', employeeId, formatDate(date));
    setEditingCell({ employeeId, date: formatDate(date) });
  };

  const timeOptions = Array.from({ length: 27 }, (_, i) => {
    const h = Math.floor(i / 2) + 9;
    const m = i % 2 === 0 ? '00' : '30';
    return `${String(h).padStart(2, '0')}:${m}`;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6 relative">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-teal-600"
          >
            <ArrowLeft className="w-5 h-5" />
            나가기
          </button>
          
          <div className="flex items-center gap-3 absolute left-1/2 transform -translate-x-1/2">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-12 h-12 object-contain"
            />
            <h1 className="text-3xl font-bold text-teal-600 leading-none -mt-2">
              근무일정관리
            </h1>
          </div>
          
          <div className="w-24"></div>
        </div>

        {/* 컨트롤 바 */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => changeWeek(-1)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
              >
                ← 이전 주
              </button>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-lg">
                <Calendar className="w-5 h-5 text-teal-600" />
                <span className="font-semibold text-teal-600">
                  {formatDate(weekDates[0])} ~ {formatDate(weekDates[6])}
                </span>
              </div>

              <button
                onClick={() => changeWeek(1)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
              >
                다음 주 →
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowBranchSelect(!showBranchSelect);
                  setShowAddEmployee(false);
                  setShowPartTimeInput(false);
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                타지점보기
              </button>

              <button
                onClick={() => {
                  setShowAddEmployee(!showAddEmployee);
                  setShowPartTimeInput(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                타지점 직원
              </button>

              <button
                onClick={() => {
                  setShowPartTimeInput(!showPartTimeInput);
                  setShowAddEmployee(false);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                아르바이트
              </button>

              <button
                onClick={saveSchedules}
                disabled={loading}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 font-medium disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    저장
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 아르바이트 추가 */}
        {showPartTimeInput && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">아르바이트 추가</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={partTimeName}
                onChange={(e) => setPartTimeName(e.target.value)}
                placeholder="아르바이트 이름 입력"
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                onKeyPress={(e) => e.key === 'Enter' && addPartTime()}
              />
              <button
                onClick={addPartTime}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setShowPartTimeInput(false);
                  setPartTimeName('');
                }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                취소
              </button>
            </div>
          </div>
        )}


        {/* 타지점 직원 추가 */}
        {showAddEmployee && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">타지점 직원 추가</h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="이름 또는 지점명 검색..."
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
              {filteredEmployees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => addEmployee(emp.id)}
                  className="px-4 py-3 text-sm border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={employees.some(e => e.id === emp.id)}
                >
                  <div className="font-semibold text-gray-800">{emp.name}</div>
                  <div className="text-xs text-gray-500">{emp.branch}</div>
                </button>
              ))}
            </div>
          </div>
        )}


        {/* 타지점 선택 */}
        {showBranchSelect && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">타지점 근무표 보기</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setSelectedBranch(null);
                  setShowBranchSelect(false);
                }}
                className="w-full px-4 py-2 text-left bg-teal-50 hover:bg-teal-100 rounded-lg border-2 border-teal-600"
              >
                {user?.branch} (내 지점)
              </button>
              {branches
                .filter(branch => branch !== user?.branch)
                .map((branch, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedBranch(branch);
                      setShowBranchSelect(false);
                    }}
                    className="w-full px-4 py-2 text-left bg-gray-50 hover:bg-gray-100 rounded-lg"
                  >
                    {branch}
                  </button>
                ))}
            </div>
          </div>
        )}
        {/* 바 차트 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">

          {/* 현재 보는 지점 표시 */}
          {selectedBranch && (
            <div className="bg-orange-50 border-2 border-orange-500 px-4 py-2 mb-2 rounded-lg">
              <span className="font-bold text-orange-700">
                현재 보는 지점: {selectedBranch}
              </span>
            </div>
          )}
          <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white py-1 px-1">
            <div className="grid grid-cols-9 gap-1 items-center">
              <div className="font-bold text-base text-center">직원</div>
              {weekDates.map((date, idx) => {
                const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
                return (
                  <div key={idx} className="text-center font-bold text-base">
                    {dayNames[date.getDay()]}
                  </div>
                );
              })}
              <div className="font-bold text-base text-center">주간</div>
            </div>
          </div>

          <div>
            {employees.map((employee) => {
              const weeklyTotal = getWeeklyHours(employee.id);
              
              return (
                <div key={employee.id} className="py-0.5 px-1 border-b border-gray-200 hover:bg-gray-50">
                  <div className="grid grid-cols-9 gap-1 items-center">
                    <div className="text-center">
                      <div className="font-bold text-lg text-teal-600">{employee.name}</div>
                      {employee.isPartTime && (
                        <span className="text-xs text-purple-600">알바</span>
                      )}
                    </div>

                    {weekDates.map((date, idx) => {
                      const key = `${employee.id}_${formatDate(date)}`;
                      const schedule = schedules[key] || {};
                      const hasSchedule = schedule.start_time && schedule.end_time;

                      return (
                        <div key={idx} className="relative">
                          <div 
                            className="h-10 bg-gray-100 rounded cursor-pointer hover:bg-gray-200 relative"
                            onClick={() => handleBarClick(employee.id, date)}
                          >
                            {hasSchedule && (
                              <div
                                className="absolute h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded flex flex-col items-center justify-center text-white font-bold pointer-events-none"
                                style={{
                                  left: `${timeToPercent(schedule.start_time)}%`,
                                  width: `${timeToPercent(schedule.end_time) - timeToPercent(schedule.start_time)}%`,
                                  minWidth: '20px'
                                }}
                              >
                                <div className="text-xs leading-tight">{schedule.start_time}</div>
                                <div className="text-xs leading-tight">{schedule.end_time}</div>
                              </div>
                            )}
                            {!hasSchedule && (
                              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                                +
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* 주간 합계 */}
                    <div className="text-center">
                      <span className="text-base font-bold text-teal-600">
                        {weeklyTotal > 0 ? `${weeklyTotal.toFixed(1)}h` : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 일일 합계 */}
            <div className="bg-gray-100 py-0.5 px-1 border-t-2 border-teal-600">
              <div className="grid grid-cols-9 gap-1 items-center">
                <div className="text-center font-bold text-lg text-teal-600">일일 합계</div>
                {weekDates.map((date, idx) => {
                  let dailyTotal = 0;
                  employees.forEach(emp => {
                    const key = `${emp.id}_${formatDate(date)}`;
                    if (schedules[key]?.work_hours) {
                      dailyTotal += schedules[key].work_hours;
                    }
                  });

                  return (
                    <div key={idx} className="text-center">
                      <span className="text-lg font-bold text-teal-600">
                        {dailyTotal > 0 ? `${dailyTotal.toFixed(1)}h` : '-'}
                      </span>
                    </div>
                  );
                })}
                <div className="text-center">
                  <span className="text-lg font-bold text-teal-700">
                    {Object.values(schedules).reduce((sum, s) => sum + (s.work_hours || 0), 0).toFixed(1)}h
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 편집 모달 */}
      {editingCell && (() => {
        const employee = employees.find(e => e.id === editingCell.employeeId);
        const date = weekDates.find(d => formatDate(d) === editingCell.date);
        const schedule = schedules[`${editingCell.employeeId}_${editingCell.date}`] || {};
        
        if (!employee || !date) return null;

        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const dayName = dayNames[date.getDay()];

        return (
          <div 
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setEditingCell(null)}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl p-6 w-80"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-teal-600 mb-4 text-center">
                {employee.name} - {dayName}요일 ({date.getDate()}일)
              </h3>
              
              <div className="space-y-4">
                <div className="relative z-[2000]">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">출근 시간</label>
                  <select
                    value={schedule.start_time || ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      console.log('출근 시간 변경:', newValue);
                      updateSchedule(editingCell.employeeId, editingCell.date, newValue, schedule.end_time);
                    }}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none relative z-[2000]"
                    style={{ position: 'relative', zIndex: 2000 }}
                  >
                    <option value="">선택하세요</option>
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div className="relative z-[2000]">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">퇴근 시간</label>
                  <select
                    value={schedule.end_time || ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      console.log('퇴근 시간 변경:', newValue);
                      updateSchedule(editingCell.employeeId, editingCell.date, schedule.start_time, newValue);
                    }}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none relative z-[2000]"
                    style={{ position: 'relative', zIndex: 2000 }}
                  >
                    <option value="">선택하세요</option>
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>


                <div className="bg-teal-50 rounded-lg p-3 text-center">
                  <span className="text-teal-700 font-bold text-lg">
                    {schedule.work_hours > 0 ? `${schedule.work_hours}시간` : '0시간'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCell(null)}
                    className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold"
                  >
                    확인
                  </button>
                  {(schedule.start_time || schedule.end_time) && (
                    <button
                      onClick={() => {
                        updateSchedule(editingCell.employeeId, editingCell.date, '', '');
                        setEditingCell(null);
                      }}
                      className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default WeeklyScheduleGrid;