// 统一的认证服务
const authService = {
  // 服务器配置
  // 注意：在微信小程序开发环境中，需要在开发者工具中勾选"不校验合法域名"
  // 在生产环境中，需要在微信公众平台配置合法域名
  config: {
    baseUrl: 'http://localhost:3000',
    timeout: 10000
  },

  // 更新配置
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  },

  // 获取完整的 API 地址
  getApiUrl(path) {
    return this.config.baseUrl + path;
  },

  // 获取或生成设备标识（用于更稳定的用户识别）
  getDeviceId: function() {
    let deviceId = wx.getStorageSync('deviceId');
    if (!deviceId) {
      // 生成一个随机的设备标识
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      deviceId = 'device_' + timestamp + '_' + random;
      wx.setStorageSync('deviceId', deviceId);
    }
    return deviceId;
  },

  // 登录
  login: async function(userInfo = null, gender = null, phone = null) {
    try {
      // 1. 获取微信登录凭证
      const loginRes = await this._wxLogin();
      if (!loginRes.code) {
        throw new Error('获取登录凭证失败');
      }

      // 2. 发送登录请求到服务器
      const loginData = { 
        code: loginRes.code,
        deviceId: this.getDeviceId()
      };
      if (userInfo) {
        loginData.userInfo = userInfo;
      }
      if (gender) {
        loginData.gender = gender;
      }
      if (phone) {
        loginData.phone = phone;
      }

      console.log('发送登录请求，数据:', loginData);
      const response = await this._request('/api/auth/login', 'POST', loginData);
      
      // 3. 存储认证信息
      this._storeAuthInfo(response.token, response.user);
      
      // 4. 同步到globalData
      const app = getApp();
      if (app && app.globalData) {
        app.globalData.token = response.token;
        app.globalData.userInfo = response.user;
      }
      
      console.log('登录成功，获取到新token，用户ID:', response.user.id);
      return response;
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: error.message || '登录失败，请稍后重试',
        icon: 'none'
      });
      throw error;
    }
  },

  // 获取用户信息授权
  getUserProfile: async function() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          const userInfo = res.userInfo;
          
          // 检查是否已登录
          const token = wx.getStorageSync('token');
          if (!token) {
            // 未登录，直接返回用户信息，不存储
            resolve(userInfo);
            return;
          }
          
          // 更新本地存储的用户信息
          const currentUserInfo = wx.getStorageSync('userInfo') || {};
          const updatedUserInfo = {
            ...currentUserInfo,
            avatarUrl: userInfo.avatarUrl,
            nickName: userInfo.nickName,
            gender: userInfo.gender,
            city: userInfo.city,
            province: userInfo.province,
            country: userInfo.country
          };
          
          this._storeAuthInfo(token, updatedUserInfo);
          
          // 发送用户信息到服务器
          this.updateUserInfo(updatedUserInfo).then(() => {
            resolve(updatedUserInfo);
          }).catch(err => {
            // 即使服务器更新失败，也返回本地更新的用户信息
            console.warn('更新用户信息到服务器失败:', err);
            resolve(updatedUserInfo);
          });
        },
        fail: (err) => {
          console.error('获取用户信息失败:', err);
          reject(new Error('获取用户信息失败'));
        }
      });
    });
  },

  // 绑定手机号
  bindPhoneNumber: async function(code) {
    try {
      const token = wx.getStorageSync('token');
      if (!token) {
        throw new Error('请先登录');
      }

      const response = await this._request('/api/auth/bind-phone', 'POST', { code }, token);
      
      // 更新本地存储的用户信息
      const currentUserInfo = wx.getStorageSync('userInfo') || {};
      const updatedUserInfo = {
        ...currentUserInfo,
        phone: response.phone
      };
      
      this._storeAuthInfo(null, updatedUserInfo);
      
      wx.showToast({
        title: '手机号绑定成功',
        icon: 'success'
      });
      
      return response;
    } catch (error) {
      console.error('绑定手机号失败:', error);
      wx.showToast({
        title: error.message || '绑定失败，请稍后重试',
        icon: 'none'
      });
      throw error;
    }
  },

  // 检查登录状态
  checkLoginStatus: function() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    // 确保token是字符串且不为空，userInfo是对象且不为空
    const isLoggedIn = typeof token === 'string' && token.length > 0 && 
                      typeof userInfo === 'object' && userInfo !== null && 
                      Object.keys(userInfo).length > 0;
    
    // 同步到 globalData
    const app = getApp();
    if (app && app.globalData) {
      app.globalData.token = token;
      app.globalData.userInfo = userInfo;
    }
    
    console.log('检查登录状态:', { token: !!token, userInfo: !!userInfo, isLoggedIn });
    return isLoggedIn;
  },

  // 退出登录
  logout: function() {
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    
    // 清除 globalData
    const app = getApp();
    if (app && app.globalData) {
      app.globalData.token = null;
      app.globalData.userInfo = null;
    }
    
    wx.showToast({
      title: '已退出登录',
      icon: 'success'
    });
  },

  // 更新用户信息
  updateUserInfo: async function(userInfo) {
    const token = wx.getStorageSync('token');
    if (!token) {
      throw new Error('请先登录');
    }

    return this._request('/api/auth/update-user', 'PUT', userInfo, token);
  },

  // 存储认证信息到本地存储和 globalData
  _storeAuthInfo: function(token, userInfo) {
    const app = getApp();
    
    if (token) {
      wx.setStorageSync('token', token);
      if (app && app.globalData) {
        app.globalData.token = token;
      }
    }
    
    if (userInfo && token) {
      // 只有在有token的情况下才存储userInfo
      wx.setStorageSync('userInfo', userInfo);
      if (app && app.globalData) {
        app.globalData.userInfo = userInfo;
      }
    }
  },

  // 封装 wx.login
  _wxLogin: function() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            resolve(res);
          } else {
            reject(new Error('获取登录凭证失败'));
          }
        },
        fail: (err) => {
          reject(new Error('获取登录凭证失败'));
        }
      });
    });
  },

  // 封装网络请求
  _request: function(url, method, data, token = null) {
    return new Promise((resolve, reject) => {
      const fullUrl = this.getApiUrl(url);
      // 如果没有传入token，从本地存储获取
      const finalToken = token || wx.getStorageSync('token');
      console.log(`发送请求: ${method} ${fullUrl}`, data);
      console.log(`使用的token: ${finalToken ? '有token' : '无token'}`);
      
      wx.request({
        url: fullUrl,
        method: method || 'GET',
        data: data || {},
        header: {
          'Content-Type': 'application/json',
          'Authorization': finalToken ? 'Bearer ' + finalToken : ''
        },
        timeout: this.config.timeout,
        success: (res) => {
          console.log(`请求成功:`, res.data);
          if (res.statusCode === 401) {
            // Token过期，清除认证信息
            this.logout();
            reject(new Error('登录已过期，请重新登录'));
          } else if (res.data && res.data.success) {
            resolve(res.data.data);
          } else {
            const errorMsg = res.data ? res.data.message : '请求失败';
            console.error('请求失败:', res.data);
            reject(new Error(errorMsg));
          }
        },
        fail: (err) => {
          console.error(`请求失败:`, err);
          reject(new Error('网络错误，请检查网络连接'));
        }
      });
    });
  }
};

module.exports = authService;