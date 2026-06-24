# 微信小程序商户预约排队系统

## 项目简介

本项目是一套完整的商户预约与排队管理系统，包含三个主要部分：

1. **微信小程序客户端** - 面向消费者的服务预约与排队取号工具
2. **商户管理后台** - 面向商家的多维度数据管理与业务运营平台
3. **后端API服务** - 提供数据存储、业务逻辑处理和接口服务

该系统适用于理发店、美容院、医疗机构、政务大厅等需要预约排队的服务场景。

---

## 功能特性

### 微信小程序端

| 功能模块 | 说明 |
|----------|------|
| 用户登录 | 支持微信一键登录，自动获取用户信息 |
| 服务浏览 | 展示服务项目列表，包含名称、价格、时长、描述 |
| 服务预约 | 选择服务、员工、预约日期和时间，完成在线预约 |
| 排队取号 | 无需预约时可直接取号排队，支持实时查看排队进度 |
| 预约管理 | 查看、取消已预约项目 |
| 排队查询 | 查看当前排队号码、预计等待时间、前面等待人数 |
| 评分反馈 | 服务完成后可对员工进行多维度评分 |
| 个人中心 | 查看个人信息、预约记录、排队历史 |

### 商户管理后台

| 功能模块 | 说明 |
|----------|------|
| 仪表盘 | 今日数据概览（营收、预约、排队、等待情况） |
| 预约看板 | 日历视图展示预约数据，支持完成、取消操作 |
| 排队管理 | 叫号、加急、跳过、完成、取消等排队控制 |
| 员工管理 | 员工信息维护、状态切换（在职/离职）、评分查看 |
| 服务管理 | 服务项目CRUD、价格调整、服务时长设置 |
| 客户档案 | 客户信息管理、消费记录、预约分布统计 |
| 营收统计 | 实时营收数据、日月年统计、服务分类占比 |
| 管理员管理 | 账户管理、密码安全（bcrypt加密） |

---

## 技术架构

### 整体架构

```
┌─────────────────┐     HTTP/REST      ┌─────────────────┐
│   微信小程序    │ ◄───────────────► │   后端API服务   │
│   (客户端)      │                    │   (Node.js)     │
└─────────────────┘                    └────────┬────────┘
                                                 │
                                          MySQL数据库
                                                 │
┌─────────────────┐                    ┌────────┴────────┐
│  管理后台(H5)   │ ◄───────────────► │   Express路由    │
│   (Vue.js)      │                    │                  │
└─────────────────┘                    └─────────────────┘
```

### 技术栈

#### 后端

| 技术 | 说明 | 版本 |
|------|------|------|
| Node.js | JavaScript运行时 | v14+ |
| Express | Web应用框架 | 4.x |
| MySQL | 关系型数据库 | 8.0+ |
| mysql2 | MySQL客户端（支持Promise） | 3.x |
| JWT | Token认证 | jsonwebtoken |
| bcrypt | 密码加密 | bcryptjs |
| dotenv | 环境变量管理 | - |

#### 前端

| 技术 | 说明 |
|------|------|
| Vue.js 3 | 渐进式JavaScript框架 |
| 原生HTML/CSS/JS | 管理后台核心 |
| 微信小程序框架 | WXML/WXSS/JS |

#### 开发工具

| 工具 | 说明 |
|------|------|
| 微信开发者工具 | 小程序开发调试 |
| VS Code | 代码编辑 |
| Navicat/DBeaver | 数据库管理 |

---

## 项目结构

```
wechattool/
├── database/                    # 数据库相关
│   ├── schema.sql              # 数据库表结构定义
│   ├── ER_diagram.md           # ER关系图
│   └── update_rating_table.sql # 评分表更新脚本
│
├── server/                      # 后端服务
│   ├── app.js                  # 主入口文件
│   ├── routes/                 # 路由模块
│   │   ├── auth.js             # 认证接口
│   │   ├── appointments.js     # 预约管理
│   │   ├── queue.js            # 排队管理
│   │   ├── services.js         # 服务管理
│   │   ├── staff.js            # 员工管理
│   │   ├── stats.js            # 统计分析
│   │   ├── merchant.js         # 商户信息
│   │   └── admin.js            # 管理员管理
│   ├── middleware/              # 中间件
│   │   └── auth.js             # JWT认证中间件
│   ├── .env                    # 环境变量配置
│   └── package.json
│
├── merchant-admin/              # 商户管理后台
│   ├── index.html              # 主页面
│   ├── styles.css              # 全局样式
│   ├── js/                     # JavaScript模块
│   │   ├── api/               # API调用封装
│   │   │   ├── auth.js         # 认证API
│   │   │   ├── appointments.js  # 预约API
│   │   │   ├── queue.js         # 排队API
│   │   │   ├── services.js      # 服务API
│   │   │   ├── staff.js         # 员工API
│   │   │   ├── customers.js     # 客户API
│   │   │   └── stats.js         # 统计API
│   │   ├── modules/            # 功能模块
│   │   │   ├── auth.js          # 认证模块
│   │   │   ├── appointments.js  # 预约模块
│   │   │   ├── queue.js         # 排队模块
│   │   │   ├── staff.js         # 员工模块
│   │   │   ├── services.js      # 服务模块
│   │   │   ├── customers.js     # 客户模块
│   │   │   ├── dashboard.js     # 仪表盘模块
│   │   │   └── ratings.js       # 评分模块
│   │   ├── utils/              # 工具函数
│   │   │   ├── date.js          # 日期处理
│   │   │   └── format.js        # 格式化工具
│   │   ├── app.js              # Vue应用入口
│   │   ├── app-modular.js      # 模块化应用逻辑
│   │   └── main.js             # 工具函数入口
│   ├── project.config.json     # 项目配置
│   └── README.md
│
├── merchant-appointment-system/  # 微信小程序
│   ├── app.js                  # 小程序入口
│   ├── app.json                # 全局配置
│   ├── app.wxss                # 全局样式
│   ├── pages/                  # 页面目录
│   │   ├── index/              # 首页（服务列表）
│   │   ├── queue/              # 排队页面
│   │   ├── login/              # 登录页面
│   │   ├── profile/            # 个人中心
│   │   ├── appointment-confirm/ # 预约确认
│   │   ├── appointment-detail/  # 预约详情
│   │   ├── service-detail/      # 服务详情
│   │   ├── user-setting/        # 用户设置
│   │   ├── settings/            # 系统设置
│   │   └── about/               # 关于我们
│   ├── components/              # 组件目录
│   │   └── login-modal/         # 登录弹窗组件
│   ├── utils/                   # 工具函数
│   │   ├── auth-service.js      # 认证服务
│   │   └── login.js             # 登录工具
│   ├── images/                  # 图片资源
│   └── project.config.json      # 项目配置
│
├── docs/                        # 文档目录
│   ├── README.md                # 项目说明文档
│   ├── 小程序端实现说明.md       # 小程序开发文档
│   └── 管理后台实现说明.md       # 后台开发文档
│
├── init-db.js                   # 数据库初始化脚本
├── migrate-admin-passwords.js   # 密码迁移工具
└── start.ps1                    # 启动脚本（PowerShell）
```

---

## 环境要求

### 运行环境

| 环境 | 版本要求 |
|------|----------|
| Node.js | 14.x 或更高 |
| MySQL | 8.0 或更高 |
| 微信开发者工具 | 最新版本 |

### 硬件要求

- 内存：最低 2GB，推荐 4GB+
- 硬盘：至少 1GB 可用空间
- 网络：稳定的互联网连接

---

## 安装部署

### 1. 克隆项目

```bash
git clone <repository_url>
cd wechattool
```

### 2. 配置数据库

#### 创建数据库

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS wechat_manage DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

#### 导入表结构

```bash
mysql -u root -p wechat_manage < database/schema.sql
```

### 3. 配置后端服务

#### 安装依赖

```bash
cd server
npm install
```

#### 配置环境变量

编辑 `server/.env` 文件：

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=wechat_manage
JWT_SECRET=your_jwt_secret_key
```

### 4. 启动服务

#### 方式一：使用启动脚本

```powershell
.\start.ps1
```

#### 方式二：手动启动

```bash
cd server
npm start
```

服务启动后访问：
- 本地地址：http://localhost:3000
- 局域网地址：http://<your_ip>:3000

### 5. 初始化数据库（如需要）

```bash
node init-db.js
```

### 6. 导入微信小程序

1. 打开微信开发者工具
2. 导入项目，选择 `merchant-appointment-system` 文件夹
3. 填写 AppID（使用测试号或正式AppID）
4. 完成导入

---

## 数据库设计

### 主要数据表

#### users（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| openid | VARCHAR(100) | 微信openid |
| nickName | VARCHAR(100) | 昵称 |
| avatarUrl | VARCHAR(255) | 头像URL |
| phone | VARCHAR(20) | 手机号 |
| gender | VARCHAR(10) | 性别 |
| created_at | TIMESTAMP | 创建时间 |

#### appointments（预约表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| user_id | INT | 用户ID |
| service_id | INT | 服务ID |
| staff_id | INT | 员工ID |
| appointment_date | DATE | 预约日期 |
| appointment_time | TIME | 预约时间 |
| customer_name | VARCHAR(100) | 客户姓名 |
| customer_phone | VARCHAR(20) | 客户电话 |
| remark | TEXT | 备注 |
| status | ENUM | 状态：pending/confirmed/cancelled/completed |

#### queue_records（排队记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| queue_number | INT | 排队号码 |
| user_id | INT | 用户ID |
| service_id | INT | 服务ID |
| customer_name | VARCHAR(100) | 客户姓名 |
| status | ENUM | 状态：waiting/called/skipped/completed/cancelled |
| created_at | TIMESTAMP | 取号时间 |
| called_at | TIMESTAMP | 叫号时间 |

#### services（服务项目表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| name | VARCHAR(100) | 服务名称 |
| price | DECIMAL(10,2) | 价格 |
| duration | INT | 时长（分钟） |
| description | TEXT | 描述 |
| is_active | TINYINT | 是否启用 |

#### staff（员工表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| name | VARCHAR(100) | 姓名 |
| avatar | VARCHAR(255) | 头像URL |
| specialty | VARCHAR(255) | 专长 |
| rating | DECIMAL(2,1) | 评分（1-5） |
| is_active | TININT | 是否在职 |

#### staff_ratings（员工评分表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| staff_id | INT | 员工ID |
| appointment_id | INT | 预约ID |
| service_attitude | INT | 服务态度（1-5） |
| technical_skill | INT | 技术水平（1-5） |
| communication | INT | 沟通能力（1-5） |
| total_rating | DECIMAL(3,2) | 综合评分 |
| comment | TEXT | 评价内容 |
| created_at | TIMESTAMP | 评价时间 |

#### admins（管理员表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| username | VARCHAR(100) | 用户名（唯一） |
| password | VARCHAR(255) | 密码（bcrypt加密） |
| role | ENUM | 角色：admin/staff |
| is_active | TINYINT | 是否启用 |

---

## API接口说明

### 认证相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/login` | POST | 微信登录，获取Token |
| `/api/auth/userinfo` | GET | 获取用户信息 |
| `/api/admin/login` | POST | 管理员登录 |
| `/api/admin/create` | POST | 创建管理员账户 |

### 预约相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/appointments` | GET | 获取预约列表 |
| `/api/appointments` | POST | 创建预约 |
| `/api/appointments/:id` | PUT | 更新预约 |
| `/api/appointments/:id/status` | PUT | 更新预约状态 |
| `/api/appointments/:id/complete` | POST | 完成预约 |

### 排队相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/queue` | GET | 获取排队状态 |
| `/api/queue/take-number` | POST | 取号 |
| `/api/queue/call-next` | POST | 叫号 |
| `/api/queue/skip` | POST | 跳过当前号码 |
| `/api/queue/cancel` | POST | 取消排队 |
| `/api/queue/complete-service` | POST | 完成服务 |

### 服务与员工

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/services` | GET | 获取服务列表 |
| `/api/staff` | GET | 获取员工列表 |
| `/api/staff/:id` | GET | 获取员工详情 |

### 统计分析

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/stats` | GET | 获取统计数据 |
| `/api/stats/revenue` | GET | 获取营收记录 |
| `/api/stats/customers` | GET | 获取客户列表 |
| `/api/stats/appointments/distribution` | GET | 预约时段分布 |

### 评分相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/staff/:id/rating` | POST | 提交评分 |
| `/api/staff/:id/ratings` | GET | 获取员工评分列表 |

---

## 核心业务流程

### 预约流程

```
用户选择服务
    ↓
选择服务人员
    ↓
选择预约日期和时间
    ↓
确认预约信息
    ↓
提交预约 → 创建appointments记录
    ↓
预约成功 → 发送确认通知
```

### 排队流程

```
用户点击取号
    ↓
系统检查工作时间
    ↓
检查是否已有等待中的号码
    ↓
生成新号码（当日递增）
    ↓
创建queue_records记录
    ↓
返回号码和预计等待时间
    ↓
管理员叫号（call-next）
    ↓
用户到店接受服务
    ↓
管理员完成服务（complete-service）
    ↓
记录营收（revenue_records）
    ↓
用户评分（可选）
```

### 每日重置机制

- 每日凌晨（或首次请求时）自动检查
- 将前一天未完成的排队状态标记为已取消
- 排队号码重置为1
- 更新重置时间戳

---

## 默认账户

### 管理员账户

| 用户名 | 密码 | 说明 |
|--------|------|------|
| admin | admin123 | 系统管理员 |

### 测试数据

系统初始化时会插入以下示例数据：

| 数据类型 | 内容 |
|----------|------|
| 商户 | 示例商户 |
| 服务 | 理发(38元)、烫发(188元)、染发(168元)、护理(88元) |
| 员工 | 张三、李四、王五 |

---

## 常见问题

### Q1: 数据库连接失败？

检查以下配置：
1. MySQL服务是否启动
2. 端口号是否正确（默认3306）
3. 用户名密码是否正确
4. 数据库是否已创建

### Q2: 小程序无法访问后端接口？

1. 开发阶段：在微信开发者工具中勾选"不校验合法域名"
2. 生产环境：在微信公众平台配置服务器域名

### Q3: 管理员无法登录？

1. 确认用户名密码是否正确
2. 检查admin账户是否存在
3. 可使用 `node init-db.js` 重新初始化数据库

### Q4: 排队号码重复？

当前实现存在并发安全隐患，建议添加以下优化：
1. 添加唯一约束：`ALTER TABLE queue_records ADD UNIQUE KEY (DATE(created_at), queue_number);`
2. 使用事务 + 悲观锁处理并发取号

### Q5: 预约状态没有自动更新？

当前系统采用动态状态计算（查询时根据时间判断），如需定时更新，可添加定时任务。

---

## 开发指南

### 添加新功能

1. **后端接口**：在 `server/routes/` 中添加新路由文件
2. **前端API**：在 `merchant-admin/js/api/` 中添加API封装
3. **前端模块**：在 `merchant-admin/js/modules/` 中添加业务逻辑
4. **UI界面**：在 `merchant-admin/index.html` 中添加页面结构
5. **数据库**：如有需要，在 `database/schema.sql` 中添加新表

### 代码规范

- 使用ES6+语法
- 异步操作使用 async/await
- 数据库操作使用 prepared statements（防止SQL注入）
- 敏感信息使用环境变量管理

### 测试建议

1. 使用Postman或curl测试API接口
2. 使用微信开发者工具的调试器检查小程序
3. 浏览器开发者工具检查管理后台网络请求

---

## 性能优化建议

### 数据库优化

1. 为常用查询字段添加索引
2. 使用连接池管理数据库连接
3. 对大表进行分页查询

### 后端优化

1. 使用缓存减少数据库查询
2. 对静态资源启用Gzip压缩
3. 使用负载均衡支持高并发

### 前端优化

1. 图片资源进行压缩和懒加载
2. 对列表数据进行虚拟滚动
3. 使用本地缓存减少接口请求

---

## 安全建议

1. **密码安全**：使用bcrypt加密存储密码
2. **JWT安全**：设置合理的Token过期时间
3. **SQL注入**：使用参数化查询
4. **XSS防护**：对用户输入进行转义
5. **CORS配置**：生产环境限制允许的来源

---

## 项目贡献

欢迎提交Issue和Pull Request！

---

## 许可证

MIT License

---

## 联系方式

如有问题，请通过以下方式联系：

- 提交Issue
- 发送邮件至项目维护者

---

*最后更新：2026年6月*
