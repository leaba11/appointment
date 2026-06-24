Page({
  data: {
    queue: {
      currentNumber: 0,
      yourNumber: null,
      yourStatus: null,
      estimatedWaitTime: 0
    },
    queueRecords: [],
    services: [],
    showServiceModal: false,
    selectedService: null,
    loading: true,
    lastQueueData: null, // 保存上一次的队列数据
    timers: {}, // 服务计时定时器
    refreshTimer: null // 数据刷新定时器
  },

  onLoad: function () {
    this.loadQueueInfo();
    this.loadServices();
  },

  onShow: function () {
    // 页面显示时重新加载队列信息，确保状态及时更新
    this.loadQueueInfo(true);
  },

  // 加载服务列表
  loadServices: function () {
    const app = getApp();

    app.request('/api/services').then(services => {
      this.setData({ services: services || [] });
    }).catch(err => {
      console.error('获取服务列表失败:', err);
      this.setData({ services: [] });
    });
  },

  // 加载队列信息
  loadQueueInfo: function (forceRefresh = false) {
    const app = getApp();

    app.request('/api/queue').then(queue => {
      // queue已经是后端返回的数据对象
      // 获取当前用户ID用于标记自己的记录
      const userInfo = wx.getStorageSync('userInfo');
      const myUserId = userInfo ? userInfo.id : null;
      
      // 处理排队记录，标记当前用户的记录，并转换状态为英文类名，只显示当前日期的记录
      // 使用本地时间获取今天的日期字符串
      const now = new Date();
      const todayYear = now.getFullYear();
      const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
      const todayDay = String(now.getDate()).padStart(2, '0');
      const today = `${todayYear}-${todayMonth}-${todayDay}`;
      const queueRecords = (queue.queueList || []).filter(record => {
        // 只保留等待中和美发中的记录，只保留当前日期的记录
        const recordDate = record.created_at ? record.created_at.split('T')[0] : today;
        return (record.status === 'waiting' || record.status === 'called' || record.status === 'servicing') && recordDate === today;
      }).map(record => ({
        ...record,
        isMe: record.user_id === myUserId,
        statusClass: record.status === 'waiting' ? 'waiting' : (record.status === 'called' || record.status === 'servicing' ? 'called' : record.status)
      }));
      
      // 检测数据是否发生变化
      const currentData = JSON.stringify({
        currentNumber: queue.currentNumber || 0,
        yourNumber: queue.yourNumber || null,
        yourStatus: queue.yourStatus || null,
        estimatedWaitTime: queue.estimatedWaitTime || 0,
        queueList: queue.queueList || []
      });
      
      const lastData = this.data.lastQueueData;
      
      // 只有当数据发生变化或强制刷新时才更新页面
      if (forceRefresh || currentData !== lastData) {
        // 清除之前的定时器
        Object.values(this.data.timers).forEach(timer => clearInterval(timer));
        this.setData({ timers: {} });
        
        this.setData({
          queue: {
            currentNumber: queue.currentNumber || 0,
            yourNumber: queue.yourNumber || null,
            yourStatus: queue.yourStatus || null,
            estimatedWaitTime: queue.estimatedWaitTime || 0,
            queueList: queue.queueList || []
          },
          queueRecords: queueRecords,
          loading: false,
          lastQueueData: currentData
        });
        
        // 为每个美发中的记录启动计时
        queueRecords.forEach(record => {
          if ((record.status === 'called' || record.status === 'servicing') && record.serviceDuration) {
            this.startTimer(record);
          }
        });
        
        console.log('队列数据发生变化，已更新页面');
      } else {
        this.setData({ loading: false });
        console.log('队列数据无变化，未更新页面');
      }
    }).catch(err => {
      console.error('获取队列信息失败:', err);
      this.setData({
        loading: false,
        queue: {
          currentNumber: 0,
          yourNumber: null,
          yourStatus: null,
          estimatedWaitTime: 0,
          queueList: []
        },
        queueRecords: []
      });
    });
  },

  // 检查是否在工作时间内
  isWorkingHours: function () {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // 工作时间：9:00 -- 23:30
    const startHour = 9;
    const startMinute = 0;
    const endHour = 23;
    const endMinute = 30;
    
    const currentTime = hour * 60 + minute;
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    return currentTime >= startTime && currentTime <= endTime;
  },

  // 点击取号按钮
  getQueueNumber: function () {
    const app = getApp();

    // 检查是否登录
    if (!app.checkAuth()) {
      return;
    }

    // 检查是否在工作时间内
    if (!this.isWorkingHours()) {
      wx.showToast({
        title: '非工作时间不可排队',
        icon: 'none'
      });
      return;
    }

    // 显示服务选择弹窗
    this.setData({
      showServiceModal: true,
      selectedService: null
    });
  },

  // 关闭服务选择弹窗
  closeServiceModal: function () {
    this.setData({
      showServiceModal: false,
      selectedService: null
    });
  },

  // 选择服务
  selectService: function (e) {
    const { id, name, price, duration } = e.currentTarget.dataset;
    this.setData({
      selectedService: { id, name, price, duration }
    });
  },

  // 确认选择服务并取号
  confirmService: function () {
    const app = getApp();
    const { selectedService } = this.data;

    if (!selectedService) {
      wx.showToast({
        title: '请选择服务项目',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '取号中...' });

    // 调用取号API，传递服务ID
    app.request('/api/queue/take-number', 'POST', { serviceId: selectedService.id }).then(result => {
      wx.hideLoading();

      // result已经是后端返回的数据对象

      // 关闭弹窗
      this.setData({
        showServiceModal: false,
        selectedService: null
      });

      if (result.yourNumber) {
        wx.showToast({
          title: '取号成功',
          icon: 'success'
        });

        // 重新加载队列信息
        this.loadQueueInfo();
      } else {
        wx.showToast({
          title: '取号失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('取号失败:', err);
      wx.showToast({
        title: err.message || '取号失败，请稍后重试',
        icon: 'none'
      });
    });
  },

  // 取消排队
  cancelQueue: function () {
    const app = getApp();

    wx.showModal({
      title: '取消排队',
      content: '确定要取消排队吗？',
      success: (res) => {
        if (res.confirm) {
          app.request('/api/queue/cancel', 'POST').then(() => {
            wx.showToast({ title: '取消排队成功', icon: 'success' });
            this.loadQueueInfo();
          }).catch(err => {
            console.error('取消排队失败:', err);
            wx.showToast({ title: '取消排队失败，请稍后重试', icon: 'none' });
          });
        }
      }
    });
  },

  // 刷号（过号）
  skipUser: function (e) {
    const recordId = e.currentTarget.dataset.id;
    const app = getApp();

    wx.showModal({
      title: '刷号',
      content: '确定要将该用户标记为过号吗？',
      success: (res) => {
        if (res.confirm) {
          app.request('/api/queue/update-status', 'POST', { recordId, status: 'skipped' }).then(() => {
            wx.showToast({ title: '刷号成功', icon: 'success' });
            this.loadQueueInfo();
          }).catch(err => {
            console.error('刷号失败:', err);
            wx.showToast({ title: '刷号失败，请稍后重试', icon: 'none' });
          });
        }
      }
    });
  },

  // 完成服务
  completeService: function (e) {
    const recordId = e.currentTarget.dataset.id;
    const app = getApp();

    wx.showModal({
      title: '完成服务',
      content: '确定要将该用户标记为服务完成吗？',
      success: (res) => {
        if (res.confirm) {
          app.request('/api/queue/complete-service', 'POST', { recordId }).then(() => {
            wx.showToast({ title: '服务完成成功', icon: 'success' });
            this.loadQueueInfo();
          }).catch(err => {
            console.error('完成服务失败:', err);
            wx.showToast({ title: '完成服务失败，请稍后重试', icon: 'none' });
          });
        }
      }
    });
  },

  // 开始计时
  startTimer: function (record) {
    if ((record.status === 'called' || record.status === 'servicing') && record.serviceDuration) {
      const startTime = record.called_at ? new Date(record.called_at).getTime() : Date.now();
      const duration = record.serviceDuration * 60 * 1000; // 转换为毫秒
      
      const timer = setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTime;
        const remaining = Math.max(0, Math.floor((duration - elapsed) / (60 * 1000)));
        
        // 更新剩余时间
        this.setData({
          queueRecords: this.data.queueRecords.map(item => {
            if (item.id === record.id) {
              return { ...item, remainingTime: remaining };
            }
            return item;
          })
        });
        
        // 如果时间到了，自动完成服务
        if (remaining === 0) {
          clearInterval(timer);
          this.completeService({ currentTarget: { dataset: { id: record.id } } });
        }
      }, 1000);
      
      // 保存定时器
      this.setData({
        timers: { ...this.data.timers, [record.id]: timer }
      });
    }
  }

})