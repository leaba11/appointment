Page({
  data: {
    version: '1.0.0',
    description: '商户预约系统是一个方便用户预约服务和排队的小程序，为用户提供便捷的服务体验。',
    features: [
      '在线预约服务',
      '实时排队取号',
      '服务项目浏览',
      '商户信息查询'
    ]
  },

  onLoad: function () {
  },

  // 返回上一页
  goBack: function () {
    wx.navigateBack();
  }
})