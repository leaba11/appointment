Page({
  data: {
    service: {},
    staff: {},
    date: '',
    time: '',
    name: '',
    phone: '',
    gender: '',
    remark: '',
    loading: false
  },

  onLoad: function (options) {
    const { serviceId, staffId, date, time } = options
    this.loadData(serviceId, staffId, date, time);
  },

  onShow: function () {
    // 每次页面显示时，尝试从用户信息中获取姓名和电话
    this.loadUserInfo();
  },

  // 加载数据
  loadData: function (serviceId, staffId, date, time) {
    const app = getApp();
    
    // 获取服务信息
    app.request('/api/services/' + serviceId).then(service => {
      this.setData({ service });
    }).catch(err => {
      console.error('获取服务信息失败:', err);
    });
    
    // 获取员工信息
    app.request('/api/staff').then(staffList => {
      const staff = staffList.find(s => s.id == staffId);
      this.setData({ staff });
    }).catch(err => {
      console.error('获取员工信息失败:', err);
    });
    
    this.setData({
      date: date,
      time: time
    });
    
    // 加载用户信息
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo: function () {
    const app = getApp();
    if (app.globalData.userInfo) {
      this.setData({
        name: app.globalData.userInfo.nickName || '',
        phone: app.globalData.userInfo.phone || '',
        gender: app.globalData.userInfo.gender || ''
      });
    }
  },

  inputRemark: function (e) {
    this.setData({ remark: e.detail.value })
  },

  formatDate: function (dateString) {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}年${month}月${day}日`
  },

  submitAppointment: function () {
    const { service, staff, date, time, name, phone, gender, remark } = this.data
    const app = getApp()
    
    if (!name || !phone) {
      wx.showModal({
        title: '提示',
        content: '请先填写个人信息',
        confirmText: '去设置',
        cancelText: '取消',
        success: function (res) {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/user-setting/user-setting'
            });
          }
        }
      });
      return;
    }
    
    this.setData({ loading: true });
    
    // 发送预约请求
    app.request('/api/appointments', 'POST', {
      serviceId: service.id,
      staffId: staff.id,
      date: date,
      time: time,
      name: name,
      phone: phone,
      gender: gender,
      remark: remark
    }).then(appointment => {
      // 显示预约成功提示
      wx.showToast({
        title: '预约成功',
        icon: 'success',
        duration: 2000
      });
      
      // 跳转到个人中心
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/profile/profile'
        });
      }, 2000);
    }).catch(err => {
      console.error('预约失败:', err);
      wx.showToast({
        title: '预约失败',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  }
})
