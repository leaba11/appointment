Page({
  data: {
    notifications: true,
    location: true,
    autoLogin: true
  },

  onLoad: function () {
  },

  // 切换通知开关
  toggleNotifications: function (e) {
    this.setData({
      notifications: e.detail.value
    });
  },

  // 切换位置开关
  toggleLocation: function (e) {
    this.setData({
      location: e.detail.value
    });
  },

  // 切换自动登录开关
  toggleAutoLogin: function (e) {
    this.setData({
      autoLogin: e.detail.value
    });
  },

  // 清除缓存
  clearCache: function () {
    wx.clearStorage();
    wx.showToast({
      title: '缓存已清除',
      icon: 'success'
    });
  },

  // 退出登录
  logout: function () {
    const app = getApp();
    app.globalData.token = null;
    app.globalData.userInfo = null;
    wx.clearStorage();
    wx.showToast({
      title: '已退出登录',
      icon: 'success'
    });
  },

  // 返回上一页
  goBack: function () {
    wx.navigateBack();
  }
})