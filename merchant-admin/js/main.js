// 主应用入口文件 - 模块化版本
// 这个文件保留了原有的功能，但采用了更清晰的组织方式

console.log('商户管理后台 - 模块化版本启动中...');

// 全局配置
const Config = {
  API_BASE_URL: '/api'
};

// 通用工具函数
const Utils = {
  // 日期格式化
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  },

  // 日期时间格式化
  formatDateTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // 金额格式化
  formatAmount(amount) {
    if (typeof amount !== 'number') return '¥0';
    return `¥${amount.toFixed(2)}`;
  },

  // 状态格式化
  formatStatus(status) {
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
  },

  // 获取状态对应的 CSS 类
  getStatusClass(status) {
    if (status === '已完成' || status === 'completed') {
      return 'status-completed';
    } else if (status === '已取消' || status === 'cancelled') {
      return 'status-cancelled';
    } else if (status === '等待中' || status === '已叫号' || status === 'pending' || status === 'waiting' || status === 'called') {
      return 'status-pending';
    } else {
      return 'status-default';
    }
  },

  // 获取性别对应的图标
  getGenderIcon(gender) {
    if (gender === 'male') {
      return '👨';
    } else if (gender === 'female') {
      return '👩';
    } else {
      return '👤';
    }
  },
  
  // 格式化日期（简短格式，仅年月日）
  formatDateShort(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit'
    });
  }
};

// API 请求模块
const API = {
  // 通用请求方法
  async request(url, method = 'GET', data = null, token = null) {
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
      throw error;
    }
  },

  // 认证相关
  auth: {
    login: (credentials) => API.request(`${Config.API_BASE_URL}/admin/login`, 'POST', credentials)
  },

  // 服务相关
  services: {
    getAll: () => API.request(`${Config.API_BASE_URL}/services`),
    create: (data) => API.request(`${Config.API_BASE_URL}/services`, 'POST', data),
    update: (id, data) => API.request(`${Config.API_BASE_URL}/services/${id}`, 'PUT', data),
    delete: (id) => API.request(`${Config.API_BASE_URL}/services/${id}`, 'DELETE')
  },

  // 员工相关
  staff: {
    getAll: () => API.request(`${Config.API_BASE_URL}/staff`),
    create: (data) => API.request(`${Config.API_BASE_URL}/staff`, 'POST', data),
    update: (id, data) => API.request(`${Config.API_BASE_URL}/staff/${id}`, 'PUT', data),
    delete: (id) => API.request(`${Config.API_BASE_URL}/staff/${id}`, 'DELETE'),
    getRatings: (params) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value) searchParams.append(key, value);
        });
      }
      return API.request(`${Config.API_BASE_URL}/staff/ratings/list?${searchParams.toString()}`);
    }
  },

  // 预约相关
  appointments: {
    getAll: () => API.request(`${Config.API_BASE_URL}/appointments/all`),
    updateStatus: (id, status) => API.request(`${Config.API_BASE_URL}/appointments/${id}/status`, 'PUT', { status }),
    complete: (id) => API.request(`${Config.API_BASE_URL}/appointments/${id}/complete`, 'POST')
  },

  // 排队相关
  queue: {
    getQueue: () => API.request(`${Config.API_BASE_URL}/queue`),
    getQueueList: () => API.request(`${Config.API_BASE_URL}/queue/list`),
    callNext: () => API.request(`${Config.API_BASE_URL}/queue/call-next`, 'POST'),
    updateStatus: (id, status) => API.request(`${Config.API_BASE_URL}/queue/update-status`, 'POST', { recordId: id, status }),
    completeService: (id) => API.request(`${Config.API_BASE_URL}/queue/complete-service`, 'POST', { recordId: id })
  },

  // 客户相关
  customers: {
    getAll: () => API.request(`${Config.API_BASE_URL}/stats/customers`),
    getById: (id) => API.request(`${Config.API_BASE_URL}/stats/customers/${id}`)
  },

  // 统计相关
  stats: {
    getStats: () => API.request(`${Config.API_BASE_URL}/stats`),
    getAppointmentDistribution: () => API.request(`${Config.API_BASE_URL}/stats/appointment-distribution`),
    getRevenue: () => API.request(`${Config.API_BASE_URL}/stats/revenue`),
    getMerchant: () => API.request(`${Config.API_BASE_URL}/merchant`)
  },
  
  // 商户信息相关
  merchant: {
    getInfo: () => API.request(`${Config.API_BASE_URL}/merchant`),
    updateInfo: (data) => API.request(`${Config.API_BASE_URL}/merchant`, 'PUT', data)
  }
};

// 导出工具函数和 API 供外部使用
window.MerchantAdmin = {
  Config,
  Utils,
  API
};

console.log('模块化核心库加载完成');
