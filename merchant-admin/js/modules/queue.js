import { queueApi } from '../api/queue.js';

/**
 * 排队管理模块
 */
export function useQueue() {
  // 排队相关状态
  const queue = Vue.ref({ currentNumber: 1, queueList: [] });
  const queueList = Vue.ref([]);

  // 加载队列信息
  async function loadQueue() {
    try {
      const result = await queueApi.getQueue();
      queue.value = result.data;
      
      // 处理排队列表
      const now = new Date();
      const todayYear = now.getFullYear();
      const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
      const todayDay = String(now.getDate()).padStart(2, '0');
      const today = `${todayYear}-${todayMonth}-${todayDay}`;
      
      queueList.value = (result.data.queueList || []).filter(record => {
        const recordDate = record.created_at ? record.created_at.split('T')[0] : today;
        return (record.status === '等待中' || record.status === '美发中' || 
                record.status === 'called' || record.status === 'servicing') && 
               recordDate === today;
      }).map(record => ({
        ...record,
        statusClass: record.status === 'waiting' ? 'waiting' : 
                    (record.status === 'called' || record.status === 'servicing' ? 'called' : record.status)
      }));
    } catch (error) {
      console.error('加载队列信息失败:', error);
    }
  }

  // 叫号
  async function callNext() {
    try {
      await queueApi.callNext();
      await loadQueue();
    } catch (error) {
      console.error('叫号失败:', error);
      alert('叫号失败: ' + error.message);
    }
  }

  // 更新排队状态
  async function updateQueueStatus(record, status) {
    try {
      await queueApi.updateStatus(record.id, status);
      await loadQueue();
    } catch (error) {
      console.error('更新状态失败:', error);
      alert('更新状态失败: ' + error.message);
    }
  }

  // 完成服务
  async function completeService(record) {
    try {
      await queueApi.completeService(record.id);
      await loadQueue();
    } catch (error) {
      console.error('完成服务失败:', error);
      alert('完成服务失败: ' + error.message);
    }
  }

  return {
    queue,
    queueList,
    loadQueue,
    callNext,
    updateQueueStatus,
    completeService
  };
}
