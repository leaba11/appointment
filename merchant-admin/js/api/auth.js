import { request, API_BASE_URL } from './index.js';

// 认证相关 API
export const authApi = {
  /**
   * 管理员登录
   * @param {Object} credentials - 登录凭证
   * @param {string} credentials.username - 用户名
   * @param {string} credentials.password - 密码
   * @returns {Promise<Object>} 登录结果
   */
  login: (credentials) => request(`${API_BASE_URL}/admin/login`, 'POST', credentials)
};
