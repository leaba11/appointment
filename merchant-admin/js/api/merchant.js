import { request, API_BASE_URL } from './index.js';

// 商户信息 API
export const merchantApi = {
  /**
   * 获取商户信息
   * @returns {Promise<Object>} 商户信息
   */
  getInfo: () => request(`${API_BASE_URL}/merchant`),
  
  /**
   * 更新商户信息
   * @param {Object} data - 商户信息
   * @param {string} data.name - 商户名称
   * @param {string} data.address - 商户地址
   * @param {string} data.phone - 联系电话
   * @param {string} data.description - 商户描述
   * @returns {Promise<Object>} 更新结果
   */
  updateInfo: (data) => request(`${API_BASE_URL}/merchant`, 'PUT', data)
};
