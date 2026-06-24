# 商户管理后台

## 项目简介

本项目是一款面向中小商户的预约、排队与服务记录管理系统的Web端管理后台，用于商户管理服务项目、员工、预约、排队和客户档案等信息。

## 功能模块

1. **登录/注册页**：商户登录和注册功能
2. **服务项目管理**：服务项目的列表、新增、编辑、删除
3. **员工管理**：员工的列表、新增、编辑
4. **预约看板**：日历视图，展示每天的预约订单
5. **排队墙**：实时展示排队队列，支持手动叫号、过号处理
6. **客户档案**：客户的列表、详情、历史订单
7. **数据统计**：仪表盘，展示核心业务指标

## 技术栈

- HTML5 + CSS3 + JavaScript
- Vue.js 3
- 响应式设计

## 项目结构

```
merchant-admin/
├── index.html       # 主页面
├── styles.css       # 样式文件
├── script.js        # 逻辑文件
└── README.md        # 项目说明
```

## 如何运行

1. 克隆本仓库到本地
2. 直接在浏览器中打开 `index.html` 文件
3. 登录页面默认无需账号密码，直接输入用户名点击登录即可

## API配置

项目中统一管理了API链接，位于 `script.js` 文件的 `API` 对象中：

```javascript
const API = {
  // 登录/注册
  login: '/api/auth/login',
  register: '/api/auth/register',
  
  // 服务项目
  services: '/api/services',
  service: (id) => `/api/services/${id}`,
  
  // 员工
  staff: '/api/staff',
  staffDetail: (id) => `/api/staff/${id}`,
  
  // 预约
  appointments: '/api/appointments',
  appointment: (id) => `/api/appointments/${id}`,
  
  // 排队
  queue: '/api/queue',
  callNext: '/api/queue/call-next',
  skipNumber: '/api/queue/skip',
  
  // 客户
  customers: '/api/customers',
  customerDetail: (id) => `/api/customers/${id}`,
  
  // 数据统计
  stats: '/api/stats'
};
```

## 模拟数据

项目中使用了模拟数据，包括：

- 服务项目列表
- 员工列表
- 预约记录
- 排队信息
- 客户档案
- 数据统计

在实际项目中，这些数据应该从后端API获取。

## 注意事项

- 本项目为前端演示版本，实际使用时需要对接后端服务
- 登录功能为模拟实现，实际项目中需要进行真实的身份验证
- 所有操作均基于前端模拟数据，刷新页面后数据会重置

## 后续优化方向

1. 对接后端API，实现真实数据交互
2. 添加用户权限管理
3. 优化UI界面，提升用户体验
4. 添加更多功能，如数据导出、报表生成等
5. 实现多商户支持
