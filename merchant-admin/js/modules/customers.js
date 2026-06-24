import { customersApi } from '../api/customers.js';

/**
 * 客户管理模块
 */
export function useCustomers() {
  // 客户相关状态
  const customers = Vue.ref([]);
  const filteredCustomers = Vue.ref([]);
  const showCustomerModal = Vue.ref(false);
  const selectedCustomer = Vue.ref({});
  const customerSearch = Vue.ref('');
  const genderFilter = Vue.ref('all');
  const dateFilter = Vue.ref('');
  const expandedCustomers = Vue.ref([]);

  // 加载客户列表
  async function loadCustomers() {
    try {
      const result = await customersApi.getAll();
      customers.value = result.data;
      filterCustomers();
    } catch (error) {
      console.error('加载客户列表失败:', error);
      customers.value = [];
      filteredCustomers.value = [];
    }
  }

  // 过滤客户
  function filterCustomers() {
    let filtered = customers.value || [];
    
    // 按关键词搜索
    if (customerSearch.value) {
      const searchTerm = customerSearch.value.toLowerCase();
      filtered = filtered.filter(customer => {
        return customer.name && customer.name.toLowerCase().includes(searchTerm);
      });
    }
    
    // 按性别筛选
    if (genderFilter.value !== 'all') {
      filtered = filtered.filter(customer => customer.gender === genderFilter.value);
    }
    
    filteredCustomers.value = filtered;
  }

  // 搜索客户
  function searchCustomers() {
    filterCustomers();
  }

  // 查看客户详情
  async function viewCustomerDetail(customer) {
    try {
      const result = await customersApi.getById(customer.id);
      selectedCustomer.value = result.data;
      showCustomerModal.value = true;
    } catch (error) {
      console.error('加载客户详情失败:', error);
      selectedCustomer.value = customer;
      showCustomerModal.value = true;
    }
  }

  // 切换客户展开状态
  async function toggleCustomerExpand(customerId) {
    const index = expandedCustomers.value.indexOf(customerId);
    if (index > -1) {
      // 如果已展开，则收起
      expandedCustomers.value.splice(index, 1);
      expandedCustomers.value = [...expandedCustomers.value];
    } else {
      // 如果未展开，则先加载客户详细数据（包含订单）
      try {
        const customer = customers.value.find(c => c.id === customerId);
        if (customer && (!customer.orders || customer.orders.length === 0)) {
          const result = await customersApi.getById(customerId);
          const customerDetail = result.data;
          // 更新客户对象，添加订单数据
          customer.orders = customerDetail.orders || [];
          customer.orderCount = customerDetail.orderCount || 0;
        }
      } catch (error) {
        console.error('加载客户详情失败:', error);
      }
      // 先收起所有其他客户，再展开当前客户
      expandedCustomers.value = [customerId];
    }
  }

  // 关闭客户详情弹窗
  function closeCustomerModal() {
    showCustomerModal.value = false;
    selectedCustomer.value = {};
  }

  // 获取性别对应的图标
  function getGenderIcon(gender) {
    if (gender === 'male') {
      return '👨';
    } else if (gender === 'female') {
      return '👩';
    } else {
      return '👤';
    }
  }

  return {
    customers,
    filteredCustomers,
    showCustomerModal,
    selectedCustomer,
    customerSearch,
    genderFilter,
    dateFilter,
    expandedCustomers,
    loadCustomers,
    filterCustomers,
    searchCustomers,
    viewCustomerDetail,
    toggleCustomerExpand,
    closeCustomerModal,
    getGenderIcon
  };
}
