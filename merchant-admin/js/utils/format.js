/**
 * 格式化工具函数
 */

/**
 * 格式化日期为中文格式
 * @param {string|Date} date - 日期字符串或日期对象
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * 格式化日期时间为中文格式
 * @param {string|Date} date - 日期字符串或日期对象
 * @returns {string} 格式化后的日期时间字符串
 */
export function formatDateTime(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 格式化金额
 * @param {number} amount - 金额
 * @returns {string} 格式化后的金额字符串
 */
export function formatAmount(amount) {
  if (typeof amount !== 'number') return '¥0';
  return `¥${amount.toFixed(2)}`;
}

/**
 * 格式化状态为中文
 * @param {string} status - 状态字符串
 * @returns {string} 中文状态
 */
export function formatStatus(status) {
  const statusMap = {
    'pending': '待确认',
    'waiting': '等待中',
    'called': '已叫号',
    'servicing': '服务中',
    'completed': '已完成',
    'cancelled': '已取消',
    'skipped': '已过号'
  };
  return statusMap[status] || status;
}

/**
 * 获取状态对应的 CSS 类名
 * @param {string} status - 状态字符串
 * @returns {string} CSS 类名
 */
export function getStatusClass(status) {
  if (status === '已完成' || status === 'completed') {
    return 'status-completed';
  } else if (status === '已取消' || status === 'cancelled') {
    return 'status-cancelled';
  } else if (status === '等待中' || status === '已叫号' || status === 'pending' || status === 'waiting' || status === 'called') {
    return 'status-pending';
  } else {
    return 'status-default';
  }
}
