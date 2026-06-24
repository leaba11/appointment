/**
 * 日期工具函数
 */

/**
 * 获取月份的天数
 * @param {number} year - 年份
 * @param {number} month - 月份 (0-11)
 * @returns {number} 天数
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * 获取月份的第一天是星期几
 * @param {number} year - 年份
 * @param {number} month - 月份 (0-11)
 * @returns {number} 星期几 (0-6, 0 表示周日)
 */
export function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

/**
 * 检查日期是否是今天
 * @param {Date} date - 日期
 * @returns {boolean} 是否是今天
 */
export function isToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * 获取一个月的日历数据
 * @param {number} year - 年份
 * @param {number} month - 月份 (0-11)
 * @returns {Array} 日历数据数组
 */
export function generateCalendarDays(year, month, appointments = []) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const calendarDays = [];
  
  // 添加上月的天数
  const prevMonthDays = getDaysInMonth(year, month - 1);
  for (let i = firstDay - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthDays - i);
    calendarDays.push({
      date: date,
      day: prevMonthDays - i,
      isCurrentMonth: false,
      appointments: []
    });
  }
  
  // 添加当月的天数
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayAppointments = appointments.filter(app => {
      if (typeof app.date === 'string' && app.date.includes('T')) {
        return app.date.split('T')[0] === dateStr;
      }
      return app.date === dateStr;
    });
    
    calendarDays.push({
      date: date,
      day: day,
      isCurrentMonth: true,
      appointments: dayAppointments
    });
  }
  
  // 添加下月的天数，使总天数为 42 天 (6 行)
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    calendarDays.push({
      date: date,
      day: day,
      isCurrentMonth: false,
      appointments: []
    });
  }
  
  return calendarDays;
}
