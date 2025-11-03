// 주간 날짜 배열 생성 (월요일 시작)
export const getWeekDates = (startDate) => {
  const dates = [];
  const start = new Date(startDate);
  
  // 해당 주의 월요일로 이동
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  
  // 월요일부터 일요일까지 7일
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  
  return dates;
};

// 날짜를 YYYY-MM-DD 형식으로 포맷
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 시간을 HH:MM 형식으로 포맷
export const formatTime = (time) => {
  if (!time) return '';
  return time.substring(0, 5);
};