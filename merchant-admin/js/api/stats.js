import { request, API_BASE_URL } from './index.js';

// 统计数据 API
export const statsApi = {
  /**
   * 获取统计数据
   * @returns {Promise<Object>} 统计数据
   */
  getStats: () => request(`${API_BASE_URL}/stats`),
  
  /**
   * 获取预约时段分布
   * @returns {Promise<Object>} 预约时段分布
   */
  getAppointmentDistribution: () => request(`${API_BASE_URL}/stats/appointment-distribution`),
  
  /**
   * 获取营收记录
   * @returns {Promise<Array>} 营收记录
   */
  getRevenue: () => request(`${API_BASE_URL}/stats/revenue`),
  
  /**
   * 获取商户信息
   * @returns {Promise<Object>} 商户信息
   */
  getMerchant: () => request(`${API_BASE_URL}/merchant`)
};
