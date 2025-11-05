import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Save, RefreshCw, Plus, Search, ArrowLeft, Lightbulb, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getWeekDates, formatDate } from '../../lib/dateUtils';

const WeeklyScheduleView = ({ user }) => {
  const navigate = useNavigate();
  const isReadOnly = true; // 읽기 전용 모드
  // 현재 주의 월요일 계산
  const getMondayOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 일요일이면 -6, 아니면 +1
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const [currentWeekStart, setCurrentWeekStart] = useState(getMondayOfWeek(new Date()));
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
  const [workDiaries, setWorkDiaries] = useState({});
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDiaryDate, setSelectedDiaryDate] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const weekDates = getWeekDates(currentWeekStart);

  useEffect(() => {
    loadEmployees();
    loadAllEmployees();
    loadSchedules();
    loadBranches();
    loadWorkDiaries();
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
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - 1);
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const { data, error } = await supabase
      .from('duties')
      .select('*')
      .gte('work_date', formatDate(weekStart))
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

  const loadWorkDiaries = async () => {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - 1);
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const { data, error } = await supabase
      .from('work_diaries')
      .select('*')
      .gte('work_date', formatDate(weekStart))
      .lte('work_date', formatDate(weekEnd));

    if (!error && data) {
      const diaryMap = {};
      data.forEach(diary => {
        const key = `${diary.user_id}_${diary.work_date}`;
        diaryMap[key] = diary;
      });
      setWorkDiaries(diaryMap);
    }
  };

  const updateSchedule = async (userId, date, startTime, endTime) => {
    const branch_id = await getBranchId(user?.branch);
    const dateStr = typeof date === 'string' ? date : formatDate(date);
    
    const key = `${userId}_${dateStr}`;
    
    if (!startTime && !endTime) {
      
      // DB에서 삭제
      const { error: deleteError } = await supabase
        .from('duties')
        .delete()
        .eq('user_id', userId)
        .eq('work_date', dateStr);
      
      if (deleteError) {
      } else {
      }
      
      // State에서 삭제
      setSchedules(prev => {
        const newSchedules = { ...prev };
        delete newSchedules[key];
        return newSchedules;
      });
      return;
    }

    if (!startTime || !endTime) {
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


    setSchedules(prev => {
      const newSchedules = { ...prev, [key]: updated };
      return newSchedules;
    });
    
  };

  const saveSchedules = async () => {
    setLoading(true);
    const schedulesToSave = Object.values(schedules).filter(s => 
      s.start_time && s.end_time && s.work_hours > 0
    );


    try {
      for (const schedule of schedulesToSave) {
        const { data: existingList, error: selectError } = await supabase
          .from('duties')
          .select('id')
          .eq('user_id', schedule.user_id)
          .eq('work_date', schedule.work_date);

        if (selectError && selectError.code !== 'PGRST116') {
        }

        const existing = existingList && existingList.length > 0 ? existingList[0] : null;

        if (existing) {
          const { error: updateError } = await supabase
            .from('duties')
            .update(schedule)
            .eq('id', existing.id);
          
          if (updateError) {
            alert(`업데이트 실패: ${updateError.message}`);
          } else {
          }
        } else {
          const { error: insertError } = await supabase
            .from('duties')
            .insert(schedule);
          
          if (insertError) {
            alert(`삽입 실패: ${insertError.message}`);
          } else {
          }
        }
      }

      setLoading(false);
      alert('저장되었습니다.');
    } catch (error) {
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
    setEditingCell({ employeeId, date: formatDate(date) });
  };

  const handleRemoveEmployee = (employee) => {
    if (window.confirm(`${employee.name}을(를) 목록에서 제거하시겠습니까?\n\n(사용자 정보는 삭제되지 않으며, 이 화면에서만 제거됩니다)`)) {
      setEmployees(prev => prev.filter(emp => emp.id !== employee.id));
      setContextMenu(null);
    }
  };

  const timeOptions = Array.from({ length: 27 }, (_, i) => {
    const h = Math.floor(i / 2) + 9;
    const m = i % 2 === 0 ? '00' : '30';
    return `${String(h).padStart(2, '0')}:${m}`;
  });

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6"
      onClick={() => setContextMenu(null)}
    >
      <div className="max-w-[1400px] mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6 relative">
          <button
            onClick={() => navigate('/dashboard')}
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
              근무일정표
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
                disabled={isReadOnly}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                타지점 직원
              </button>

              <button
                onClick={() => {
                  setShowPartTimeInput(!showPartTimeInput);
                  setShowAddEmployee(false);
                }}
                disabled={isReadOnly}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                아르바이트
              </button>

              <button
                onClick={saveSchedules}
                disabled={loading || isReadOnly}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-teal-50 border-2 border-teal-500 px-4 py-2 mb-2 rounded-lg">
            <span className="font-bold text-teal-700">
              {selectedBranch ? `현재 보는 지점: ${selectedBranch}` : `내 지점: ${user?.branch}`}
            </span>
          </div>
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
                    <div 
                      className="text-center"
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          employee: employee
                        });
                      }}
                    >
                      <div className="font-bold text-lg text-teal-600 cursor-context-menu">{employee.name}</div>
                      {employee.isPartTime && (
                        <span className="text-xs text-purple-600">알바</span>
                      )}
                    </div>

                    {weekDates.map((date, idx) => {
                      const key = `${employee.id}_${formatDate(date)}`;
                      const schedule = schedules[key] || {};
                      const diary = workDiaries[key] || {};
                      const hasSchedule = schedule.start_time && schedule.end_time;
                      const hasDiary = diary.start_time && diary.end_time;

                      return (
                        <div key={idx} className="relative">
                          {/* 계획 (상단) */}
                          <div 
                            className={`h-4 bg-gray-100 rounded relative mb-1 group ${!isReadOnly ? 'cursor-pointer hover:bg-gray-200' : ''}`}
                            onClick={!isReadOnly ? () => handleBarClick(employee.id, date) : undefined}
                            title={hasSchedule ? `계획: ${schedule.start_time} ~ ${schedule.end_time}` : '계획 없음'}
                          >
                            {hasSchedule && (
                              <>
                                <div
                                  className="absolute h-full rounded"
                                  style={{
                                    left: `${timeToPercent(schedule.start_time)}%`,
                                    width: `${timeToPercent(schedule.end_time) - timeToPercent(schedule.start_time)}%`,
                                    minWidth: '8px',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
                                  }}
                                />
                                {/* 호버 tooltip */}
                                <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
                                  {schedule.start_time} ~ {schedule.end_time}
                                </div>
                              </>
                            )}
                            {!hasSchedule && (
                              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
                                +
                              </div>
                            )}
                          </div>

                          {/* 실적 (하단) */}
                          <div 
                            className="h-4 bg-gray-100 rounded relative group"
                            title={hasDiary ? `실적: ${diary.start_time} ~ ${diary.end_time}` : '실적 없음'}
                          >
                            {hasDiary && (
                              <>
                                <div
                                  className="absolute h-full rounded"
                                  style={{
                                    left: `${timeToPercent(diary.start_time)}%`,
                                    width: `${timeToPercent(diary.end_time) - timeToPercent(diary.start_time)}%`,
                                    minWidth: '8px',
                                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
                                  }}
                                />
                                {/* 호버 tooltip */}
                                <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
                                  {diary.start_time} ~ {diary.end_time}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* 주간 영역 2x2 그리드 */}
                    <div className="grid grid-cols-2 grid-rows-2 gap-1 border border-gray-300 rounded">
                      {/* 좌상: 계획 합계 */}
                      <div className="flex items-center justify-center bg-blue-50 p-1">
                        <span className="text-sm font-bold text-blue-600">
                          {weeklyTotal > 0 ? `${weeklyTotal.toFixed(1)}h` : '-'}
                        </span>
                      </div>
                      
                      {/* 우상: 전구 아이콘 */}
                      <div className="flex items-center justify-center bg-gray-50 p-1">
                        {(() => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          // 오늘까지의 계획 합계
                          let plannedUntilToday = 0;
                          weekDates.forEach(date => {
                            const dateObj = new Date(date);
                            dateObj.setHours(0, 0, 0, 0);
                            
                            if (dateObj <= today) {
                              const key = `${employee.id}_${formatDate(date)}`;
                              const schedule = schedules[key];
                              if (schedule?.work_hours) {
                                plannedUntilToday += schedule.work_hours;
                              }
                            }
                          });
                          
                          // 미래 계획 합계
                          let plannedFuture = 0;
                          weekDates.forEach(date => {
                            const dateObj = new Date(date);
                            dateObj.setHours(0, 0, 0, 0);
                            
                            if (dateObj > today) {
                              const key = `${employee.id}_${formatDate(date)}`;
                              const schedule = schedules[key];
                              if (schedule?.work_hours) {
                                plannedFuture += schedule.work_hours;
                              }
                            }
                          });
                          
                          // 오늘까지의 실적 합계
                          let actualUntilToday = 0;
                          weekDates.forEach(date => {
                            const dateObj = new Date(date);
                            dateObj.setHours(0, 0, 0, 0);
                            
                            if (dateObj <= today) {
                              const key = `${employee.id}_${formatDate(date)}`;
                              const diary = workDiaries[key];
                              if (diary?.work_hours) {
                                actualUntilToday += diary.work_hours;
                              }
                            }
                          });
                          
                          // 전구 색상 결정
                          let bulbColor, bulbFill, bulbClass;
                          
                          if (plannedUntilToday === 0 && plannedFuture === 0) {
                            // 케이스 3: 계획이 아예 없음
                            bulbColor = 'text-yellow-500';
                            bulbFill = '#eab308';
                            bulbClass = 'yellow';
                          } else if (plannedUntilToday === 0 && plannedFuture > 0) {
                            // 케이스 4: 오늘까지 계획 없고 미래 계획만 있음
                            bulbColor = 'text-gray-400';
                            bulbFill = '#9ca3af';
                            bulbClass = 'gray';
                          } else if (actualUntilToday >= plannedUntilToday) {
                            // 케이스 1: 실적 충분 (잘하고 있음)
                            bulbColor = 'text-blue-500';
                            bulbFill = '#3b82f6';
                            bulbClass = 'blue';
                          } else {
                            // 케이스 2: 실적 부족 (주의 필요)
                            bulbColor = 'text-red-500';
                            bulbFill = '#ef4444';
                            bulbClass = 'red';
                          }
                          
                          return (
                            <Lightbulb 
                              size={20} 
                              className={bulbColor} 
                              fill={bulbFill}
                            />
                          );
                        })()}
                      </div>
                      
                      {/* 좌하: 실적 합계 */}
                      <div className="flex items-center justify-center bg-red-50 p-1">
                        <span className="text-sm font-bold text-red-600">
                          {(() => {
                            let weeklyDiaryTotal = 0;
                            weekDates.forEach(date => {
                              const key = `${employee.id}_${formatDate(date)}`;
                              const diary = workDiaries[key];
                              if (diary?.work_hours) {
                                weeklyDiaryTotal += diary.work_hours;
                              }
                            });
                            return weeklyDiaryTotal > 0 ? `${weeklyDiaryTotal.toFixed(1)}h` : '-';
                          })()}
                        </span>
                      </div>
                      
                      {/* 우하: 책 아이콘 */}
                      <div className="flex items-center justify-center bg-gray-50 p-1 cursor-pointer hover:bg-gray-100"
                           onClick={() => {
                             setSelectedEmployee(employee);
                             const employeeDiaries = weekDates
                               .map(date => ({
                                 date,
                                 diary: workDiaries[`${employee.id}_${formatDate(date)}`]
                               }))
                               .filter(item => item.diary);
                             
                             if (employeeDiaries.length > 0) {
                               setSelectedDiaryDate(employeeDiaries[0].date);
                               setShowDiaryModal(true);
                             }
                           }}>
                        <BookOpen size={20} className="text-teal-600" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 일일계획합계 */}
            <div className="bg-blue-50 py-0.5 px-1 border-t-2 border-blue-600">
              <div className="grid grid-cols-9 gap-1 items-center">
                <div className="text-center font-bold text-lg text-blue-600">일일계획합계</div>
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
                      <span className="text-lg font-bold text-blue-600">
                        {dailyTotal > 0 ? `${dailyTotal.toFixed(1)}h` : '-'}
                      </span>
                    </div>
                  );
                })}
                <div className="text-center">
                  <span className="text-lg font-bold text-blue-700">
                    {Object.values(schedules).reduce((sum, s) => sum + (s.work_hours || 0), 0).toFixed(1)}h
                  </span>
                </div>
              </div>
            </div>

            {/* 일일실적합계 */}
            <div className="bg-red-50 py-0.5 px-1 border-t-2 border-red-600">
              <div className="grid grid-cols-9 gap-1 items-center">
                <div className="text-center font-bold text-lg text-red-600">일일실적합계</div>
                {weekDates.map((date, idx) => {
                  let dailyDiaryTotal = 0;
                  employees.forEach(emp => {
                    const key = `${emp.id}_${formatDate(date)}`;
                    if (workDiaries[key]?.work_hours) {
                      dailyDiaryTotal += workDiaries[key].work_hours;
                    }
                  });

                  return (
                    <div key={idx} className="text-center">
                      <span className="text-lg font-bold text-red-600">
                        {dailyDiaryTotal > 0 ? `${dailyDiaryTotal.toFixed(1)}h` : '-'}
                      </span>
                    </div>
                  );
                })}
                <div className="text-center">
                  <span className="text-lg font-bold text-red-700">
                    {Object.values(workDiaries).reduce((sum, d) => sum + (d.work_hours || 0), 0).toFixed(1)}h
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative z-[2000]">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">출근 시간</label>
                    <select
                      value={schedule.start_time || ''}
                      onChange={(e) => {
                        const newValue = e.target.value;
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
                      onClick={async () => {
                        await updateSchedule(editingCell.employeeId, editingCell.date, '', '');
                        setEditingCell(null);
                        await loadSchedules();
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

      {/* 근무일지 보기 모달 */}
      {showDiaryModal && selectedEmployee && (() => {
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const employeeDiaries = weekDates
          .map(date => ({
            date,
            diary: workDiaries[`${selectedEmployee.id}_${formatDate(date)}`]
          }))
          .filter(item => item.diary);

        if (employeeDiaries.length === 0) return null;

        const currentDiary = workDiaries[`${selectedEmployee.id}_${formatDate(selectedDiaryDate)}`];
        
        return (
          <div 
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setShowDiaryModal(false)}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl p-6 w-[600px] max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-teal-600 text-center mb-4">
                  {selectedEmployee.name} 근무일지
                </h3>

                {/* 탭 */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {employeeDiaries.map(({ date, diary }) => {
                    const isSelected = formatDate(date) === formatDate(selectedDiaryDate);
                    return (
                      <button
                        key={formatDate(date)}
                        onClick={() => setSelectedDiaryDate(date)}
                        className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                          isSelected 
                            ? 'bg-teal-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {dayNames[date.getDay()]} {date.getMonth() + 1}/{date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 근무일지 내용 */}
              {currentDiary && (
                <div className="space-y-4">
                  {/* 근무 시간 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">근무 시간</span>
                      <span className="text-lg font-bold text-teal-600">
                        {currentDiary.start_time} ~ {currentDiary.end_time} ({currentDiary.work_hours}h)
                      </span>
                    </div>
                  </div>

                  {/* 일일 확인목록 */}
                  {(currentDiary.daily_check_clean || currentDiary.daily_check_training || currentDiary.daily_check_list) && (
                    <div className="border-t pt-4">
                      <h4 className="font-bold text-gray-700 mb-2">일일 확인목록</h4>
                      <div className="space-y-1">
                        {currentDiary.daily_check_clean && (
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span>매장 청결점검</span>
                          </div>
                        )}
                        {currentDiary.daily_check_training && (
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span>직원 업무교육</span>
                          </div>
                        )}
                        {currentDiary.daily_check_list && (
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span>직원 체크리스트 점검</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 외근 내용 */}
                  {currentDiary.out_content && (
                    <div className="border-t pt-4">
                      <h4 className="font-bold text-gray-700 mb-2">외근 시 내용</h4>
                      <p className="text-gray-600 whitespace-pre-wrap">{currentDiary.out_content}</p>
                    </div>
                  )}

                  {/* 주인형 모집내용 */}
                  {currentDiary.exemplary_content && (
                    <div className="border-t pt-4">
                      <h4 className="font-bold text-gray-700 mb-2">주인형 모집내용</h4>
                      <p className="text-gray-600 whitespace-pre-wrap">{currentDiary.exemplary_content}</p>
                    </div>
                  )}

                  {/* 인상깊은 고객 */}
                  {currentDiary.memorable_customer && (
                    <div className="border-t pt-4">
                      <h4 className="font-bold text-gray-700 mb-2">오늘 인상깊은 고객</h4>
                      <p className="text-gray-600 whitespace-pre-wrap">{currentDiary.memorable_customer}</p>
                    </div>
                  )}

                  {/* 건의사항 */}
                  {currentDiary.suggestions && (
                    <div className="border-t pt-4">
                      <h4 className="font-bold text-gray-700 mb-2">건의사항</h4>
                      <p className="text-gray-600 whitespace-pre-wrap">{currentDiary.suggestions}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 닫기 버튼 */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowDiaryModal(false)}
                  className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 우클릭 컨텍스트 메뉴 */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[1100]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleRemoveEmployee(contextMenu.employee)}
            className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 font-medium transition-colors"
          >
            목록에서 제거
          </button>
        </div>
      )}
    </div>
  );
};

export default WeeklyScheduleView;