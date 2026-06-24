import { request, API_BASE_URL } from './index.js';

// 服务管理 API
export const servicesApi = {
  /**
   * 获取服务列表
   * @returns {Promise<Array>} 服务列表
   */
  getAll: () => request(`${API_BASE_URL}/services`),
  
  /**
   * 获取服务详情
   * @param {number} id - 服务 ID
   * @returns {Promise<Object>} 服务详情
   */
  getById: (id) => request(`${API_BASE_URL}/services/${id}`),
  
  /**
   * 创建服务
   * @param {Object} data - 服务数据
   * @returns {Promise<Object>} 创建结果
   */
  create: (data) => request(`${API_BASE_URL}/services`, 'POST', data),
  
  /**
   * 更新服务
   * @param {number} id - 服务 ID
   * @param {Object} data - 服务数据
   * @returns {Promise<Object>} 更新结果
   */
  update: (id, data) => request(`${API_BASE_URL}/services/${id}`, 'PUT', data),
  
  /**
   * 删除服务
   * @param {number} id - 服务 ID
   * @returns {Promise<Object>} 删除结果
   */
  delete: (id) => request(`${API_BASE_URL}/services/${id}`, 'DELETE')
};
