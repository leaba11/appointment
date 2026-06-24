Page({
  data: {
    appointment: {},
    loading: true,
    lastAppointmentData: null // 保存上一次的预约数据
  },

  onLoad: function (options) {
    const appointmentId = options.id
    this.loadAppointmentDetail(appointmentId);
  },

  // 加载预约详情
  loadAppointmentDetail: function (appointmentId, forceRefresh = false) {
    const app = getApp();
    
    app.request('/api/appointments/' + appointmentId).then(appointment => {
      console.log('获取到预约详情:', appointment);
      this.setData({ 
        appointment, 
        loading: false
      });
    }).catch(err => {
      console.error('获取预约详情失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '获取预约详情失败',
        icon: 'none'
      });
    });
  },

  formatDate: function (dateString) {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}年${month}月${day}日`
  },

  getStatusText: function (status) {
    switch (status) {
      case 'pending':
        return '待确认'
      case 'confirmed':
        return '已确认'
      case 'completed':
        return '已完成'
      case 'cancelled':
        return '已取消'
      default:
        return ''
    }
  },

  getStatusClass: function (status) {
    switch (status) {
      case 'pending':
        return 'status-pending'
      case 'confirmed':
        return 'status-confirmed'
      case 'completed':
        return 'status-completed'
      case 'cancelled':
        return 'status-cancelled'
      default:
        return ''
    }
  },

  cancelAppointment: function () {
    const appointmentId = this.data.appointment.id
    const app = getApp()
    
    wx.showModal({
      title: '取消预约',
      content: '确定要取消这个预约吗？',
      success: (res) => {
        if (res.confirm) {
          // 发送取消预约请求
          app.request('/api/appointments/' + appointmentId + '/cancel', 'POST').then(() => {
            // 重新加载预约详情
            this.loadAppointmentDetail(appointmentId, true);
            
            // 显示取消成功提示
            wx.showToast({
              title: '预约已取消',
              icon: 'success'
            });
          }).catch(err => {
            console.error('取消预约失败:', err);
            wx.showToast({
              title: '取消预约失败',
              icon: 'none'
            });
          });
        }
      }
    });
  },

  // 返回上一页
  goBack: function () {
    wx.navigateBack();
  }
})
