const authService = require('../../utils/auth-service');

Page({
  data: {
    service: null,
    staffList: [],
    selectedStaff: null,
    selectedDate: '',
    selectedTime: '',
    dateOptions: [],
    timeOptions: [],
    loading: true,
    showDatePicker: false,
    showTimePicker: false
  },

  onLoad: function (options) {
    const serviceId = options.id;
    this.loadServiceDetail(serviceId);
    this.generateDateOptions();
  },

  loadServiceDetail: function (serviceId) {
    const app = getApp();
    // 先检查登录状态
    if (!app.checkAuth()) {
      this.setData({ loading: false });
      return;
    }
    
    // 获取服务详情
    app.request(`/api/services/${serviceId}`).then(service => {
      this.setData({ service });
    }).catch(err => {
      console.error('获取服务详情失败:', err);
      wx.showToast({ title: '获取服务详情失败', icon: 'none' });
    });
    
    // 获取员工列表
    app.request('/api/staff').then(staffList => {
      // 按评分从高到低排序
      const sortedStaffList = staffList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      this.setData({ 
        staffList: sortedStaffList,
        selectedStaff: sortedStaffList[0] || null,
        loading: false 
      });
    }).catch(err => {
      console.error('获取员工列表失败:', err);
      this.setData({ loading: false });
    });
  },

  // 生成日期选项（未来7天）
  generateDateOptions: function () {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // 使用本地时间而不是 UTC 时间
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      const displayDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
      options.push({ value: dateString, label: displayDate });
    }
    this.setData({ 
      dateOptions: options,
      selectedDate: options[0].value,
      selectedDateIndex: 0
    });
    this.generateTimeOptions();
  },

  // 生成时间选项（9:00-23:30）
  generateTimeOptions: function () {
    const options = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const selectedDate = this.data.selectedDate;
    
    // 使用本地时间获取今天的日期字符串
    const todayYear = now.getFullYear();
    const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
    const todayDay = String(now.getDate()).padStart(2, '0');
    const today = `${todayYear}-${todayMonth}-${todayDay}`;
    
    const isToday = selectedDate === today;
    
    for (let hour = 9; hour <= 23; hour++) {
      // 对于今天的预约，跳过当前时间之前的时间
      if (isToday) {
        if (hour < currentHour) continue;
        if (hour === currentHour) {
          // 如果是当前小时，跳过已经过去的时间段
          // 当前时间在0-29分钟之间，显示当前小时的30分
          // 当前时间在30-59分钟之间，跳过当前小时
          if (currentMinute < 30) {
            options.push({ value: `${hour}:30`, label: `${hour}:30` });
          }
          // 继续循环，显示后续小时
          continue;
        }
      }
      options.push({ value: `${hour}:00`, label: `${hour}:00` });
      if (hour < 23) {
        options.push({ value: `${hour}:30`, label: `${hour}:30` });
      }
    }
    this.setData({ 
      timeOptions: options,
      selectedTime: options[0] ? options[0].value : '',
      selectedTimeIndex: 0
    });
  },

  // 选择员工
  selectStaff: function (e) {
    const staffId = e.currentTarget.dataset.id;
    const selectedStaff = this.data.staffList.find(staff => staff.id == staffId);
    this.setData({ selectedStaff });
  },

  // 选择日期
  selectDate: function (e) {
    const index = e.detail.value;
    const selectedDate = this.data.dateOptions[index].value;
    this.setData({ 
      selectedDateIndex: index,
      selectedDate: selectedDate 
    });
    // 重新生成时间选项
    this.generateTimeOptions();
  },

  // 选择时间
  selectTime: function (e) {
    const index = e.detail.value;
    const selectedTime = this.data.timeOptions[index].value;
    this.setData({ 
      selectedTimeIndex: index,
      selectedTime: selectedTime 
    });
  },

  // 预约
  makeAppointment: function () {
    const { service, selectedStaff, selectedDate, selectedTime } = this.data;
    const app = getApp();
    
    if (!service || !selectedStaff || !selectedDate || !selectedTime) {
      wx.showToast({ title: '请选择完整的预约信息', icon: 'none' });
      return;
    }
    
    // 检查用户信息
    if (!app.globalData.userInfo || !app.globalData.userInfo.nickName || !app.globalData.userInfo.phone) {
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
    
    // 直接提交预约
    this.setData({ loading: true });
    
    const userInfo = app.globalData.userInfo;
    app.request('/api/appointments', 'POST', {
      serviceId: service.id,
      staffId: selectedStaff.id,
      date: selectedDate,
      time: selectedTime,
      name: userInfo.nickName,
      phone: userInfo.phone,
      gender: userInfo.gender || '',
      remark: ''
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
  },

  goBack: function () {
    wx.navigateBack();
  }
});