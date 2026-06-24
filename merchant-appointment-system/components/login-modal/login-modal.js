const authService = require('../../utils/auth-service');

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
      observer: function(newVal) {
        if (newVal) {
          // 弹窗打开时重置状态
          this.setData({
            step: 0,
            selectedGender: null,
            userInfo: null,
            phone: '',
            agreedToAuthorize: false
          });
        }
      }
    }
  },
  data: {
    step: 0, // 0: 授权询问，1: 登录，2: 选择性别，3: 填写手机号
    selectedGender: null, // 选中的性别
    userInfo: null, // 存储用户信息
    phone: '', // 手机号
    agreedToAuthorize: false // 是否同意授权
  },
  methods: {
    handleContentTap: function(e) {
      // 阻止事件冒泡，避免点击内容区域关闭弹窗
      if (e && e.stopPropagation) {
        e.stopPropagation();
      }
    },
    
    // 同意授权
    handleAgree: function() {
      console.log('用户同意授权');
      this.setData({ 
        agreedToAuthorize: true,
        step: 1 
      });
    },
    
    // 不同意授权
    handleDisagree: function() {
      console.log('用户不同意授权，使用默认信息');
      this.setData({ 
        agreedToAuthorize: false,
        userInfo: {
          nickName: '微信用户',
          avatarUrl: ''
        },
        step: 1 
      });
    },
    
    // 检查本地是否有已存储的用户信息
    checkLocalUserInfo: function() {
      try {
        const savedUserInfo = wx.getStorageSync('userInfo');
        if (savedUserInfo) {
          console.log('找到本地存储的用户信息:', savedUserInfo);
          return savedUserInfo;
        }
      } catch (e) {
        console.log('读取本地用户信息失败');
      }
      return null;
    },
    
    // 获取用户信息 - 通过bindgetuserinfo绑定
    getUserInfo: function(e) {
      console.log('=== getUserInfo 回调 ===');
      console.log('e.detail:', e.detail);
      console.log('用户是否同意授权:', this.data.agreedToAuthorize);
      
      // 检查本地是否有已存储的用户信息
      const localUserInfo = this.checkLocalUserInfo();
      
      if (this.data.agreedToAuthorize && e.detail.userInfo) {
        // 同意授权且获取到用户信息
        const userInfo = e.detail.userInfo;
        console.log('用户信息:', userInfo);
        
        // 存储用户信息
        this.setData({ userInfo: userInfo });
        
        // 尝试从微信用户信息中获取性别并转换
        let gender = null;
        if (userInfo.gender === 1) {
          gender = 'male';
        } else if (userInfo.gender === 2) {
          gender = 'female';
        }
        
        console.log('从微信获取到的性别:', userInfo.gender, '转换后:', gender);
        
        if (gender) {
          // 获取到了性别，直接执行登录
          this.setData({ selectedGender: gender });
          this.confirmGender(localUserInfo?.phone); // 传递手机号
        } else {
          // 没有获取到性别，进入步骤2（选择性别）
          this.setData({ step: 2 });
        }
      } else if (this.data.agreedToAuthorize && !e.detail.userInfo) {
        // 同意授权但没获取到用户信息
        console.log('用户拒绝授权或获取失败');
        wx.showToast({
          title: '您拒绝了用户信息授权',
          icon: 'none',
          duration: 2000
        });
      } else {
        // 不同意授权：直接进入步骤2（选择性别）
        console.log('用户不同意授权，使用默认信息并进入选择性别步骤');
        this.setData({ step: 2 });
      }
    },
    
    // 选择性别
    selectGender: function(e) {
      const gender = e.currentTarget.dataset.gender;
      console.log('选择性别:', gender);
      this.setData({ selectedGender: gender });
    },
    
    // 确认性别并完成登录，或者直接从微信获取到性别后执行登录
    confirmGender: function(e) {
      console.log('=== 确认性别 ===');
      console.log('事件对象:', e);
      
      // 如果参数是事件对象，则忽略它
      let existingPhone = null;
      if (e && typeof e === 'object' && e.type === 'tap') {
        console.log('参数是事件对象，忽略它');
        existingPhone = null;
      } else if (e && typeof e === 'string') {
        existingPhone = e;
      }
      
      // 如果已经从微信获取到性别，直接使用
      let genderToUse = this.data.selectedGender;
      
      // 如果没有选中的性别，检查是否可以从userInfo中获取
      if (!genderToUse && this.data.userInfo && this.data.userInfo.gender !== undefined) {
        if (this.data.userInfo.gender === 1) {
          genderToUse = 'male';
        } else if (this.data.userInfo.gender === 2) {
          genderToUse = 'female';
        }
      }
      
      // 检查本地是否有已存储的手机号
      let phoneToUse = existingPhone;
      if (!phoneToUse) {
        const localUserInfo = this.checkLocalUserInfo();
        if (localUserInfo && localUserInfo.phone) {
          phoneToUse = localUserInfo.phone;
        }
      }
      
      console.log('使用的性别:', genderToUse, '使用的手机号:', phoneToUse);
      
      // 确保性别有值
      if (!genderToUse) {
        wx.showToast({
          title: '请选择性别',
          icon: 'none'
        });
        return;
      }
      
      // 显示加载中
      wx.showLoading({
        title: '登录中...',
        mask: true
      });
      
      // 获取微信登录凭证
      console.log('=== 调用wx.login ===');
      wx.login({
        success: function(loginRes) {
          console.log('=== wx.login 成功 ===');
          console.log('loginRes:', loginRes);
          
          if (loginRes.code) {
            console.log('登录凭证code:', loginRes.code);
            
            // 发送登录请求
            this.doLogin(loginRes.code, this.data.userInfo, genderToUse, phoneToUse);
          } else {
            wx.hideLoading();
            console.error('获取登录凭证失败');
            wx.showToast({
              title: '获取登录凭证失败',
              icon: 'none'
            });
          }
        }.bind(this),
        fail: function(err) {
          wx.hideLoading();
          console.error('=== wx.login 失败 ===', err);
          wx.showToast({
            title: '获取登录凭证失败',
            icon: 'none'
          });
        }
      });
    },
    
    // 执行登录请求
    doLogin: function(code, userInfo, gender, phone = null) {
      console.log('=== 执行登录请求 ===');
      console.log('code:', code);
      console.log('userInfo:', userInfo);
      console.log('gender:', gender);
      console.log('phone:', phone);
      
      const app = getApp();
      
      // 确定使用的性别
      let finalGender = gender;
      if (!finalGender && this.data.selectedGender) {
        finalGender = this.data.selectedGender;
      }
      
      console.log('最终使用的性别:', finalGender);
      
      // 使用改进后的authService.login方法
      authService.login(userInfo, finalGender, phone)
        .then((response) => {
          wx.hideLoading();
          console.log('=== 登录请求成功 ===');
          console.log('登录结果:', response);
          
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });
          
          // 检查是否需要填写手机号
          const user = response.user;
          if (!user.phone || user.phone.length < 11) {
            // 进入步骤3：填写手机号
            setTimeout(() => {
              this.setData({ step: 3 });
            }, 1000);
          } else {
            // 已有手机号，直接关闭登录框
            setTimeout(() => {
              this.triggerEvent('loginSuccess', { user: user });
              this.setData({ visible: false, step: 0 });
            }, 1000);
          }
        })
        .catch((err) => {
          wx.hideLoading();
          console.error('=== 登录请求失败 ===', err);
          wx.showToast({
            title: '登录失败，请稍后重试',
            icon: 'none'
          });
        });
    },
    
    // 输入手机号
    inputPhone: function(e) {
      const phone = e.detail.value;
      this.setData({ phone: phone });
    },
    
    // 确认手机号并更新用户信息
    confirmPhone: function() {
      console.log('=== 确认手机号 ===');
      console.log('手机号:', this.data.phone);
      
      // 验证手机号格式
      if (!this.data.phone || this.data.phone.length !== 11) {
        wx.showToast({
          title: '请输入正确的手机号',
          icon: 'none'
        });
        return;
      }
      
      // 显示加载中
      wx.showLoading({
        title: '更新信息中...',
        mask: true
      });
      
      // 重新执行登录，传递手机号（这样后端会正确关联手机号并更新openid）
      authService.login(this.data.userInfo, this.data.selectedGender, this.data.phone)
        .then((response) => {
          wx.hideLoading();
          console.log('=== 更新用户信息成功 ===');
          console.log('更新结果:', response);
          
          wx.showToast({
            title: '信息更新成功',
            icon: 'success'
          });
          
          // 关闭登录弹窗
          setTimeout(() => {
            this.triggerEvent('loginSuccess', { user: response.user });
            this.setData({ visible: false, step: 0 });
          }, 1000);
        })
        .catch((err) => {
          wx.hideLoading();
          console.error('=== 更新用户信息失败 ===', err);
          wx.showToast({
            title: '更新失败，请稍后重试',
            icon: 'none'
          });
        });
    }
  }
});
