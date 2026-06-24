const authService = require('../../utils/auth-service');

Page({
  data: {
    userInfo: null,
    appointments: [],
    normalAppointments: [],
    completedAppointments: [],
    cancelledAppointments: [],
    activeModule: 'normal',
    displayAppointments: [],
    currentPage: 1,
    totalPages: 1,
    pageSize: 4,
    showLoginModal: false,
    lastAppointmentsData: null,
    merchantPhone: '19316653102',
    merchantName: '雾泉高级美发',
    merchantAddress: '贵阳市花溪区大学城',

    // 评分相关
    showRatingModal: false,
    ratingData: {
      appointmentId: '',
      staffId: '',
      staffName: '',
      serviceName: '',
      serviceAttitude: 0,
      technicalSkill: 0,
      communication: 0,
      totalRating: 0,
      fullStars: 0,
      comment: ''
    },

    // 电话咨询相关
    showPhoneModal: false,
    showPhoneOptions: false,

    // 地址相关
    showAddressModal: false
  },

  onLoad: function () {
    // 检查登录状态
    this.checkLoginStatus();
    // 加载数据
    this.loadData();
  },

  onShow: function () {
    // 每次页面显示时检查登录状态并重新加载数据
    this.checkLoginStatus();
    this.loadData();
  },

  // 检查登录状态
  checkLoginStatus: function() {
    const isLoggedIn = authService.checkLoginStatus();
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({
      userInfo: userInfo
    });
    
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

  // 加载数据
  loadData: function () {
    const isLoggedIn = authService.checkLoginStatus();
    if (isLoggedIn) {
      this.loadAppointments();
    }
  },

  // 加载预约列表
  loadAppointments: function (forceRefresh = false) {
    const app = getApp();
    console.log('开始获取预约列表');
    
    // 先获取预约列表
    app.request('/api/appointments', 'GET').then(appointmentsData => {
      console.log('获取到预约列表:', appointmentsData);
      console.log('预约列表数据详情:', JSON.stringify(appointmentsData, null, 2));
      
      // 获取评分列表
      app.request('/api/staff/ratings/list', 'GET').then(ratingsData => {
        console.log('获取到评分列表:', ratingsData);
        this.processAppointments(appointmentsData, ratingsData);
      }).catch(err => {
        console.log('获取评分列表失败，继续显示预约:', err);
        this.processAppointments(appointmentsData, []);
      });
    }).catch(err => {
      console.error('获取预约列表失败:', err);
      if (err.message === '登录已过期，请重新登录') {
        this.setData({ showLoginModal: true });
      }
    });
  },
  
  // 处理预约数据
  processAppointments: function(appointmentsData, ratingsData) {
    console.log('开始处理预约数据');
    console.log('预约数据:', appointmentsData);
    console.log('评分数据:', ratingsData);
    
    // 检查预约数据结构
    let appointmentsList = [];
    if (appointmentsData && appointmentsData.data) {
      appointmentsList = appointmentsData.data;
      console.log('从 data 字段获取预约列表:', appointmentsList);
    } else if (Array.isArray(appointmentsData)) {
      appointmentsList = appointmentsData;
      console.log('直接使用数组作为预约列表:', appointmentsList);
    }
    
    // 打印每个预约的详细信息
    appointmentsList.forEach((app, index) => {
      console.log(`预约 ${index + 1}:`, JSON.stringify(app, null, 2));
      console.log(`  日期类型: ${typeof app.date}, 值: ${app.date}`);
    });
    
    // 收集已评分的预约ID
    const ratedAppointmentIds = new Set();
    const ratings = ratingsData || [];
    ratings.forEach(r => {
      const id = r.appointmentId || r.appointment_id;
      if (id) {
        ratedAppointmentIds.add(String(id));
      }
    });
    console.log('已评分的预约ID:', Array.from(ratedAppointmentIds));
    
    const appointments = appointmentsList.map(appointment => {
      const appointmentId = String(appointment.id);
      const hasRated = ratedAppointmentIds.has(appointmentId);
      const ratingData = hasRated ? ratings.find(r => String(r.appointmentId || r.appointment_id) === appointmentId) : null;
      
      // 确保日期格式正确
      let processedDate = appointment.date;
      if (processedDate && typeof processedDate === 'string' && processedDate.includes('T')) {
        processedDate = processedDate.split('T')[0];
      }
      console.log(`处理预约 ${appointmentId}: 原始日期=${appointment.date}, 处理后日期=${processedDate}`);
      
      return {
        ...appointment,
        date: processedDate,
        hasRated: hasRated,
        rating: ratingData?.totalRating || ratingData?.total_rating || 0
      };
    });
    
    // 分类预约记录
    const normalAppointments = appointments.filter(appointment => {
      return appointment.status === '待确认' || appointment.status === '等待中';
    });
    
    const completedAppointments = appointments.filter(appointment => {
      return appointment.status === '已完成';
    });
    
    const cancelledAppointments = appointments.filter(appointment => {
      return appointment.status === '已取消';
    });
    
    console.log('分类后的预约记录:', {
      normalAppointments,
      completedAppointments,
      cancelledAppointments
    });
    
    // 更新数据
    this.setData({
      appointments: appointments,
      normalAppointments: normalAppointments,
      completedAppointments: completedAppointments,
      cancelledAppointments: cancelledAppointments
    });
    
    console.log('设置到页面的数据:', {
      normalAppointments: this.data.normalAppointments,
      completedAppointments: this.data.completedAppointments,
      cancelledAppointments: this.data.cancelledAppointments
    });
    
    // 自动切换到第一个有数据的模块
    let newActiveModule = 'normal';
    if (normalAppointments.length === 0 && completedAppointments.length > 0) {
      newActiveModule = 'completed';
    } else if (normalAppointments.length === 0 && completedAppointments.length === 0 && cancelledAppointments.length > 0) {
      newActiveModule = 'cancelled';
    }
    
    if (newActiveModule !== this.data.activeModule) {
      console.log('自动切换模块到:', newActiveModule);
      this.setData({ activeModule: newActiveModule });
    }
    
    // 更新显示的预约记录
    this.updateDisplayAppointments();
    
    console.log('预约数据已更新');
  },
  
  // 切换模块
  switchModule: function (e) {
    const module = e.currentTarget.dataset.module;
    this.setData({
      activeModule: module,
      currentPage: 1 // 切换模块时重置页码为1
    });
    this.updateDisplayAppointments();
  },

  // 更新显示的预约记录
  updateDisplayAppointments: function () {
    const { activeModule, currentPage, pageSize, normalAppointments, completedAppointments, cancelledAppointments } = this.data;
    
    // 根据当前激活的模块获取对应的预约记录
    let appointments;
    switch (activeModule) {
      case 'normal':
        appointments = normalAppointments;
        break;
      case 'completed':
        appointments = completedAppointments;
        break;
      case 'cancelled':
        appointments = cancelledAppointments;
        break;
      default:
        appointments = normalAppointments;
    }
    
    // 计算总页数
    const totalPages = Math.ceil(appointments.length / pageSize);
    
    // 计算当前页的起始和结束索引
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const displayAppointments = appointments.slice(startIndex, endIndex);
    
    this.setData({
      displayAppointments: displayAppointments,
      totalPages: totalPages
    });
  },
  
  // 切换页码
  changePage: function (e) {
    const page = parseInt(e.currentTarget.dataset.page);
    this.setData({ currentPage: page });
    this.updateDisplayAppointments();
  },



  // 跳转到用户设置
  goToUserSetting: function () {
    wx.navigateTo({ url: '/pages/user-setting/user-setting' });
  },

  // 跳转到关于我们
  goToAbout: function () {
    wx.navigateTo({ url: '/pages/about/about' });
  },

  // 跳转到设置
  goToSettings: function () {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

  // 跳转到预约详情
  goToAppointmentDetail: function (e) {
    const appointmentId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/appointment-detail/appointment-detail?id=${appointmentId}` });
  },

  // 取消预约
  cancelAppointment: function (e) {
    const appointmentId = e.currentTarget.dataset.id;
    const app = getApp();
    
    wx.showModal({
      title: '取消预约',
      content: '确定要取消这个预约吗？',
      success: (res) => {
        if (res.confirm) {
          app.request(`/api/appointments/${appointmentId}/cancel`, 'POST').then(() => {
            wx.showToast({ title: '取消成功', icon: 'success' });
            this.loadAppointments();
          }).catch(err => {
            console.error('取消预约失败:', err);
            wx.showToast({ title: '取消失败，请稍后重试', icon: 'none' });
          });
        }
      }
    });
  },

  // 显示登录弹窗
  showLoginModal: function () {
    this.setData({ showLoginModal: true });
  },

  // 关闭登录弹窗
  onCloseLoginModal: function () {
    this.setData({ showLoginModal: false });
  },



  // 登录成功回调
  onLoginSuccess: function () {
    this.setData({ showLoginModal: false });
    this.checkLoginStatus();
    this.loadData();
  },

  // 打开评分弹窗
  openRatingModal: function(e) {
    const { id, staffId, staffName, serviceName } = e.currentTarget.dataset;
    this.setData({
      showRatingModal: true,
      ratingData: {
        appointmentId: id,
        staffId: staffId,
        staffName: staffName,
        serviceName: serviceName,
        serviceAttitude: 0,
        technicalSkill: 0,
        communication: 0,
        totalRating: 0,
        fullStars: 0,
        comment: ''
      }
    });
  },

  // 关闭评分弹窗
  closeRatingModal: function() {
    this.setData({ showRatingModal: false });
  },

  // 设置评分（加权评分：服务态度40%、技术水平40%、沟通能力20%）
  setRating: function(e) {
    const { type, value } = e.currentTarget.dataset;
    const ratingData = { ...this.data.ratingData };
    const ratingValue = parseInt(value, 10);
    ratingData[type] = ratingValue;
    
    // 加权评分计算
    // 服务态度权重40%，技术水平权重40%，沟通能力权重20%
    const rawRating = 
      ratingData.serviceAttitude * 0.4 + 
      ratingData.technicalSkill * 0.4 + 
      ratingData.communication * 0.2;
    // 保留最多两位小数
    ratingData.totalRating = Math.round(rawRating * 100) / 100;
    // 用于星星显示的整星数量
    ratingData.fullStars = Math.floor(ratingData.totalRating);
    
    this.setData({ ratingData });
  },

  // 评论输入
  onCommentInput: function(e) {
    const ratingData = { ...this.data.ratingData };
    ratingData.comment = e.detail.value;
    this.setData({ ratingData });
  },

  // 提交评分
  submitRating: function() {
    const { ratingData } = this.data;
    
    // 校验措施：范围检查 - 确保所有指标都已评分
    if (ratingData.serviceAttitude === 0 || ratingData.technicalSkill === 0 || ratingData.communication === 0) {
      wx.showToast({ title: '请完成所有指标的评分', icon: 'none' });
      return;
    }
    
    // 校验措施：范围检查 - 确保评分在合理范围内（1-5）
    if (ratingData.serviceAttitude < 1 || ratingData.serviceAttitude > 5 ||
        ratingData.technicalSkill < 1 || ratingData.technicalSkill > 5 ||
        ratingData.communication < 1 || ratingData.communication > 5) {
      wx.showToast({ title: '评分必须在1-5之间', icon: 'none' });
      return;
    }
    
    // 显示加载中
    wx.showLoading({ title: '提交中...' });
    
    // 调用API提交评分
    const app = getApp();
    app.request('/api/staff/rating', 'POST', {
      staffId: ratingData.staffId,
      appointmentId: ratingData.appointmentId,
      serviceAttitude: ratingData.serviceAttitude,
      technicalSkill: ratingData.technicalSkill,
      communication: ratingData.communication,
      totalRating: ratingData.totalRating,
      comment: ratingData.comment
    }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '评分成功', icon: 'success' });
      this.closeRatingModal();
      this.loadAppointments(true);
    }).catch(err => {
      wx.hideLoading();
      console.error('提交评分失败:', err);
      wx.showToast({ title: err.message || '评分失败，请稍后重试', icon: 'none' });
    });
  },

  // 显示电话咨询弹窗
  showPhoneModal: function() {
    this.setData({ showPhoneModal: true });
  },

  // 关闭电话咨询弹窗
  closePhoneModal: function() {
    this.setData({ showPhoneModal: false });
  },

  // 显示电话操作选项
  showPhoneOptions: function() {
    this.setData({ showPhoneOptions: true });
  },

  // 关闭电话操作选项
  closePhoneOptions: function() {
    this.setData({ showPhoneOptions: false });
  },

  // 拨打电话
  makePhoneCall: function() {
    const { merchantPhone } = this.data;
    wx.makePhoneCall({
      phoneNumber: merchantPhone,
      success: () => {
        this.closePhoneOptions();
        this.closePhoneModal();
      },
      fail: (err) => {
        console.error('拨打电话失败:', err);
        wx.showToast({ title: '拨打电话失败', icon: 'none' });
        this.closePhoneOptions();
      }
    });
  },

  // 复制号码
  copyPhoneNumber: function() {
    const { merchantPhone } = this.data;
    wx.setClipboardData({
      data: merchantPhone,
      success: () => {
        wx.showToast({ title: '复制成功', icon: 'success' });
        this.closePhoneOptions();
      },
      fail: (err) => {
        console.error('复制失败:', err);
        wx.showToast({ title: '复制失败', icon: 'none' });
        this.closePhoneOptions();
      }
    });
  },

  // 显示地址弹窗
  showAddressModal: function() {
    this.setData({ showAddressModal: true });
  },

  // 关闭地址弹窗
  closeAddressModal: function() {
    this.setData({ showAddressModal: false });
  },

  // 复制地址
  copyAddress: function() {
    const { merchantName, merchantAddress, merchantPhone } = this.data;
    const addressText = `${merchantName}\n地址: ${merchantAddress}\n电话: ${merchantPhone}`;
    wx.setClipboardData({
      data: addressText,
      success: () => {
        wx.showToast({ title: '复制成功', icon: 'success' });
      },
      fail: (err) => {
        console.error('复制失败:', err);
        wx.showToast({ title: '复制失败', icon: 'none' });
      }
    });
  },

  // 打开地图
  openMap: function() {
    const { merchantAddress } = this.data;
    wx.openLocation({
      address: merchantAddress,
      name: '雾泉高级美发',
      scale: 18,
      success: () => {
        this.closeAddressModal();
      },
      fail: (err) => {
        console.error('打开地图失败:', err);
        wx.showToast({ title: '打开地图失败', icon: 'none' });
      }
    });
  }
});
