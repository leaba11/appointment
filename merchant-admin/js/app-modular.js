// 模块化的 Vue 应用文件
// 这个文件使用了我们创建的模块化代码库

console.log('模块化 Vue 应用启动中...');

// 创建 Vue 应用
const app = Vue.createApp({
  data() {
    return {
      // 登录状态
      isLoggedIn: false,
      currentUser: '',
      adminToken: null,
      
      // 登录表单
      loginForm: {
        username: '',
        password: ''
      },
      
      // 当前菜单
      currentMenu: 'dashboard',
      
      // 数据
      services: [],
      staffList: [],
      appointments: [],
      queue: { currentNumber: 1, queueList: [] },
      queueList: [],
      customers: [],
      stats: {
        totalAppointments: 0,
        currentQueue: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        yearlyRevenue: 0
      },
      revenueRecords: [],
      merchantInfo: {},
      
      // 详细数据面板
      showDetailPanel: false,
      detailType: '',
      detailTitle: '',
      
      // 图表实例
      charts: {},
      
      // 模态框
      showServiceModal: false,
      showStaffModal: false,
      showCustomerModal: false,
      
      // 客户搜索和筛选
      customerSearch: '',
      genderFilter: 'all',
      dateFilter: '',
      filteredCustomers: [],
      
      // 评价搜索和筛选
      ratingsList: [],
      ratingSearch: '',
      ratingStaffFilter: '',
      ratingStartDate: '',
      ratingEndDate: '',
      expandedRatings: [],
      
      // 客户展开状态
      expandedCustomers: [],
      
      // 预约看板展开状态
      expandedDays: [],
      
      // 编辑数据
      editingService: null,
      editingStaff: null,
      selectedCustomer: {},
      
      // 表单数据
      serviceForm: {
        name: '',
        price: '',
        duration: '',
        description: ''
      },
      staffForm: {
        name: '',
        avatar: '',
        specialty: '',
        rating: ''
      },
      merchantForm: {
        name: '',
        address: '',
        phone: '',
        description: ''
      },
      
      // 日历
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      calendarDays: [],
      
      // 加载状态
      loading: false,
      
      // 排队数据刷新定时器
      queueRefreshTimer: null
    };
  },
  
  mounted() {
    console.log('Vue 应用挂载完成');
    
    // 立即锁定所有弹窗状态，防止刷新时闪烁
    this.showDetailPanel = false;
    this.showServiceModal = false;
    this.showStaffModal = false;
    this.showCustomerModal = false;
    
    // 初始化日期检查，确保新的一天排队号码重置为 1
    const today = new Date().toDateString();
    const lastQueueDate = localStorage.getItem('lastQueueDate');
    if (lastQueueDate !== today) {
      localStorage.setItem('lastQueueDate', today);
    }
    
    // 检查是否已登录
    this.checkLoginStatus();
  },
  
  beforeUnmount() {
    // 清理定时器
    if (this.queueRefreshTimer) {
      clearInterval(this.queueRefreshTimer);
    }
  },
  
  watch: {
    currentMenu(newMenu, oldMenu) {
      if (newMenu === 'dashboard') {
        // 当切换到仪表盘页面时，重新初始化图表并获取数据
        setTimeout(() => {
          this.initCharts();
          setTimeout(() => {
            this.fetchAppointmentDistribution();
          }, 300);
        }, 100);
      }
      if (newMenu === 'ratings') {
        // 当切换到评价管理页面时，加载评价数据
        this.loadRatings();
      }
      if (newMenu === 'queue') {
        // 当切换到排队墙页面时，加载排队数据并启动定时刷新
        this.loadQueue();
        this.startQueueRefresh();
      } else {
        // 离开排队墙页面时，停止定时刷新
        this.stopQueueRefresh();
      }
      if (newMenu === 'merchant') {
        // 当切换到商户设置页面时，加载商户信息
        this.loadMerchant();
      }
    }
  },
  
  methods: {
    // ===== 认证相关方法 =====
    checkLoginStatus() {
      const token = localStorage.getItem('adminToken');
      if (token) {
        this.adminToken = token;
        this.isLoggedIn = true;
        this.currentUser = localStorage.getItem('adminUsername') || '管理员';
        // 使用 setTimeout 延迟加载数据，确保视图已完全渲染
        setTimeout(() => {
          this.loadAllData();
        }, 0);
      } else {
        // 未登录状态，显示登录表单
        this.isLoggedIn = false;
      }
    },
    
    async login() {
      try {
        const result = await window.MerchantAdmin.API.auth.login(this.loginForm);
        
        this.adminToken = result.data.token;
        this.isLoggedIn = true;
        this.currentUser = result.data.admin.username;
        
        // 保存登录状态
        localStorage.setItem('adminToken', result.data.token);
        localStorage.setItem('adminUsername', result.data.admin.username);
        
        // 加载数据
        await this.loadAllData();
        
      } catch (error) {
        alert('登录失败: ' + error.message);
      }
    },
    
    logout() {
      this.isLoggedIn = false;
      this.currentUser = '';
      this.adminToken = null;
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUsername');
    },
    
    // ===== 通用请求方法（保留兼容性）=====
    async request(url, method = 'GET', data = null) {
      return await window.MerchantAdmin.API.request(url, method, data, this.adminToken);
    },
    
    // ===== 工具方法 =====
    formatDate(dateStr) {
      return window.MerchantAdmin.Utils.formatDate(dateStr);
    },
    
    formatDateTime(dateStr) {
      return window.MerchantAdmin.Utils.formatDateTime(dateStr);
    },
    
    formatAmount(amount) {
      return window.MerchantAdmin.Utils.formatAmount(amount);
    },
    
    formatStatus(status) {
      return window.MerchantAdmin.Utils.formatStatus(status);
    },
    
    getStatusClass(status) {
      return window.MerchantAdmin.Utils.getStatusClass(status);
    },

    getOrderStatusClass(status) {
      return window.MerchantAdmin.Utils.getStatusClass(status);
    },
    
    getGenderIcon(gender) {
      return window.MerchantAdmin.Utils.getGenderIcon(gender);
    },
    
    formatDateShort(dateStr) {
      return window.MerchantAdmin.Utils.formatDateShort(dateStr);
    },
    
    getMenuTitle(menu) {
      const titles = {
        'dashboard': '数据统计',
        'services': '服务项目管理',
        'staff': '员工管理',
        'appointments': '预约看板',
        'queue': '排队墙',
        'customers': '客户档案',
        'ratings': '评价管理',
        'merchant': '商户设置'
      };
      return titles[menu] || menu;
    },
    
    // ===== 数据加载方法 =====
    async loadAllData() {
      this.loading = true;
      try {
        // 确保所有弹窗在数据加载前都是关闭的
        this.showDetailPanel = false;
        this.showServiceModal = false;
        this.showStaffModal = false;
        this.showCustomerModal = false;
        
        await Promise.all([
          this.loadStats(),
          this.loadServices(),
          this.loadStaff(),
          this.loadAppointments(),
          this.loadQueue(),
          this.loadCustomers(),
          this.loadMerchant(),
          this.loadRevenue(),
          this.loadRatings()
        ]);
        
        // 使用 requestAnimationFrame 确保 DOM 已更新后再初始化图表
        requestAnimationFrame(() => {
          this.initCharts();
          // 延迟调用 API 获取预约时段分布数据，确保图表已创建
          setTimeout(() => {
            this.fetchAppointmentDistribution();
          }, 300);
        });
      } catch (error) {
        console.error('加载数据错误:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async loadStats() {
      try {
        const result = await window.MerchantAdmin.API.stats.getStats();
        const data = result.data;
        this.stats = {
          totalAppointments: data.totalAppointments || 0,
          currentQueue: data.currentQueue || 0,
          totalCustomers: data.totalCustomers || 0,
          totalRevenue: data.totalRevenue || 0,
          monthlyRevenue: data.monthlyRevenue || data.totalRevenue || 0,
          yearlyRevenue: data.yearlyRevenue || data.totalRevenue * 12 || 0
        };
      } catch (error) {
        console.error('加载统计数据错误:', error);
        // 使用模拟数据作为 fallback
        this.stats = {
          totalAppointments: 12,
          currentQueue: 8,
          totalCustomers: 56,
          totalRevenue: 1280,
          monthlyRevenue: 38400,
          yearlyRevenue: 460800
        };
      }
    },
    
    async loadRevenue() {
      try {
        console.log('开始加载营收数据...');
        const result = await window.MerchantAdmin.API.stats.getRevenue();
        this.revenueRecords = result.data || [];
        console.log('营收数据加载成功:', this.revenueRecords);
        console.log('营收记录数量:', this.revenueRecords.length);
      } catch (error) {
        console.error('加载营收记录错误:', error);
        this.revenueRecords = [];
      }
    },
    
    async loadServices() {
      try {
        const result = await window.MerchantAdmin.API.services.getAll();
        this.services = result.data;
      } catch (error) {
        console.error('加载服务列表错误:', error);
      }
    },
    
    async loadStaff() {
      try {
        const result = await window.MerchantAdmin.API.staff.getAll();
        this.staffList = result.data;
      } catch (error) {
        console.error('加载员工列表错误:', error);
      }
    },
    
    async loadAppointments() {
      try {
        const result = await window.MerchantAdmin.API.appointments.getAll();
        this.appointments = result.data;
        this.generateCalendar();
      } catch (error) {
        console.error('加载预约列表错误:', error);
      }
    },
    
    async loadQueue() {
      try {
        const result = await window.MerchantAdmin.API.queue.getQueue();
        this.queue = result.data;
        
        // 处理排队列表
        const now = new Date();
        const todayYear = now.getFullYear();
        const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
        const todayDay = String(now.getDate()).padStart(2, '0');
        const today = `${todayYear}-${todayMonth}-${todayDay}`;
        
        this.queueList = (result.data.queueList || []).map(record => ({
          ...record,
          statusClass: record.status === 'waiting' ? 'waiting' : 
                    (record.status === 'called' || record.status === 'servicing' ? 'called' : record.status),
          number: record.queue_number
        }));
      } catch (error) {
        console.error('加载队列信息错误:', error);
      }
    },
    
    // 启动排队数据定时刷新
    startQueueRefresh() {
      // 如果已有定时器，先清除
      this.stopQueueRefresh();
      
      // 每5秒刷新一次排队数据
      this.queueRefreshTimer = setInterval(() => {
        this.loadQueue();
      }, 5000);
      
      console.log('排队数据定时刷新已启动，每5秒刷新一次');
    },
    
    // 停止排队数据定时刷新
    stopQueueRefresh() {
      if (this.queueRefreshTimer) {
        clearInterval(this.queueRefreshTimer);
        this.queueRefreshTimer = null;
        console.log('排队数据定时刷新已停止');
      }
    },
    
    async loadCustomers() {
      try {
        console.log('开始加载客户列表...');
        const result = await window.MerchantAdmin.API.customers.getAll();
        const data = result.data;
        console.log('客户列表数据:', data);
        this.customers = data;
        // 初始化过滤后的客户列表
        this.filteredCustomers = this.customers || [];
        console.log('客户列表加载成功，共', this.customers?.length || 0, '个客户');
        console.log('filteredCustomers 长度:', this.filteredCustomers.length);
        console.log('filteredCustomers 内容:', this.filteredCustomers);
      } catch (error) {
        console.error('加载客户列表错误:', error);
        // 出错时使用空数组
        this.customers = [];
        this.filteredCustomers = [];
      }
    },
    
    async loadMerchant() {
      try {
        const result = await window.MerchantAdmin.API.merchant.getInfo();
        this.merchantInfo = result.data;
        // 同步到表单
        this.merchantForm = {
          name: result.data.name || '',
          address: result.data.address || '',
          phone: result.data.phone || '',
          description: result.data.description || ''
        };
      } catch (error) {
        console.error('加载商户信息错误:', error);
      }
    },
    
    // 重置商户表单
    resetMerchantForm() {
      if (this.merchantInfo) {
        this.merchantForm = {
          name: this.merchantInfo.name || '',
          address: this.merchantInfo.address || '',
          phone: this.merchantInfo.phone || '',
          description: this.merchantInfo.description || ''
        };
      }
    },
    
    // 保存商户信息
    async saveMerchantInfo() {
      try {
        const result = await window.MerchantAdmin.API.merchant.updateInfo(this.merchantForm);
        this.merchantInfo = result.data;
        alert('商户信息更新成功！');
      } catch (error) {
        console.error('更新商户信息错误:', error);
        alert('更新商户信息失败: ' + error.message);
      }
    },
    
    async loadRatings() {
      try {
        const params = {
          search: this.ratingSearch,
          staffId: this.ratingStaffFilter,
          startDate: this.ratingStartDate,
          endDate: this.ratingEndDate
        };
        const result = await window.MerchantAdmin.API.staff.getRatings(params);
        this.ratingsList = result.data || [];
      } catch (error) {
        console.error('加载评价列表错误:', error);
        this.ratingsList = [];
      }
    },
    
    // ===== 客户搜索和筛选 =====
    searchCustomers() {
      this.filterCustomers();
    },
    
    filterCustomers() {
      let filtered = this.customers || [];
      
      // 按关键词搜索
      if (this.customerSearch) {
        const searchTerm = this.customerSearch.toLowerCase();
        filtered = filtered.filter(customer => {
          // 搜索客户姓名
          if (customer.name.toLowerCase().includes(searchTerm)) {
            return true;
          }
          // 这里可以扩展搜索服务项目和理发师，需要从订单中获取
          return false;
        });
      }
      
      // 按性别筛选
      if (this.genderFilter !== 'all') {
        filtered = filtered.filter(customer => customer.gender === this.genderFilter);
      }
      
      // 按日期筛选
      if (this.dateFilter) {
        // 这里需要从订单中筛选，暂时先不过滤
      }
      
      this.filteredCustomers = filtered;
    },
    
    // ===== 评价搜索和筛选 =====
    searchRatings() {
      this.loadRatings();
    },
    
    filterRatings() {
      this.loadRatings();
    },
    
    resetRatingFilters() {
      this.ratingSearch = '';
      this.ratingStaffFilter = '';
      this.ratingStartDate = '';
      this.ratingEndDate = '';
      this.loadRatings();
    },
    
    // ===== 展开/收起功能 =====
    toggleRatingExpand(ratingId) {
      const index = this.expandedRatings.indexOf(ratingId);
      if (index > -1) {
        // 如果已展开，则收起
        this.expandedRatings.splice(index, 1);
        // 强制更新数组引用，确保响应式
        this.expandedRatings = [...this.expandedRatings];
      } else {
        // 如果未展开，则先收起所有其他评价，再展开当前评价
        this.expandedRatings = [ratingId];
      }
    },
    
    async toggleCustomerExpand(customerId) {
      const index = this.expandedCustomers.indexOf(customerId);
      if (index > -1) {
        // 如果已展开，则收起
        this.expandedCustomers.splice(index, 1);
        // 强制更新数组引用，确保响应式
        this.expandedCustomers = [...this.expandedCustomers];
      } else {
        // 如果未展开，则先加载客户详细数据（包含订单）
        try {
          const customer = this.customers.find(c => c.id === customerId);
          if (customer && (!customer.orders || customer.orders.length === 0)) {
            console.log('加载客户详细数据:', customerId);
            const result = await window.MerchantAdmin.API.customers.getById(customerId);
            const customerDetail = result.data;
            // 更新客户对象，添加订单数据
            customer.orders = customerDetail.orders || [];
            customer.orderCount = customerDetail.orderCount || 0;
            console.log('客户详细数据加载成功:', customer);
          }
        } catch (error) {
          console.error('加载客户详情错误:', error);
        }
        // 先收起所有其他客户，再展开当前客户
        this.expandedCustomers = [customerId];
      }
    },
    
    toggleDayExpand(dateStr) {
      console.log('点击日期:', dateStr);
      console.log('当前展开的日期:', this.expandedDays);
      const index = this.expandedDays.indexOf(dateStr);
      if (index > -1) {
        // 如果日期已展开，则收起
        this.expandedDays.splice(index, 1);
        // 强制更新数组引用，确保响应式
        this.expandedDays = [...this.expandedDays];
        console.log('收起日期:', dateStr);
      } else {
        // 如果日期未展开，则只展开当前日期
        this.expandedDays = [dateStr];
        console.log('展开日期:', dateStr);
      }
      console.log('更新后展开的日期:', this.expandedDays);
    },
    
    // ===== 详情面板 =====
    showDetail(type) {
      this.detailType = type;
      switch (type) {
        case 'appointments':
          this.detailTitle = '今日预约详情';
          break;
        case 'queue':
          this.detailTitle = '当前排队详情';
          break;
        case 'customers':
          this.detailTitle = '客户详情';
          break;
        case 'revenue':
          this.detailTitle = '今日营收详情';
          break;
        case 'monthlyRevenue':
          this.detailTitle = '月营收详情';
          break;
        case 'yearlyRevenue':
          this.detailTitle = '年营收详情';
          break;
      }
      this.showDetailPanel = true;
    },
    
    // ===== 图表功能 =====
    destroyCharts() {
      for (const key in this.charts) {
        if (this.charts[key]) {
          this.charts[key].destroy();
        }
      }
      this.charts = {};
    },
    
    initCharts() {
      // 确保 DOM 元素存在
      const serviceCtx = document.getElementById('serviceChart');
      const appointmentCtx = document.getElementById('appointmentChart');
      
      if (!serviceCtx && !appointmentCtx) {
        return;
      }
      
      // 销毁旧图表
      this.destroyCharts();
      
      // 服务项目分布图
      if (serviceCtx) {
        // 计算每个服务项目的客户数
        const serviceCustomerCount = this.services.map(service => {
          return this.appointments.filter(a => a.serviceName === service.name).length;
        });
        
        this.charts.service = new Chart(serviceCtx.getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: this.services.map(s => s.name),
            datasets: [{
              data: serviceCustomerCount.length > 0 ? serviceCustomerCount : [1],
              backgroundColor: [
                '#4F46E5',
                '#7C3AED',
                '#10B981',
                '#F59E0B',
                '#EF4444'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'right',
              },
              title: {
                display: true,
                text: '服务项目客户数分布',
                font: {
                  size: 16
                }
              }
            }
          }
        });
      }
    },
    
    async fetchAppointmentDistribution() {
      try {
        const result = await window.MerchantAdmin.API.stats.getAppointmentDistribution();
        
        // 确保 DOM 元素存在
        const appointmentCtx = document.getElementById('appointmentChart');
        if (appointmentCtx && result.data) {
          this.charts.appointment = new Chart(appointmentCtx.getContext('2d'), {
            type: 'bar',
            data: {
              labels: result.data.labels,
              datasets: [{
                label: '预约数',
                data: result.data.data,
                backgroundColor: '#4F46E5',
                borderColor: '#4F46E5',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  text: '预约时段分布',
                  font: {
                    size: 16
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          });
        }
      } catch (error) {
        console.error('加载预约时段分布错误:', error);
      }
    },
    
    // ===== 日历功能 =====
    generateCalendar() {
      const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
      const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
      const calendarDays = [];
      
      // 添加上月的天数
      const prevMonthDays = new Date(this.currentYear, this.currentMonth, 0).getDate();
      for (let i = firstDay - 1; i >= 0; i--) {
        const date = new Date(this.currentYear, this.currentMonth - 1, prevMonthDays - i);
        const dateStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(prevMonthDays - i).padStart(2, '0')}`;
        calendarDays.push({
          date: date,
          dateStr: dateStr,
          day: prevMonthDays - i,
          isCurrentMonth: false,
          appointments: []
        });
      }
      
      // 添加当月的天数
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(this.currentYear, this.currentMonth, day);
        const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayAppointments = this.appointments.filter(app => {
          if (typeof app.date === 'string' && app.date.includes('T')) {
            return app.date.split('T')[0] === dateStr;
          }
          return app.date === dateStr;
        });
        
        calendarDays.push({
          date: date,
          dateStr: dateStr,
          day: day,
          isCurrentMonth: true,
          appointments: dayAppointments
        });
      }
      
      // 添加下月的天数，使总天数为 42 天 (6 行)
      const remainingDays = 42 - calendarDays.length;
      for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(this.currentYear, this.currentMonth + 1, day);
        const dateStr = `${this.currentYear}-${String(this.currentMonth + 2).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        calendarDays.push({
          date: date,
          dateStr: dateStr,
          day: day,
          isCurrentMonth: false,
          appointments: []
        });
      }
      
      this.calendarDays = calendarDays;
    },
    
    prevMonth() {
      if (this.currentMonth === 0) {
        this.currentMonth = 11;
        this.currentYear--;
      } else {
        this.currentMonth--;
      }
      this.generateCalendar();
    },
    
    nextMonth() {
      if (this.currentMonth === 11) {
        this.currentMonth = 0;
        this.currentYear++;
      } else {
        this.currentMonth++;
      }
      this.generateCalendar();
    },
    
    // ===== 获取唯一客户数 =====
    getUniqueCustomers(appointments) {
      const customerNames = new Set(appointments.map(a => a.name));
      return customerNames.size;
    },
    
    // ===== 完成预约 =====
    async completeAppointment(appointment) {
      try {
        await window.MerchantAdmin.API.appointments.complete(appointment.id);
        // 更新本地状态
        const index = this.appointments.findIndex(a => a.id === appointment.id);
        if (index !== -1) {
          this.appointments[index].status = '已完成';
        }
        // 刷新统计数据
        await this.loadStats();
        alert('预约已完成');
      } catch (error) {
        console.error('完成预约失败:', error);
        alert('完成预约失败');
      }
    },
    
    // ===== 服务管理 =====
    openAddServiceModal() {
      this.editingService = null;
      this.serviceForm = {
        name: '',
        price: '',
        duration: '',
        description: ''
      };
      this.showServiceModal = true;
    },
    
    editService(service) {
      this.editingService = service;
      this.serviceForm = { ...service };
      this.showServiceModal = true;
    },
    
    closeServiceModal() {
      this.showServiceModal = false;
      this.editingService = null;
    },
    
    async saveService() {
      try {
        if (this.editingService) {
          await window.MerchantAdmin.API.services.update(this.editingService.id, this.serviceForm);
        } else {
          await window.MerchantAdmin.API.services.create(this.serviceForm);
        }
        await this.loadServices();
        this.closeServiceModal();
      } catch (error) {
        console.error('保存服务失败:', error);
        alert('保存服务失败: ' + error.message);
      }
    },
    
    async deleteService(id) {
      if (!confirm('确定要删除这个服务吗？')) return;
      
      try {
        await window.MerchantAdmin.API.services.delete(id);
        await this.loadServices();
      } catch (error) {
        console.error('删除服务失败:', error);
        alert('删除服务失败: ' + error.message);
      }
    },
    
    // ===== 员工管理 =====
    openAddStaffModal() {
      this.editingStaff = null;
      this.staffForm = {
        name: '',
        avatar: '',
        specialty: '',
        rating: ''
      };
      this.showStaffModal = true;
    },
    
    editStaff(staff) {
      this.editingStaff = staff;
      this.staffForm = { ...staff };
      this.showStaffModal = true;
    },
    
    closeStaffModal() {
      this.showStaffModal = false;
      this.editingStaff = null;
    },
    
    async saveStaff() {
      try {
        if (this.editingStaff) {
          await window.MerchantAdmin.API.staff.update(this.editingStaff.id, this.staffForm);
        } else {
          await window.MerchantAdmin.API.staff.create(this.staffForm);
        }
        await this.loadStaff();
        this.closeStaffModal();
      } catch (error) {
        console.error('保存员工失败:', error);
        alert('保存员工失败: ' + error.message);
      }
    },
    
    async deleteStaff(id) {
      if (!confirm('确定要删除这个员工吗？')) return;
      
      try {
        await window.MerchantAdmin.API.staff.delete(id);
        await this.loadStaff();
      } catch (error) {
        console.error('删除员工失败:', error);
        alert('删除员工失败: ' + error.message);
      }
    },
    
    // ===== 排队管理 =====
    async callNext() {
      try {
        await window.MerchantAdmin.API.queue.callNext();
        await this.loadQueue();
      } catch (error) {
        console.error('叫号失败:', error);
        alert('叫号失败: ' + error.message);
      }
    },
    
    async updateQueueStatus(record, status) {
      try {
        await window.MerchantAdmin.API.queue.updateStatus(record.id, status);
        await this.loadQueue();
      } catch (error) {
        console.error('更新状态失败:', error);
        alert('更新状态失败: ' + error.message);
      }
    },
    
    async completeService(record) {
      try {
        await window.MerchantAdmin.API.queue.completeService(record.id);
        await this.loadQueue();
      } catch (error) {
        console.error('完成服务失败:', error);
        alert('完成服务失败: ' + error.message);
      }
    },
    
    // ===== 客户详情 =====
    async viewCustomerDetail(customer) {
      try {
        const result = await window.MerchantAdmin.API.customers.getById(customer.id);
        this.selectedCustomer = result.data;
        this.showCustomerModal = true;
      } catch (error) {
        console.error('加载客户详情失败:', error);
        this.selectedCustomer = customer;
        this.showCustomerModal = true;
      }
    },
    
    closeCustomerModal() {
      this.showCustomerModal = false;
      this.selectedCustomer = {};
    }
  }
});

// 挂载应用
app.mount('#app');

console.log('模块化 Vue 应用启动完成！');
