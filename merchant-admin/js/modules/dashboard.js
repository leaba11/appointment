import { statsApi } from '../api/stats.js';

/**
 * 数据统计模块
 */
export function useDashboard() {
  // 统计相关状态
  const stats = Vue.ref({
    totalAppointments: 0,
    currentQueue: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0
  });
  const revenueRecords = Vue.ref([]);
  const merchantInfo = Vue.ref({});
  const charts = Vue.ref({});
  const showDetailPanel = Vue.ref(false);
  const detailType = Vue.ref('');
  const detailTitle = Vue.ref('');

  // 加载统计数据
  async function loadStats() {
    try {
      const result = await statsApi.getStats();
      const data = result.data;
      stats.value = {
        totalAppointments: data.totalAppointments || 0,
        currentQueue: data.currentQueue || 0,
        totalCustomers: data.totalCustomers || 0,
        totalRevenue: data.totalRevenue || 0,
        monthlyRevenue: data.monthlyRevenue || data.totalRevenue || 0,
        yearlyRevenue: data.yearlyRevenue || data.totalRevenue * 12 || 0
      };
    } catch (error) {
      console.error('加载统计数据失败:', error);
      stats.value = {
        totalAppointments: 0,
        currentQueue: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        yearlyRevenue: 0
      };
    }
  }

  // 加载营收记录
  async function loadRevenue() {
    try {
      const result = await statsApi.getRevenue();
      revenueRecords.value = result.data || [];
    } catch (error) {
      console.error('加载营收记录失败:', error);
      revenueRecords.value = [];
    }
  }

  // 加载商户信息
  async function loadMerchant() {
    try {
      const result = await statsApi.getMerchant();
      merchantInfo.value = result.data;
    } catch (error) {
      console.error('加载商户信息失败:', error);
    }
  }

  // 显示详细数据
  function showDetail(type) {
    detailType.value = type;
    switch (type) {
      case 'appointments':
        detailTitle.value = '今日预约详情';
        break;
      case 'queue':
        detailTitle.value = '当前排队详情';
        break;
      case 'customers':
        detailTitle.value = '客户详情';
        break;
      case 'revenue':
        detailTitle.value = '今日营收详情';
        break;
      case 'monthlyRevenue':
        detailTitle.value = '月营收详情';
        break;
      case 'yearlyRevenue':
        detailTitle.value = '年营收详情';
        break;
    }
    showDetailPanel.value = true;
  }

  // 关闭详细数据
  function closeDetailPanel() {
    showDetailPanel.value = false;
  }

  // 销毁图表实例
  function destroyCharts() {
    for (const key in charts.value) {
      if (charts.value[key]) {
        charts.value[key].destroy();
      }
    }
    charts.value = {};
  }

  // 初始化图表
  function initCharts(services, appointments) {
    // 确保DOM元素存在
    const serviceCtx = document.getElementById('serviceChart');
    const appointmentCtx = document.getElementById('appointmentChart');
    
    if (!serviceCtx && !appointmentCtx) {
      return;
    }
    
    // 销毁旧图表
    destroyCharts();
    
    // 服务项目分布图
    if (serviceCtx) {
      // 计算每个服务项目的客户数
      const serviceCustomerCount = services.map(service => {
        return appointments.filter(a => a.serviceName === service.name).length;
      });
      
      charts.value.service = new Chart(serviceCtx.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: services.map(s => s.name),
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
  }

  // 加载预约时段分布
  async function fetchAppointmentDistribution() {
    try {
      const result = await statsApi.getAppointmentDistribution();
      
      // 确保DOM元素存在
      const appointmentCtx = document.getElementById('appointmentChart');
      if (appointmentCtx && result.data) {
        charts.value.appointment = new Chart(appointmentCtx.getContext('2d'), {
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
      console.error('加载预约时段分布失败:', error);
    }
  }

  return {
    stats,
    revenueRecords,
    merchantInfo,
    charts,
    showDetailPanel,
    detailType,
    detailTitle,
    loadStats,
    loadRevenue,
    loadMerchant,
    showDetail,
    closeDetailPanel,
    destroyCharts,
    initCharts,
    fetchAppointmentDistribution
  };
}
