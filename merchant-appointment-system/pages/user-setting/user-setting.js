Page({
  data: {
    userInfo: null,
    username: '',
    phone: '',
    gender: '',
    genders: [
      { value: 'male', label: '男' },
      { value: 'female', label: '女' }
    ]
  },

  onLoad: function () {
    const app = getApp();
    if (app.globalData.userInfo) {
      // 处理性别格式：如果是数字，转换为字符串；如果是字符串，直接使用
      let gender = '';
      if (app.globalData.userInfo.gender === 1) {
        gender = 'male';
      } else if (app.globalData.userInfo.gender === 2) {
        gender = 'female';
      } else if (typeof app.globalData.userInfo.gender === 'string') {
        gender = app.globalData.userInfo.gender;
      }
      
      this.setData({
        userInfo: app.globalData.userInfo,
        username: app.globalData.userInfo.nickName || '',
        phone: app.globalData.userInfo.phone || '',
        gender: gender
      });
    }
  },

  // 输入用户名
  inputUsername: function (e) {
    this.setData({
      username: e.detail.value
    });
  },

  // 输入电话号码
  inputPhone: function (e) {
    this.setData({
      phone: e.detail.value
    });
  },

  // 选择性别
  selectGender: function (e) {
    this.setData({
      gender: e.detail.value
    });
  },

  // 保存设置
  saveSettings: function () {
    if (!this.data.username) {
      wx.showToast({
        title: '请输入用户名',
        icon: 'none'
      });
      return;
    }

    if (!this.data.phone) {
      wx.showToast({
        title: '请输入电话号码',
        icon: 'none'
      });
      return;
    }

    if (!this.data.gender) {
      wx.showToast({
        title: '请选择性别',
        icon: 'none'
      });
      return;
    }

    const app = getApp();
    const updatedUserInfo = {
      ...app.globalData.userInfo,
      nickName: this.data.username,
      phone: this.data.phone,
      gender: this.data.gender,
      avatarUrl: this.data.gender === 'male' ? '../../images/1.png' : '../../images/2.png'
    };

    // 更新本地用户信息
    app.globalData.userInfo = updatedUserInfo;
    // 同时更新本地存储的用户信息
    wx.setStorageSync('userInfo', updatedUserInfo);

    // 发送请求更新服务器端用户信息
    app.request('/api/auth/update', 'PUT', {
      nickName: this.data.username,
      phone: this.data.phone,
      gender: this.data.gender
    }).then(() => {
      wx.showToast({
        title: '设置成功',
        icon: 'success'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    }).catch(err => {
      console.error('更新用户信息失败:', err);
      wx.showToast({
        title: '设置失败',
        icon: 'none'
      });
    });
  },

  // 返回上一页
  goBack: function () {
    wx.navigateBack();
  }
})
