import { authApi } from '../api/auth.js';

/**
 * 认证模块
 */
export function useAuth() {
  // 认证相关状态
  const isLoggedIn = Vue.ref(false);
  const currentUser = Vue.ref('');
  const adminToken = Vue.ref(null);
  const loginForm = Vue.ref({
    username: '',
    password: ''
  });

  // 检查登录状态
  function checkLoginStatus() {
    const token = localStorage.getItem('adminToken');
    if (token) {
      adminToken.value = token;
      isLoggedIn.value = true;
      currentUser.value = localStorage.getItem('adminUsername') || '管理员';
      return true;
    }
    return false;
  }

  // 登录
  async function login() {
    try {
      const result = await authApi.login(loginForm.value);
      
      adminToken.value = result.data.token;
      isLoggedIn.value = true;
      currentUser.value = result.data.admin.username;
      
      // 保存登录状态
      localStorage.setItem('adminToken', result.data.token);
      localStorage.setItem('adminUsername', result.data.admin.username);
      
      return result;
    } catch (error) {
      alert('登录失败: ' + error.message);
      throw error;
    }
  }

  // 退出登录
  function logout() {
    isLoggedIn.value = false;
    currentUser.value = '';
    adminToken.value = null;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
  }

  // 初始化时检查登录状态
  checkLoginStatus();

  return {
    isLoggedIn,
    currentUser,
    adminToken,
    loginForm,
    login,
    logout
  };
}
