// 引入登录模块
const loginModule = require('../../utils/login.js');

Page({
  data: {
    userInfo: {
      avatarUrl: '',
      nickName: ''
    }
  },

  onLoad() {
    // 检查登录状态
    loginModule.checkLoginStatus();
    // 获取微信用户信息
    this.getUserInfo();
  },

  // 获取微信用户信息
  getUserInfo() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        this.setData({
          userInfo: {
            avatarUrl: res.userInfo.avatarUrl,
            nickName: res.userInfo.nickName
          }
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
      }
    });
  },

  // 微信快捷登录
  async quickLogin() {
    wx.showLoading({ title: '登录中...' });
    try {
      const result = await loginModule.login(this.data.userInfo);
      wx.showToast({ title: '登录成功', icon: 'success' });
      // 登录成功后跳转
      wx.switchTab({ url: '/pages/index/index' });
    } catch (error) {
      wx.showToast({ title: '登录失败', icon: 'none' });
      console.error('登录错误:', error);
    } finally {
      wx.hideLoading();
    }
  },

  // 获取手机号
  getPhoneNumber(e) {
    if (e.detail.code) {
      // 先调用快捷登录
      this.quickLogin().then(() => {
        // 登录成功后处理手机号
        loginModule.bindPhoneNumber(e.detail.code);
      }).catch(err => {
        console.error('登录失败:', err);
        wx.showToast({ title: '登录失败，请先登录', icon: 'none' });
      });
    } else {
      wx.showToast({ title: '获取手机号失败', icon: 'none' });
    }
  },

  // 处理手机号获取（新方式）
  handleGetPhoneNumber(e) {
    if (e.detail.errMsg === 'phonenumberget:fail user deny') {
      wx.showToast({ title: '您拒绝了手机号授权', icon: 'none' });
      return;
    }
    const code = e.detail.code;
    // 先调用快捷登录
    this.quickLogin().then(() => {
      // 登录成功后处理手机号
      loginModule.bindPhoneNumber(code);
    }).catch(err => {
      console.error('登录失败:', err);
      wx.showToast({ title: '登录失败，请先登录', icon: 'none' });
    });
  }
});