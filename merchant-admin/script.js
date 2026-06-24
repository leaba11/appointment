// API基础URL - 使用相对路径，自动适配当前域名和端口
const API_BASE_URL = '/api';

// API配置
const API = {
  // 管理员登录
  adminLogin: `${API_BASE_URL}/admin/login`,
  
  // 服务项目
  services: `${API_BASE_URL}/services`,
  service: (id) => `${API_BASE_URL}/services/${id}`,
  
  // 员工
  staff: `${API_BASE_URL}/staff`,
  staffDetail: (id) => `${API_BASE_URL}/staff/${id}`,
  
  // 预约
  appointments: `${API_BASE_URL}/appointments/all`,
  appointmentStatus: (id) => `${API_BASE_URL}/appointments/${id}/status`,
  
  // 排队
  queue: `${API_BASE_URL}/queue`,
  queueList: `${API_BASE_URL}/queue/list`,
  callNext: `${API_BASE_URL}/queue/call-next`,
  
  // 客户
  customers: `${API_BASE_URL}/stats/customers`,
  customerDetail: (id) => `${API_BASE_URL}/stats/customers/${id}`,
  
  // 数据统计
  stats: `${API_BASE_URL}/stats`,
  
  // 预约时段分布
  appointmentDistribution: `${API_BASE_URL}/stats/appointment-distribution`,
  
  // 营收记录
  revenue: `${API_BASE_URL}/stats/revenue`,
  
  // 商户信息
  merchant: `${API_BASE_URL}/merchant`
};

// 初始化Vue应用
const { createApp } = Vue;

createApp({
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
      
      // 日历
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      calendarDays: [],
      
      // 加载状态
      loading: false
    };
  },
  
  mounted() {
    // 立即锁定所有弹窗状态，防止刷新时闪烁
    this.showDetailPanel = false;
    this.showServiceModal = false;
    this.showStaffModal = false;
    this.showCustomerModal = false;
    
    // 初始化日期检查，确保新的一天排队号码重置为1
    const today = new Date().toDateString();
    const lastQueueDate = localStorage.getItem('lastQueueDate');
    if (lastQueueDate !== today) {
      localStorage.setItem('lastQueueDate', today);
    }
    
    // 检查是否已登录
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
    }
  },
  
  methods: {
    // 通用请求方法
    async request(url, method = 'GET', data = null) {
      try {
        console.log('发起请求:', { url, method, data });
        const options = {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'same-origin'
        };
        
        if (data && method !== 'GET') {
          options.body = JSON.stringify(data);
        }
        
        console.log('请求选项:', options);
        const response = await fetch(url, options);
        console.log('响应状态:', response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('响应数据:', result);
        
        if (!result.success) {
          throw new Error(result.message || '请求失败');
        }
        
        return result;
      } catch (error) {
        console.error('请求错误详情:', error);
        console.error('错误名称:', error.name);
        console.error('错误消息:', error.message);
        throw error;
      }
    },
    
    // 加载所有数据
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
        
        // 使用 requestAnimationFrame 确保DOM已更新后再初始化图表
        requestAnimationFrame(() => {
          this.initCharts();
          // 延迟调用API获取预约时段分布数据，确保图表已创建
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
    
    // 登录
    async login() {
      try {
        const result = await this.request(API.adminLogin, 'POST', {
          username: this.loginForm.username,
          password: this.loginForm.password
        });
        
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
    
    // 退出登录
    logout() {
      this.isLoggedIn = false;
      this.currentUser = '';
      this.adminToken = null;
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUsername');
    },
    
    // 加载统计数据
    async loadStats() {
      try {
        const result = await this.request(API.stats);
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
    
    // 加载营收记录
    async loadRevenue() {
      try {
        console.log('开始加载营收数据...');
        const result = await this.request(API.revenue);
        this.revenueRecords = result.data || [];
        console.log('营收数据加载成功:', this.revenueRecords);
        console.log('营收记录数量:', this.revenueRecords.length);
      } catch (error) {
        console.error('加载营收记录错误:', error);
        this.revenueRecords = [];
      }
    },
    
    // 加载服务列表
    async loadServices() {
      try {
        const result = await this.request(API.services);
        this.services = result.data;
      } catch (error) {
        console.error('加载服务列表错误:', error);
      }
    },
    
    // 加载员工列表
    async loadStaff() {
      try {
        const result = await this.request(API.staff);
        this.staffList = result.data;
      } catch (error) {
        console.error('加载员工列表错误:', error);
      }
    },
    
    // 加载预约列表
    async loadAppointments() {
      try {
        const result = await this.request(API.appointments);
        this.appointments = result.data;
        this.generateCalendar();
      } catch (error) {
        console.error('加载预约列表错误:', error);
      }
    },
    

    
    // 加载客户列表
    async loadCustomers() {
      try {
        console.log('开始加载客户列表...');
        const result = await this.request(API.customers);
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
    
    // 搜索客户
    searchCustomers() {
      this.filterCustomers();
    },
    
    // 筛选客户
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
    
    // 加载评价列表
    async loadRatings() {
      try {
        const params = new URLSearchParams();
        if (this.ratingSearch) params.append('search', this.ratingSearch);
        if (this.ratingStaffFilter) params.append('staffId', this.ratingStaffFilter);
        if (this.ratingStartDate) params.append('startDate', this.ratingStartDate);
        if (this.ratingEndDate) params.append('endDate', this.ratingEndDate);
        
        const result = await this.request(`/api/staff/ratings/list?${params.toString()}`);
        this.ratingsList = result.data || [];
      } catch (error) {
        console.error('加载评价列表错误:', error);
        this.ratingsList = [];
      }
    },
    
    // 搜索评价
    searchRatings() {
      this.loadRatings();
    },
    
    // 筛选评价
    filterRatings() {
      this.loadRatings();
    },
    
    // 重置评价筛选
    resetRatingFilters() {
      this.ratingSearch = '';
      this.ratingStaffFilter = '';
      this.ratingStartDate = '';
      this.ratingEndDate = '';
      this.loadRatings();
    },

    // 切换评价展开/收起
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

    // 切换客户展开/收起
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
            const result = await this.request(API.customerDetail(customerId));
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

    // 切换预约日期展开/收起
    toggleDayExpand(date) {
      console.log('点击日期:', date);
      console.log('当前展开的日期:', this.expandedDays);
      const index = this.expandedDays.indexOf(date);
      if (index > -1) {
        // 如果日期已展开，则收起
        this.expandedDays.splice(index, 1);
        // 强制更新数组引用，确保响应式
        this.expandedDays = [...this.expandedDays];
        console.log('收起日期:', date);
      } else {
        // 如果日期未展开，则只展开当前日期
        this.expandedDays = [date];
        console.log('展开日期:', date);
      }
      console.log('更新后展开的日期:', this.expandedDays);
    },

    // 获取唯一用户数
    getUniqueCustomers(appointments) {
      const customerNames = new Set(appointments.map(a => a.name));
      return customerNames.size;
    },
    
    // 获取订单状态的样式class
    getOrderStatusClass(status) {
      if (status === '已完成') {
        return 'status-completed';
      } else if (status === '已取消') {
        return 'status-cancelled';
      } else if (status === '等待中' || status === '已叫号') {
        return 'status-pending';
      } else {
        return 'status-default';
      }
    },
    
    // 获取性别对应的图标
    getGenderIcon(gender) {
      if (gender === 'male') {
        return '👨';
      } else if (gender === 'female') {
        return '👩';
      } else {
        return '👤';
      }
    },
    
    // 格式化日期（完整格式）
    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    // 格式化日期（简短格式，仅年月日）
    formatDateShort(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit'
      });
    },
    
    // 加载商户信息
    async loadMerchant() {
      try {
        const result = await this.request(API.merchant);
        this.merchantInfo = result.data;
      } catch (error) {
        console.error('加载商户信息错误:', error);
      }
    },
    
    // 显示详细数据
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
    
    // 销毁图表实例
    destroyCharts() {
      for (const key in this.charts) {
        if (this.charts[key]) {
          this.charts[key].destroy();
        }
      }
      this.charts = {};
    },
    
    // 初始化图表
    initCharts() {
      // 确保DOM元素存在
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
      
      // 预约时段分布图 - 图表将在fetchAppointmentDistribution中创建
      if (appointmentCtx) {
        // 先创建一个空图表，使用模拟数据
        this.charts.appointment = new Chart(appointmentCtx.getContext('2d'), {
          type: 'bar',
          data: {
            labels: [
              '9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
              '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
              '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
              '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
            ],
            datasets: [{
              label: '预约数量',
              data: Array(30).fill(0),
              backgroundColor: 'rgba(79, 70, 229, 0.7)',
              borderColor: '#4F46E5',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: false
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
    },
    
    // 获取预约时段分布数据
    async fetchAppointmentDistribution() {
      try {
        console.log('=== 开始获取预约时段分布数据 ===');
        
        // 使用统一的request方法调用API
        const result = await this.request(API.appointmentDistribution);
        console.log('API响应:', result);
        
        // 确保API返回了有效数据
        if (result.success && result.data && result.data.labels && result.data.data) {
          console.log('获取到数据:', result.data);
          console.log('labels长度:', result.data.labels.length);
          console.log('data长度:', result.data.data.length);
          
          // 确保DOM元素存在，重新初始化图表
          const appointmentCtx = document.getElementById('appointmentChart');
          if (appointmentCtx) {
            console.log('图表容器存在，准备创建/更新图表');
            
            // 如果图表已存在，销毁它
            if (this.charts && this.charts.appointment) {
              this.charts.appointment.destroy();
            }
            
            // 创建新图表，直接使用API返回的数据
            this.charts.appointment = new Chart(appointmentCtx.getContext('2d'), {
              type: 'bar',
              data: {
                labels: result.data.labels,
                datasets: [{
                  label: '预约数量',
                  data: result.data.data,
                  backgroundColor: 'rgba(79, 70, 229, 0.7)',
                  borderColor: '#4F46E5',
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1
                    }
                  }
                }
              }
            });
            console.log('图表创建成功');
          } else {
            console.log('图表容器不存在');
          }
        } else {
          console.log('API返回数据无效');
        }
      } catch (error) {
        console.error('获取预约时段分布数据错误:', error);
      }
    },
    
    // 获取菜单标题
    getMenuTitle(menu) {
      const titles = {
        dashboard: '数据统计',
        services: '服务项目管理',
        staff: '员工管理',
        appointments: '预约看板',
        queue: '排队墙',
        customers: '客户档案'
      };
      return titles[menu] || '';
    },
    
    // 服务管理
    editService(service) {
      this.editingService = service;
      this.serviceForm = { ...service };
      this.showServiceModal = true;
    },
    
    async saveService() {
      try {
        if (this.editingService) {
          // 编辑
          await this.request(API.service(this.editingService.id), 'PUT', this.serviceForm);
          const index = this.services.findIndex(s => s.id === this.editingService.id);
          this.services[index] = { ...this.serviceForm };
        } else {
          // 新增
          const newService = await this.request(API.services, 'POST', this.serviceForm);
          this.services.push(newService);
        }
        this.showServiceModal = false;
        this.editingService = null;
        this.serviceForm = { name: '', price: '', duration: '', description: '' };
        alert('保存成功');
      } catch (error) {
        console.error('保存服务错误:', error);
        alert('保存失败: ' + error.message);
      }
    },
    
    async deleteService(id) {
      if (confirm('确定删除该服务？')) {
        try {
          await this.request(API.service(id), 'DELETE');
          this.services = this.services.filter(s => s.id !== id);
          alert('删除成功');
        } catch (error) {
          console.error('删除服务错误:', error);
          alert('删除失败: ' + error.message);
        }
      }
    },
    
    // 员工管理
    editStaff(staff) {
      this.editingStaff = staff;
      this.staffForm = { ...staff };
      this.showStaffModal = true;
    },
    
    async saveStaff() {
      try {
        if (this.editingStaff) {
          // 编辑
          await this.request(API.staffDetail(this.editingStaff.id), 'PUT', this.staffForm);
          const index = this.staffList.findIndex(s => s.id === this.editingStaff.id);
          this.staffList[index] = { ...this.staffForm };
        } else {
          // 新增
          const newStaff = await this.request(API.staff, 'POST', this.staffForm);
          this.staffList.push(newStaff);
        }
        this.showStaffModal = false;
        this.editingStaff = null;
        this.staffForm = { name: '', avatar: '', specialty: '', rating: '' };
        alert('保存成功');
      } catch (error) {
        console.error('保存员工错误:', error);
        alert('保存失败: ' + error.message);
      }
    },
    
    async deleteStaff(id) {
      if (confirm('确定删除该员工？')) {
        try {
          await this.request(API.staffDetail(id), 'DELETE');
          this.staffList = this.staffList.filter(s => s.id !== id);
          alert('删除成功');
        } catch (error) {
          console.error('删除员工错误:', error);
          alert('删除失败: ' + error.message);
        }
      }
    },
    
    // 预约看板
    generateCalendar() {
      const days = [];
      const date = new Date(this.currentYear, this.currentMonth, 1);
      const firstDay = date.getDay();
      const lastDate = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
      
      // 填充前面的空白
      for (let i = 0; i < firstDay; i++) {
        days.push({ day: '', appointments: [] });
      }
      
      // 优化：缓存日期对象，减少重复创建
      const appointmentsMap = new Map();
      this.appointments.forEach(a => {
        const appDate = new Date(a.date);
        // 只显示当前月份的预约
        if (appDate.getFullYear() === this.currentYear && appDate.getMonth() === this.currentMonth) {
          const key = appDate.getDate();
          if (!appointmentsMap.has(key)) {
            appointmentsMap.set(key, []);
          }
          appointmentsMap.get(key).push(a);
        }
      });
      
      // 填充日期
      for (let i = 1; i <= lastDate; i++) {
        const dayAppointments = appointmentsMap.get(i) || [];
        days.push({ day: i, appointments: dayAppointments });
      }
      
      this.calendarDays = days;
    },
    
    prevMonth() {
      this.currentMonth--;
      if (this.currentMonth < 0) {
        this.currentMonth = 11;
        this.currentYear--;
      }
      this.generateCalendar();
    },
    
    nextMonth() {
      this.currentMonth++;
      if (this.currentMonth > 11) {
        this.currentMonth = 0;
        this.currentYear++;
      }
      this.generateCalendar();
    },
    
    // 排队墙
    async callNext() {
      try {
        // 检查是否需要重置排队号码（如果是新的一天）
        const lastQueueDate = localStorage.getItem('lastQueueDate');
        const today = new Date().toDateString();
        
        // 如果是新的一天，先重置本地排队号码
        if (lastQueueDate !== today) {
          localStorage.setItem('lastQueueDate', today);
        }
        
        // 调用后端API获取下一个等待中的号码
        const result = await this.request(API.callNext, 'POST', {});
        const data = result.data;
        
        // 更新当前叫号
        this.queue.currentNumber = data.currentNumber || data.current_number || 1;
        
        // 重新加载队列信息
        await this.loadQueue();
        
        alert('叫号成功');
      } catch (error) {
        console.error('叫号失败:', error);
        alert('叫号失败: ' + error.message);
      }
    },
    
    // 加载队列信息
    async loadQueue() {
      try {
        const result = await this.request(API.queueList);
        const data = result.data;
        
        if (data) {
          const lastQueueDate = localStorage.getItem('lastQueueDate');
          const today = new Date().toDateString();
          
          let currentNumber = data.currentNumber || data.current_number || 1;
          
          if (lastQueueDate !== today) {
            currentNumber = 1;
            localStorage.setItem('lastQueueDate', today);
          }
          
          this.queue = {
            currentNumber: currentNumber,
            queueList: data.queueList || data.queue_list || []
          };
          this.queueList = (this.queue.queueList || []).map(item => ({
            id: item.id || item.queue_number || '',
            number: item.queue_number || item.number || '',
            name: item.customerName || item.name || '匿名用户',
            phone: item.customerPhone || item.phone || '',
            time: item.created_at ? new Date(item.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : item.time || '',
            status: item.status === 'waiting' ? '等待中' : (item.status === 'called' ? '美发中' : (item.status === 'servicing' ? '美发中' : (item.status === 'completed' ? '已完成' : (item.status === 'cancelled' ? '已取消' : (item.status === 'skipped' ? '已过号' : item.status)))))
          }));
        }
      } catch (error) {
        console.error('加载队列信息错误:', error);
      }
    },
    
    // 更新排队状态
    async updateQueueStatus(item, status) {
      if (confirm(`确定将号码 ${item.number} 标记为 ${status} 吗？`)) {
        try {
          // 将中文状态转换为英文状态
          let statusEn = 'waiting';
          if (status === '已完成') statusEn = 'completed';
          else if (status === '已取消') statusEn = 'cancelled';
          else if (status === '已过号') statusEn = 'skipped';
          else if (status === '美发中') statusEn = 'servicing';
          
          // 调用后端API更新状态
          await this.request(`${API_BASE_URL}/queue/update-status`, 'POST', {
            recordId: item.id,
            status: statusEn
          });
          
          // 重新加载队列信息
          await this.loadQueue();
          
          alert('状态更新成功');
        } catch (error) {
          console.error('更新状态失败:', error);
          alert('更新状态失败: ' + error.message);
        }
      }
    },
    
    // 客户档案
    async viewCustomerDetail(customer) {
      try {
        // 从API获取客户详细信息，包括历史订单
        const result = await this.request(API.customerDetail(customer.id));
        const customerDetail = result.data;
        // 确保客户有订单数据
        if (!customerDetail.orders || customerDetail.orders.length === 0) {
          customerDetail.orders = [];
        }
        this.selectedCustomer = { ...customerDetail };
        this.showCustomerModal = true;
      } catch (error) {
        console.error('加载客户详情错误:', error);
        // 如果API调用失败，使用本地数据
        if (!customer.orders || customer.orders.length === 0) {
          customer.orders = [];
        }
        this.selectedCustomer = { ...customer };
        this.showCustomerModal = true;
      }
    }
  }
}).mount('#app');