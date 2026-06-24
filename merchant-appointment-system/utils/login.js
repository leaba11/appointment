// 登录模块（重构为认证服务的简单封装）
const authService = require('./auth-service');

const loginModule = {
  // 登录（向后兼容的接口）
  login: async function(userInfo) {
    return authService.login(userInfo);
  },

  // 检查登录状态
  checkLoginStatus: function() {
    return authService.checkLoginStatus();
  },

  // 绑定手机号
  bindPhoneNumber: function(code) {
    return authService.bindPhoneNumber(code);
  },

  // 退出登录
  logout: function() {
    return authService.logout();
  }
};

module.exports = loginModule;