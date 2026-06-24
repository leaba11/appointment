const authService = require('../../utils/auth-service');

Page({
  data: {
    merchantInfo: {},
    services: [],
    loading: true,
    showLoginModal: false
  },

  onLoad: function () {
    this.loadData();
    // 检查登录状态
    const isLoggedIn = authService.checkLoginStatus();
    if (isLoggedIn) {
      // 老用户，立即响应，不显示登录弹窗
      console.log('老用户，立即响应，不显示登录弹窗');
      this.setData({ showLoginModal: false });
    } else {
      // 新用户，1秒后显示登录弹窗
      console.log('新用户，1秒后显示登录弹窗');
      setTimeout(() => {
        console.log('1秒后显示登录弹窗');
        this.setData({ showLoginModal: true });
      }, 1000);
    }
  },
  
  // 显示登录弹窗
  showLoginModal: function () {
    const app = getApp();
    console.log('当前token:', app.globalData.token);
    // 只有未登录时才显示登录弹窗
    if (!app.globalData.token) {
      console.log('设置showLoginModal为true');
      this.setData({ showLoginModal: true });
      console.log('设置后的showLoginModal:', this.data.showLoginModal);
    } else {
      console.log('用户已登录，不显示登录弹窗');
      this.setData({ showLoginModal: false });
    }
  },
  
  // 关闭登录弹窗（仅用于登录成功后自动关闭）
  onCloseLoginModal: function () {
    this.setData({ showLoginModal: false });
  },

  // 加载数据
  loadData: function () {
    const app = getApp();
    
    // 获取商户信息
    app.request('/api/merchant').then(merchantInfo => {
      this.setData({ merchantInfo });
    }).catch(err => {
      console.error('获取商户信息失败:', err);
    });
    
    // 获取服务列表
    app.request('/api/services').then(services => {
      this.setData({ services, loading: false });
    }).catch(err => {
      console.error('获取服务列表失败:', err);
      this.setData({ loading: false });
    });
  },

  goToServiceDetail: function (e) {
    const serviceId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/service-detail/service-detail?id=' + serviceId
    })
  },

  onShow: function () {
    // 页面显示时检查登录状态
    console.log('页面显示，检查登录状态');
    const isLoggedIn = authService.checkLoginStatus();
    if (isLoggedIn) {
      // 老用户，立即响应，不显示登录弹窗
      console.log('老用户，立即响应，不显示登录弹窗');
      this.setData({ showLoginModal: false });
    } else {
      // 新用户，1秒后显示登录弹窗
      console.log('新用户，1秒后显示登录弹窗');
      setTimeout(() => {
        console.log('1秒后显示登录弹窗');
        this.setData({ showLoginModal: true });
      }, 1000);
    }
  }
})