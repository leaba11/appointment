import { staffApi } from '../api/staff.js';

/**
 * 员工管理模块
 */
export function useStaff() {
  // 员工相关状态
  const staffList = Vue.ref([]);
  const showStaffModal = Vue.ref(false);
  const editingStaff = Vue.ref(null);
  const staffForm = Vue.ref({
    name: '',
    avatar: '',
    specialty: '',
    rating: ''
  });

  // 加载员工列表
  async function loadStaff() {
    try {
      const result = await staffApi.getAll();
      staffList.value = result.data;
    } catch (error) {
      console.error('加载员工列表失败:', error);
    }
  }

  // 打开新增员工弹窗
  function openAddStaffModal() {
    editingStaff.value = null;
    staffForm.value = {
      name: '',
      avatar: '',
      specialty: '',
      rating: ''
    };
    showStaffModal.value = true;
  }

  // 打开编辑员工弹窗
  function editStaff(staff) {
    editingStaff.value = staff;
    staffForm.value = { ...staff };
    showStaffModal.value = true;
  }

  // 关闭员工弹窗
  function closeStaffModal() {
    showStaffModal.value = false;
    editingStaff.value = null;
  }

  // 保存员工
  async function saveStaff() {
    try {
      if (editingStaff.value) {
        await staffApi.update(editingStaff.value.id, staffForm.value);
      } else {
        await staffApi.create(staffForm.value);
      }
      await loadStaff();
      closeStaffModal();
    } catch (error) {
      console.error('保存员工失败:', error);
      alert('保存员工失败: ' + error.message);
    }
  }

  // 删除员工
  async function deleteStaff(id) {
    if (!confirm('确定要删除这个员工吗？')) return;
    
    try {
      await staffApi.delete(id);
      await loadStaff();
    } catch (error) {
      console.error('删除员工失败:', error);
      alert('删除员工失败: ' + error.message);
    }
  }

  return {
    staffList,
    showStaffModal,
    editingStaff,
    staffForm,
    loadStaff,
    openAddStaffModal,
    editStaff,
    closeStaffModal,
    saveStaff,
    deleteStaff
  };
}
