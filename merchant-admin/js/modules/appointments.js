import { appointmentsApi } from '../api/appointments.js';
import { generateCalendarDays } from '../utils/date.js';

/**
 * 预约管理模块
 */
export function useAppointments() {
  // 预约相关状态
  const appointments = Vue.ref([]);
  const currentMonth = Vue.ref(new Date().getMonth());
  const currentYear = Vue.ref(new Date().getFullYear());
  const calendarDays = Vue.ref([]);
  const expandedDays = Vue.ref([]);

  // 加载预约列表
  async function loadAppointments() {
    try {
      const result = await appointmentsApi.getAll();
      appointments.value = result.data;
      generateCalendar();
    } catch (error) {
      console.error('加载预约列表失败:', error);
    }
  }

  // 生成日历
  function generateCalendar() {
    calendarDays.value = generateCalendarDays(
      currentYear.value,
      currentMonth.value,
      appointments.value
    );
  }

  // 上一月
  function prevMonth() {
    if (currentMonth.value === 0) {
      currentMonth.value = 11;
      currentYear.value--;
    } else {
      currentMonth.value--;
    }
    generateCalendar();
  }

  // 下一月
  function nextMonth() {
    if (currentMonth.value === 11) {
      currentMonth.value = 0;
      currentYear.value++;
    } else {
      currentMonth.value++;
    }
    generateCalendar();
  }

  // 切换日期展开状态
  function toggleDayExpand(date) {
    const dateStr = date.toISOString().split('T')[0];
    const index = expandedDays.value.indexOf(dateStr);
    if (index > -1) {
      expandedDays.value.splice(index, 1);
    } else {
      expandedDays.value = [dateStr];
    }
  }

  // 获取唯一客户数
  function getUniqueCustomers(appts) {
    const customerNames = new Set(appts.map(a => a.name));
    return customerNames.size;
  }

  return {
    appointments,
    currentMonth,
    currentYear,
    calendarDays,
    expandedDays,
    loadAppointments,
    generateCalendar,
    prevMonth,
    nextMonth,
    toggleDayExpand,
    getUniqueCustomers
  };
}
