import { request, API_BASE_URL } from './index.js';

// 排队管理 API
export const queueApi = {
  /**
   * 获取队列信息
   * @returns {Promise<Object>} 队列信息
   */
  getQueue: () => request(`${API_BASE_URL}/queue`),
  
  /**
   * 获取排队列表
   * @returns {Promise<Array>} 排队列表
   */
  getQueueList: () => request(`${API_BASE_URL}/queue/list`),
  
  /**
   * 叫号
   * @returns {Promise<Object>} 叫号结果
   */
  callNext: () => request(`${API_BASE_URL}/queue/call-next`, 'POST'),
  
  /**
   * 更新排队状态
   * @param {number} id - 记录 ID
   * @param {string} status - 状态
   * @returns {Promise<Object>} 更新结果
   */
  updateStatus: (id, status) => request(`${API_BASE_URL}/queue/update-status`, 'POST', { recordId: id, status }),
  
  /**
   * 完成服务
   * @param {number} id - 记录 ID
   * @returns {Promise<Object>} 完成结果
   */
  completeService: (id) => request(`${API_BASE_URL}/queue/complete-service`, 'POST', { recordId: id })
};
