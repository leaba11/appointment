import { servicesApi } from '../api/services.js';

/**
 * 服务管理模块
 */
export function useServices() {
  // 服务相关状态
  const services = Vue.ref([]);
  const showServiceModal = Vue.ref(false);
  const editingService = Vue.ref(null);
  const serviceForm = Vue.ref({
    name: '',
    price: '',
    duration: '',
    description: ''
  });

  // 加载服务列表
  async function loadServices() {
    try {
      const result = await servicesApi.getAll();
      services.value = result.data;
    } catch (error) {
      console.error('加载服务列表失败:', error);
    }
  }

  // 打开新增服务弹窗
  function openAddServiceModal() {
    editingService.value = null;
    serviceForm.value = {
      name: '',
      price: '',
      duration: '',
      description: ''
    };
    showServiceModal.value = true;
  }

  // 打开编辑服务弹窗
  function editService(service) {
    editingService.value = service;
    serviceForm.value = { ...service };
    showServiceModal.value = true;
  }

  // 关闭服务弹窗
  function closeServiceModal() {
    showServiceModal.value = false;
    editingService.value = null;
  }

  // 保存服务
  async function saveService() {
    try {
      if (editingService.value) {
        await servicesApi.update(editingService.value.id, serviceForm.value);
      } else {
        await servicesApi.create(serviceForm.value);
      }
      await loadServices();
      closeServiceModal();
    } catch (error) {
      console.error('保存服务失败:', error);
      alert('保存服务失败: ' + error.message);
    }
  }

  // 删除服务
  async function deleteService(id) {
    if (!confirm('确定要删除这个服务吗？')) return;
    
    try {
      await servicesApi.delete(id);
      await loadServices();
    } catch (error) {
      console.error('删除服务失败:', error);
      alert('删除服务失败: ' + error.message);
    }
  }

  return {
    services,
    showServiceModal,
    editingService,
    serviceForm,
    loadServices,
    openAddServiceModal,
    editService,
    closeServiceModal,
    saveService,
    deleteService
  };
}
