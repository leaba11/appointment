import { request, API_BASE_URL } from './index.js';

// 员工管理 API
export const staffApi = {
  /**
   * 获取员工列表
   * @returns {Promise<Array>} 员工列表
   */
  getAll: () => request(`${API_BASE_URL}/staff`),
  
  /**
   * 获取员工详情
   * @param {number} id - 员工 ID
   * @returns {Promise<Object>} 员工详情
   */
  getById: (id) => request(`${API_BASE_URL}/staff/${id}`),
  
  /**
   * 创建员工
   * @param {Object} data - 员工数据
   * @returns {Promise<Object>} 创建结果
   */
  create: (data) => request(`${API_BASE_URL}/staff`, 'POST', data),
  
  /**
   * 更新员工
   * @param {number} id - 员工 ID
   * @param {Object} data - 员工数据
   * @returns {Promise<Object>} 更新结果
   */
  update: (id, data) => request(`${API_BASE_URL}/staff/${id}`, 'PUT', data),
  
  /**
   * 删除员工
   * @param {number} id - 员工 ID
   * @returns {Promise<Object>} 删除结果
   */
  delete: (id) => request(`${API_BASE_URL}/staff/${id}`, 'DELETE'),
  
  /**
   * 获取员工评价列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Array>} 评价列表
   */
  getRatings: (params) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return request(`${API_BASE_URL}/staff/ratings/list?${searchParams.toString()}`);
  }
};
