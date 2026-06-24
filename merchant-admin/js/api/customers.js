import { request, API_BASE_URL } from './index.js';

// 客户管理 API
export const customersApi = {
  /**
   * 获取客户列表
   * @returns {Promise<Array>} 客户列表
   */
  getAll: () => request(`${API_BASE_URL}/stats/customers`),
  
  /**
   * 获取客户详情
   * @param {number} id - 客户 ID
   * @returns {Promise<Object>} 客户详情
   */
  getById: (id) => request(`${API_BASE_URL}/stats/customers/${id}`)
};
