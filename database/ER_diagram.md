# 商户预约管理系统 E-R 图设计

**文档版本**: v2.0
**生成日期**: 2026-05-30
**说明**: 基于 schema.sql 和 update_rating_table.sql 数据库设计文档

---

## 1. 数据库概述

**数据库名称**: wechat_manage
**字符集**: utf8mb4
**排序规则**: utf8mb4_unicode_ci
**存储引擎**: InnoDB

---

## 2. 实体清单

本系统共包含 9 个数据实体，分别是：

1. USERS - 用户表
2. MERCHANT - 商户信息表
3. SERVICES - 服务项目表
4. STAFF - 员工表
5. APPOINTMENTS - 预约记录表
6. QUEUE - 队列表
7. QUEUE_RECORDS - 排队记录表
8. ADMINS - 管理员表
9. STAFF_RATINGS - 员工评分表

---

## 3. 实体属性详情

### 3.1 用户表 (USERS)

| 序号 | 字段名 | 数据类型 | 约束 | 注释 |
|------|--------|----------|------|------|
| 1 | id | INT | 主键 AUTO_INCREMENT | 用户ID |
| 2 | openid | VARCHAR(100) | 唯一约束 非空 | 微信openid |
| 3 | nickName | VARCHAR(100) | 默认NULL | 昵称 |
| 4 | avatarUrl | VARCHAR(255) | 默认NULL | 头像URL |
| 5 | phone | VARCHAR(20) | 默认NULL | 手机号 |
| 6 | gender | VARCHAR(10) | 默认NULL | 性别 |
| 7 | created_at | TIMESTAMP | 默认当前时间 | 创建时间 |
| 8 | updated_at | TIMESTAMP | 自动更新 | 更新时间 |

### 3.2 商户信息表 (MERCHANT)

| 序号 | 字段名 | 数据类型 | 约束 | 注释 |
|------|--------|----------|------|------|
| 1 | id | INT | 主键 AUTO_INCREMENT | 商户ID |
| 2 | name | VARCHAR(100) | 非空 | 商户名称 |
| 3 | address | VARCHAR(255) | 默认NULL | 地址 |
| 4 | phone | VARCHAR(20) | 默认NULL | 联系电话 |
| 5 | description | TEXT | 默认NULL | 商户描述 |
| 6 | created_at | TIMESTAMP | 默认当前时间 | 创建时间 |
| 7 | updated_at | TIMESTAMP | 自动更新 | 更新时间 |

### 3.3 服务项目表 (SERVICES)

| 序号 | 字段名 | 数据类型 | 约束 | 注释 |
|------|--------|----------|------|------|
| 1 | id | INT | 主键 AUTO_INCREMENT | 服务ID |
| 2 | name | VARCHAR(100) | 非空 | 服务名称 |
| 3 | price | DECIMAL(10,2) | 非空 | 价格 |
| 4 | duration | INT | 非空 | 时长（分钟） |
| 5 | description | TEXT | 默认NULL | 服务描述 |
| 6 | is_active | TINYINT(1) | 默认1 | 是否启用 |
| 7 | created_at | TIMESTAMP | 默认当前时间 | 创建时间 |
| 8 | updated_at | TIMESTAMP | 自动更新 | 更新时间 |

### 3.4 员工表 (STAFF)

| 序号 | 字段名 | 数据类型 | 约束 | 注释 |
|------|--------|----------|------|------|
| 1 | id | INT | 主键 AUTO_INCREMENT | 员工ID |
| 2 | name | VARCHAR(100) | 非空 | 姓名 |
| 3 | avatar | VARCHAR(255) | 默认NULL | 头像URL |
| 4 | specialty | VARCHAR(255) | 默认NULL | 专长 |
| 5 | rating | DECIMAL(2,1) | 默认5.0 | 评分 |
| 6 | is_active | TINYINT(1) | 默认1 | 是否在职 |
| 7 | created_at | TIMESTAMP | 默认当前时间 | 创建时间 |
| 8 | updated_at | TIMESTAMP | 自动更新 | 更新时间 |

### 3.5 预约记录表 (APPOINTMENTS)

| 序号 | 字段名 | 数据类型 | 约束 | 注释 |
|------|--------|----------|------|------|
| 1 | id | INT | 主键 AUTO_INCREMENT | 预约ID |
| 2 | user_id | INT | 外键 非空 | 用户ID |
| 3 | service_id | INT | 外键 非空 | 服务ID |
| 4 | staff_id | INT | 外键 非空 | 员工ID |
| 5 | appointment_date | DATE | 非空 | 预约日期 |
| 6 | appointment_time | TIME | 非空 | 预约时间 |
| 7 | customer_name | VARCHAR(100) | 默认NULL | 客户姓名 |
| 8 | customer_phone | VARCHAR(20) | 默认NULL | 客户电话 |
| 9 | remark | TEXT | 默认NULL | 备注 |
| 10 | status | ENUM | 默认pending | 状态 |
| 11 | created_at | TIMESTAMP | 默认当前时间 | 创建时间 |
| 12 | updated_at | TIMESTAMP | 自动更新 | 更新时间 |

**状态枚举值**: pending（待确认）、confirmed（已确认）、cancelled（已取消）、completed（已完成）

### 3.6 队列表 (QUEUE)

| 序号 | 字段名 | 数据类型 | 约束 | 注释 |
|------|--------|----------|------|------|
| 1 | id | INT | 主键 AUTO_INCREMENT | 队列ID |
| 2 | current_number | INT | 默认0 | 当前号码 |
| 3 | estimated_wait_time | INT | 默认0 | 预计等待时间（分钟） |
| 4 | last_reset | TIMESTAMP | 默认当前时间 | 上次重置时间 |
| 5 | updated_at | TIMESTAMP | 自动更新 | 更新时间 |

### 3.7 排队记录表 (QUEUE_RECORDS)

| 序号 | 字段名 | 数据类型 | 约束 | 注释 |
|------|--------|----------|------|------|
| 1 | id | INT | 主键 AUTO_INCREMENT | 记录ID |
| 2 | queue_number | INT | 非空 | 排队号码 |
| 3 | user_id | INT | 外键 默认NULL | 用户ID |
| 4 | customer_name | VARCHAR(100) | 默认NULL | 客户姓名 |
| 5 | status | ENUM | 默认waiting | 状态 |
| 6 | created_at | TIMESTAMP | 默认当前时间 | 取号时间 |
| 7 | called_at | TIMESTAMP | 默认NULL | 叫号时间 |

**状态枚举值**: waiting（等待中）、called（已叫号）、skipped（已过号）、completed（已完成）、cancelled（已取消）

### 3.8 管理员表 (ADMINS)

| 序号 | 字段名 | 数据类型 | 约束 | 注释 |
|------|--------|----------|------|------|
| 1 | id | INT | 主键 AUTO_INCREMENT | 管理员ID |
| 2 | username | VARCHAR(100) | 唯一约束 非空 | 用户名 |
| 3 | password | VARCHAR(255) | 非空 | 密码 |
| 4 | role | ENUM | 默认admin | 角色 |
| 5 | is_active | TINYINT(1) | 默认1 | 是否启用 |
| 6 | created_at | TIMESTAMP | 默认当前时间 | 创建时间 |
| 7 | updated_at | TIMESTAMP | 自动更新 | 更新时间 |

**角色枚举值**: admin（系统管理员）、staff（员工管理员）

### 3.9 员工评分表 (STAFF_RATINGS)

| 序号 | 字段名 | 数据类型 | 约束 | 注释 |
|------|--------|----------|------|------|
| 1 | id | INT | 主键 AUTO_INCREMENT | 评分ID |
| 2 | staff_id | INT | 外键 非空 | 员工ID |
| 3 | appointment_id | INT | 外键 唯一约束 非空 | 预约ID |
| 4 | service_attitude | INT | 非空 | 服务态度评分（1-5） |
| 5 | technical_skill | INT | 非空 | 技术水平评分（1-5） |
| 6 | communication | INT | 非空 | 沟通能力评分（1-5） |
| 7 | total_rating | DECIMAL(3,2) | 非空 | 综合评分 |
| 8 | comment | TEXT | 默认NULL | 评价内容 |
| 9 | created_at | TIMESTAMP | 默认当前时间 | 评价时间 |

---

## 4. 关系连接图（中文文字描述）

### 4.1 用户预约子系统关系

```
【用户】与【预约记录】的关系

关系类型：一对多关系

左侧实体：USERS（用户表）
  主键：id（用户ID）

右侧实体：APPOINTMENTS（预约记录表）
  外键：user_id（用户ID）

关系描述：
一个用户可以拥有多条预约记录，而每条预约记录只能属于一个用户。

外键约束：APPOINTMENTS表的user_id字段引用USERS表的id字段
删除规则：当用户被删除时，其相关的预约记录也会被级联删除（ON DELETE CASCADE）

关系表达式：
USERS (1) : APPOINTMENTS (N)
表示法：USERS中的一个用户对应APPOINTMENTS中的多条记录
```

### 4.2 用户排队子系统关系

```
【用户】与【排队记录】的关系

关系类型：一对多关系（外键可为空）

左侧实体：USERS（用户表）
  主键：id（用户ID）

右侧实体：QUEUE_RECORDS（排队记录表）
  外键：user_id（用户ID，可为空）

关系描述：
一个用户可以拥有多条排队记录，每条排队记录可以关联一个用户，也可以不关联（支持匿名取号）。

外键约束：QUEUE_RECORDS表的user_id字段引用USERS表的id字段
删除规则：当用户被删除时，排队记录中的用户ID会被设置为NULL（ON DELETE SET NULL）

关系表达式：
USERS (1) : QUEUE_RECORDS (N)
表示法：USERS中的一个用户对应QUEUE_RECORDS中的多条记录
```

### 4.3 预约服务子系统关系

```
【服务项目】与【预约记录】的关系

关系类型：一对多关系

左侧实体：SERVICES（服务项目表）
  主键：id（服务ID）

右侧实体：APPOINTMENTS（预约记录表）
  外键：service_id（服务ID）

关系描述：
一个服务项目可以被多个用户预约，每条预约记录对应一个具体的服务项目。

外键约束：APPOINTMENTS表的service_id字段引用SERVICES表的id字段
删除规则：当服务项目被删除时，其相关的预约记录也会被级联删除（ON DELETE CASCADE）

关系表达式：
SERVICES (1) : APPOINTMENTS (N)
表示法：SERVICES中的一个服务项目对应APPOINTMENTS中的多条记录
```

### 4.4 员工预约子系统关系

```
【员工】与【预约记录】的关系

关系类型：一对多关系

左侧实体：STAFF（员工表）
  主键：id（员工ID）

右侧实体：APPOINTMENTS（预约记录表）
  外键：staff_id（员工ID）

关系描述：
一个员工可以接收多个用户的预约服务，每条预约记录对应一个具体的员工。

外键约束：APPOINTMENTS表的staff_id字段引用STAFF表的id字段
删除规则：当员工被删除时，其相关的预约记录也会被级联删除（ON DELETE CASCADE）

关系表达式：
STAFF (1) : APPOINTMENTS (N)
表示法：STAFF中的一个员工对应APPOINTMENTS中的多条记录
```

### 4.5 队列排队子系统关系

```
【队列】与【排队记录】的关系

关系类型：一对多关系

左侧实体：QUEUE（队列表）
  主键：id（队列ID）

右侧实体：QUEUE_RECORDS（排队记录表）
  关联字段：queue_number（排队号码）

关系描述：
一个队列可以包含多条排队记录，每条排队记录都属于当前队列的管理范围。
系统通过last_reset字段实现每日排队号码的自动重置功能。

特殊机制：
队列每日重置：当系统检测到last_reset日期与当前日期不同时，
自动将current_number重置为1，并取消所有状态为waiting的排队记录。

关系表达式：
QUEUE (1) : QUEUE_RECORDS (N)
表示法：QUEUE中的一个队列对应QUEUE_RECORDS中的多条记录
```

### 4.6 员工评分子系统关系

```
【员工】与【员工评分】的关系

关系类型：一对多关系

左侧实体：STAFF（员工表）
  主键：id（员工ID）

右侧实体：STAFF_RATINGS（员工评分表）
  外键：staff_id（员工ID）

关系描述：
一个员工可以接收多个用户的好评，每条评分记录对应一个被评价的员工。

外键约束：STAFF_RATINGS表的staff_id字段引用STAFF表的id字段
删除规则：当员工被删除时，其相关的评分记录也会被级联删除（ON DELETE CASCADE）

关系表达式：
STAFF (1) : STAFF_RATINGS (N)
表示法：STAFF中的一个员工对应STAFF_RATINGS中的多条记录
```

### 4.7 预约评分子系统关系

```
【预约记录】与【员工评分】的关系

关系类型：一对一关系

左侧实体：APPOINTMENTS（预约记录表）
  主键：id（预约ID）

右侧实体：STAFF_RATINGS（员工评分表）
  外键：appointment_id（预约ID，唯一约束）

关系描述：
一个预约只能产生一条评分记录，每条评分记录唯一对应一个预约。
这种一对一关系确保了每个预约只能被评价一次。

外键约束：STAFF_RATINGS表的appointment_id字段引用APPOINTMENTS表的id字段
删除规则：当预约被删除时，其相关的评分记录也会被级联删除（ON DELETE CASCADE）
唯一约束：appointment_id字段具有唯一索引，防止重复评价

关系表达式：
APPOINTMENTS (1) : STAFF_RATINGS (1)
表示法：APPOINTMENTS中的一个预约对应STAFF_RATINGS中的一条记录
```

### 4.8 管理员管理子系统关系

```
【管理员】与【服务项目】的管理关系

关系类型：一对多管理关系

左侧实体：ADMINS（管理员表）
  主键：id（管理员ID）

右侧实体：SERVICES（服务项目表）
  管理关系：管理员对服务项目具有添加、修改、删除的权限

关系描述：
一个管理员可以管理多个服务项目，包括添加新服务、修改服务信息、删除服务等操作。
这种管理关系不通过外键约束实现，而是在业务逻辑层面进行权限控制。

业务规则：
管理员对服务项目拥有完全的CRUD（创建、读取、更新、删除）权限。

关系表达式：
ADMINS (1) : SERVICES (N)
表示法：ADMINS中的一个管理员对应SERVICES中的多个服务项目
```

### 4.9 管理员员工管理子系统关系

```
【管理员】与【员工】的管理关系

关系类型：一对多管理关系

左侧实体：ADMINS（管理员表）
  主键：id（管理员ID）

右侧实体：STAFF（员工表）
  管理关系：管理员对员工具有添加、修改、删除的权限

关系描述：
一个管理员可以管理多个员工，包括添加新员工、修改员工信息、管理员工在职状态等操作。
这种管理关系不通过外键约束实现，而是在业务逻辑层面进行权限控制。

业务规则：
管理员对员工拥有完全的CRUD（创建、读取、更新、删除）权限。

关系表达式：
ADMINS (1) : STAFF (N)
表示法：ADMINS中的一个管理员对应STAFF中的多个员工
```

---

## 5. 关系连接图汇总表

| 序号 | 左侧实体 | 关系类型 | 右侧实体 | 关联方式 | 说明 |
|------|----------|----------|----------|----------|------|
| 1 | USERS | 一对多 (1:N) | APPOINTMENTS | user_id外键 | 用户拥有多条预约记录 |
| 2 | USERS | 一对多 (1:N) | QUEUE_RECORDS | user_id外键（可为空） | 用户拥有多条排队记录（支持匿名） |
| 3 | SERVICES | 一对多 (1:N) | APPOINTMENTS | service_id外键 | 服务项目被多次预约 |
| 4 | STAFF | 一对多 (1:N) | APPOINTMENTS | staff_id外键 | 员工接收多个预约 |
| 5 | QUEUE | 一对多 (1:N) | QUEUE_RECORDS | queue_number关联 | 队列包含多条排队记录 |
| 6 | STAFF | 一对多 (1:N) | STAFF_RATINGS | staff_id外键 | 员工接收多个评分 |
| 7 | APPOINTMENTS | 一对一 (1:1) | STAFF_RATINGS | appointment_id外键（唯一） | 预约产生唯一评分 |
| 8 | ADMINS | 一对多 (1:N) | SERVICES | 业务管理 | 管理员管理服务项目 |
| 9 | ADMINS | 一对多 (1:N) | STAFF | 业务管理 | 管理员管理员工 |

---

## 6. 完整性约束

### 6.1 主键约束 (PK)

| 序号 | 实体名称 | 主键字段 | 约束类型 |
|------|----------|----------|----------|
| 1 | USERS | id | 主键 AUTO_INCREMENT |
| 2 | MERCHANT | id | 主键 AUTO_INCREMENT |
| 3 | SERVICES | id | 主键 AUTO_INCREMENT |
| 4 | STAFF | id | 主键 AUTO_INCREMENT |
| 5 | APPOINTMENTS | id | 主键 AUTO_INCREMENT |
| 6 | QUEUE | id | 主键 AUTO_INCREMENT |
| 7 | QUEUE_RECORDS | id | 主键 AUTO_INCREMENT |
| 8 | ADMINS | id | 主键 AUTO_INCREMENT |
| 9 | STAFF_RATINGS | id | 主键 AUTO_INCREMENT |

### 6.2 唯一约束 (UK)

| 序号 | 实体名称 | 字段名称 | 约束类型 | 说明 |
|------|----------|----------|----------|------|
| 1 | USERS | openid | 唯一约束 | 微信用户唯一标识 |
| 2 | ADMINS | username | 唯一约束 | 管理员用户名唯一 |
| 3 | STAFF_RATINGS | appointment_id | 唯一约束 | 确保每个预约只能评价一次 |

### 6.3 外键约束 (FK)

| 序号 | 子表名称 | 外键字段 | 父表名称 | 被引用字段 | 删除规则 |
|------|----------|----------|----------|------------|----------|
| 1 | APPOINTMENTS | user_id | USERS | id | ON DELETE CASCADE |
| 2 | APPOINTMENTS | service_id | SERVICES | id | ON DELETE CASCADE |
| 3 | APPOINTMENTS | staff_id | STAFF | id | ON DELETE CASCADE |
| 4 | QUEUE_RECORDS | user_id | USERS | id | ON DELETE SET NULL |
| 5 | STAFF_RATINGS | staff_id | STAFF | id | ON DELETE CASCADE |
| 6 | STAFF_RATINGS | appointment_id | APPOINTMENTS | id | ON DELETE CASCADE |

### 6.4 业务规则约束

| 序号 | 实体名称 | 字段名称 | 约束条件 | 说明 |
|------|----------|----------|----------|------|
| 1 | SERVICES | price | 大于0 | 服务价格必须为正数 |
| 2 | SERVICES | duration | 大于0 | 服务时长必须为正数 |
| 3 | STAFF | rating | 介于1.0至5.0之间 | 员工评分范围 |
| 4 | STAFF_RATINGS | service_attitude | 介于1至5之间 | 服务态度评分范围 |
| 5 | STAFF_RATINGS | technical_skill | 介于1至5之间 | 技术水平评分范围 |
| 6 | STAFF_RATINGS | communication | 介于1至5之间 | 沟通能力评分范围 |
| 7 | QUEUE | current_number | 大于等于0 | 当前号码不能为负数 |

---

## 7. 数据库索引设计

| 序号 | 表名称 | 索引名称 | 索引字段 | 类型 | 说明 |
|------|--------|----------|----------|------|------|
| 1 | appointments | idx_appointments_user_id | user_id | 普通索引 | 加速用户预约查询 |
| 2 | appointments | idx_appointments_date | appointment_date | 普通索引 | 加速日期范围查询 |
| 3 | appointments | idx_appointments_status | status | 普通索引 | 加速状态筛选 |
| 4 | queue_records | idx_queue_records_status | status | 普通索引 | 加速排队状态查询 |
| 5 | users | idx_users_openid | openid | 普通索引（已含于UK） | 加速微信登录查询 |

---

## 8. 状态流转说明

### 8.1 预约状态流转

```
预约状态：pending（待确认）

流转方向：
  方向一：pending → confirmed → completed
          （待确认 → 已确认 → 已完成）
          
  方向二：pending → cancelled
          （待确认 → 已取消）
          
  方向三：confirmed → cancelled
          （已确认 → 已取消）
```

### 8.2 排队状态流转

```
排队状态：waiting（等待中）

流转方向：
  方向一：waiting → called → completed
          （等待中 → 已叫号 → 已完成）
          
  方向二：waiting → cancelled
          （等待中 → 已取消）
          
  方向三：called → skipped
          （已叫号 → 已过号）
```

---

## 9. 实体关系文字总图

```
商户预约管理系统实体关系总览

核心业务实体关系：

1. 用户子系统
   用户（USERS）
     ├── 拥有预约记录（APPOINTMENTS）一对多
     └── 拥有排队记录（QUEUE_RECORDS）一对多（可为空）

2. 预约子系统
   服务项目（SERVICES）被预约（APPOINTMENTS）一对多
   员工（STAFF）接收预约（APPOINTMENTS）一对多
   预约（APPOINTMENTS）产生评分（STAFF_RATINGS）一对一

3. 排队子系统
   队列（QUEUE）包含排队记录（QUEUE_RECORDS）一对多
   用户（USERS）拥有排队记录（QUEUE_RECORDS）一对多（可为空）

4. 评分子系统
   员工（STAFF）接收评分（STAFF_RATINGS）一对多
   预约（APPOINTMENTS）只能产生一条评分（STAFF_RATINGS）一对一

5. 管理子系统
   管理员（ADMINS）管理服务项目（SERVICES）一对多
   管理员（ADMINS）管理员工（STAFF）一对多

总计：9个实体，9个关系（其中7个通过外键实现，2个通过业务逻辑实现）
```

---

## 10. 版本历史

| 版本 | 日期 | 修改内容 |
|------|------|----------|
| v2.0 | 2026-05-30 | 完善关系连接图，使用中文文字详细描述各实体间关系 |
| v1.0 | 2026-05-30 | 初始版本，包含9个实体的E-R图设计 |

---

**文档生成工具**: 基于 schema.sql 和 update_rating_table.sql 自动生成
