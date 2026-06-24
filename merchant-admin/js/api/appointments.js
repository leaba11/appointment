import { request, API_BASE_URL } from './index.js';

// 预约管理 API
export const appointmentsApi = {
  /**
   * 获取所有预约
   * @returns {Promise<Array>} 预约列表
   */
  getAll: () => request(`${API_BASE_URL}/appointments/all`),
  
  /**
   * 更新预约状态
   * @param {number} id - 预约 ID
   * @param {string} status - 状态
   * @returns {Promise<Object>} 更新结果
   */
  updateStatus: (id, status) => request(`${API_BASE_URL}/appointments/${id}/status`, 'PUT', { status }),
  
  /**
   * 完成预约
   * @param {number} id - 预约 ID
   * @returns {Promise<Object>} 完成结果
   */
  complete: (id) => request(`${API_BASE_URL}/appointments/${id}/complete`, 'POST')
};
