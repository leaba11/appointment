// 导入所有模块
import { useAuth } from './modules/auth.js';
import { useServices } from './modules/services.js';
import { useStaff } from './modules/staff.js';
import { useAppointments } from './modules/appointments.js';
import { useQueue } from './modules/queue.js';
import { useCustomers } from './modules/customers.js';
import { useRatings } from './modules/ratings.js';
import { useDashboard } from './modules/dashboard.js';
import { formatDate, formatDateTime, formatAmount, formatStatus, getStatusClass } from './utils/format.js';

// 创建 Vue 应用
const app = Vue.createApp({
  setup() {
    // 使用所有功能模块
    const auth = useAuth();
    const services = useServices();
    const staff = useStaff();
    const appointments = useAppointments();
    const queue = useQueue();
    const customers = useCustomers();
    const ratings = useRatings();
    const dashboard = useDashboard();
    
    // 应用状态
    const currentMenu = Vue.ref('dashboard');
    const loading = Vue.ref(false);
    
    // 加载所有数据
    async function loadAllData() {
      loading.value = true;
      try {
        await Promise.all([
          dashboard.loadStats(),
          services.loadServices(),
          staff.loadStaff(),
          appointments.loadAppointments(),
          queue.loadQueue(),
          customers.loadCustomers(),
          dashboard.loadMerchant(),
          dashboard.loadRevenue(),
          ratings.loadRatings()
        ]);
        
        // 使用 requestAnimationFrame 确保DOM已更新后再初始化图表
        Vue.nextTick(() => {
          dashboard.initCharts(services.services.value, appointments.appointments.value);
          // 延迟调用API获取预约时段分布数据，确保图表已创建
          setTimeout(() => {
            dashboard.fetchAppointmentDistribution();
          }, 300);
        });
      } catch (error) {
        console.error('加载数据错误:', error);
      } finally {
        loading.value = false;
      }
    }
    
    // 登录成功处理
    const handleLoginSuccess = async () => {
      await loadAllData();
    };
    
    // 格式化函数
    const format = {
      formatDate,
      formatDateTime,
      formatAmount,
      formatStatus,
      getStatusClass
    };
    
    // 导出工具函数
    const getMenuTitle = (menu) => {
      const titles = {
        'dashboard': '数据统计',
        'services': '服务项目管理',
        'staff': '员工管理',
        'appointments': '预约看板',
        'queue': '排队墙',
        'customers': '客户档案',
        'ratings': '评价管理'
      };
      return titles[menu] || menu;
    };
    
    // 监听登录状态变化
    Vue.watch(auth.isLoggedIn, (isLoggedIn) => {
      if (isLoggedIn) {
        loadAllData();
      }
    });
    
    // 监听当前菜单变化
    Vue.watch(currentMenu, (newMenu) => {
      if (newMenu === 'dashboard') {
        // 当切换到仪表盘页面时，重新初始化图表并获取数据
        Vue.nextTick(() => {
          dashboard.initCharts(services.services.value, appointments.appointments.value);
          setTimeout(() => {
            dashboard.fetchAppointmentDistribution();
          }, 300);
        });
      }
      if (newMenu === 'ratings') {
        // 当切换到评价管理页面时，加载评价数据
        ratings.loadRatings();
      }
    });
    
    // 返回所有状态和方法
    return {
      // 认证模块
      ...auth,
      
      // 服务管理模块
      ...services,
      
      // 员工管理模块
      ...staff,
      
      // 预约管理模块
      ...appointments,
      
      // 排队管理模块
      ...queue,
      
      // 客户管理模块
      ...customers,
      
      // 评价管理模块
      ...ratings,
      
      // 数据统计模块
      ...dashboard,
      
      // 应用状态
      currentMenu,
      loading,
      
      // 方法
      loadAllData,
      handleLoginSuccess,
      
      // 工具函数
      format,
      getMenuTitle
    };
  },
  
  methods: {
    // 登录方法（兼容原代码）
    async login() {
      try {
        await this.handleLoginSuccess();
      } catch (error) {
        // 错误已在模块中处理
      }
    },
    
    // 通用请求方法（保留以兼容原代码，但实际使用 API 模块）
    async request(url, method = 'GET', data = null) {
      console.warn('使用了旧的 request 方法，请使用 API 模块');
      // 这里可以根据需要实现
    },
    
    // 格式化日期（兼容原代码）
    formatDate(dateStr) {
      return this.format.formatDate(dateStr);
    },
    
    formatDateShort(dateStr) {
      return this.format.formatDate(dateStr);
    }
  },
  
  mounted() {
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
    if (this.isLoggedIn) {
      // 使用 setTimeout 延迟加载数据，确保视图已完全渲染
      setTimeout(() => {
        this.loadAllData();
      }, 0);
    }
  }
});

// 挂载应用
app.mount('#app');

console.log('应用已初始化');
