// API 基础配置
const API_BASE_URL = '/api';

/**
 * 通用请求方法
 * @param {string} url - 请求 URL
 * @param {string} method - 请求方法 (GET, POST, PUT, DELETE)
 * @param {Object} data - 请求数据
 * @param {string} token - 认证 token
 * @returns {Promise<Object>} 请求结果
 */
async function request(url, method = 'GET', data = null, token = null) {
  try {
    console.log('发起请求:', { url, method, data });
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    console.log('请求选项:', options);
    const response = await fetch(url, options);
    console.log('响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('响应数据:', result);
    
    if (!result.success) {
      throw new Error(result.message || '请求失败');
    }
    
    return result;
  } catch (error) {
    console.error('请求错误详情:', error);
    console.error('错误名称:', error.name);
    console.error('错误消息:', error.message);
    throw error;
  }
}

export { API_BASE_URL, request };
