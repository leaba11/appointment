import { staffApi } from '../api/staff.js';

/**
 * 评价管理模块
 */
export function useRatings() {
  // 评价相关状态
  const ratingsList = Vue.ref([]);
  const ratingSearch = Vue.ref('');
  const ratingStaffFilter = Vue.ref('');
  const ratingStartDate = Vue.ref('');
  const ratingEndDate = Vue.ref('');
  const expandedRatings = Vue.ref([]);

  // 加载评价列表
  async function loadRatings() {
    try {
      const params = {
        search: ratingSearch.value,
        staffId: ratingStaffFilter.value,
        startDate: ratingStartDate.value,
        endDate: ratingEndDate.value
      };
      
      const result = await staffApi.getRatings(params);
      ratingsList.value = result.data || [];
    } catch (error) {
      console.error('加载评价列表失败:', error);
      ratingsList.value = [];
    }
  }

  // 搜索评价
  function searchRatings() {
    loadRatings();
  }

  // 筛选评价
  function filterRatings() {
    loadRatings();
  }

  // 重置评价筛选
  function resetRatingFilters() {
    ratingSearch.value = '';
    ratingStaffFilter.value = '';
    ratingStartDate.value = '';
    ratingEndDate.value = '';
    loadRatings();
  }

  // 切换评价展开状态
  function toggleRatingExpand(ratingId) {
    const index = expandedRatings.value.indexOf(ratingId);
    if (index > -1) {
      // 如果已展开，则收起
      expandedRatings.value.splice(index, 1);
      expandedRatings.value = [...expandedRatings.value];
    } else {
      // 如果未展开，则先收起所有其他评价，再展开当前评价
      expandedRatings.value = [ratingId];
    }
  }

  return {
    ratingsList,
    ratingSearch,
    ratingStaffFilter,
    ratingStartDate,
    ratingEndDate,
    expandedRatings,
    loadRatings,
    searchRatings,
    filterRatings,
    resetRatingFilters,
    toggleRatingExpand
  };
}
