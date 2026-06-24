const authService = require('./utils/auth-service');

App({
  onLaunch: function () {
    // 初始化时检查本地存储的token
    this.checkLoginStatus();
  },
  
  // 检查登录状态
  checkLoginStatus: function () {
    authService.checkLoginStatus();
  },
  
  // 检查是否登录，未登录则跳转到登录页面
  checkAuth: function (callback) {
    if (!authService.checkLoginStatus()) {
      // 直接跳转到登录页
      wx.navigateTo({ url: '/pages/login/login' });
      if (callback) callback(false);
      return false;
    }
    return true;
  },
  
  // 网络请求方法（保留用于向后兼容）
  request: function (url, method, data) {
    const token = this.globalData.token;
    return authService._request(url, method, data, token);
  },
  
  globalData: {
    userInfo: null,
    token: null,
    merchantInfo: {},
    services: [],
    staff: [],
    appointments: [],
    queue: {
      currentNumber: 0,
      yourNumber: null,
      estimatedWaitTime: 0
    }
  }
})