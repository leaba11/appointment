-- 创建数据库
CREATE DATABASE IF NOT EXISTS wechat_manage DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE wechat_manage;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    openid VARCHAR(100) UNIQUE NOT NULL COMMENT '微信openid',
    nickName VARCHAR(100) DEFAULT NULL COMMENT '昵称',
    avatarUrl VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    phone VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    gender VARCHAR(10) DEFAULT NULL COMMENT '性别',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 商户信息表
CREATE TABLE IF NOT EXISTS merchant (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '商户名称',
    address VARCHAR(255) DEFAULT NULL COMMENT '地址',
    phone VARCHAR(20) DEFAULT NULL COMMENT '电话',
    description TEXT DEFAULT NULL COMMENT '描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户信息表';

-- 服务项目表
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '服务名称',
    price DECIMAL(10,2) NOT NULL COMMENT '价格',
    duration INT NOT NULL COMMENT '时长(分钟)',
    description TEXT DEFAULT NULL COMMENT '描述',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务项目表';

-- 员工表
CREATE TABLE IF NOT EXISTS staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '姓名',
    avatar VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    specialty VARCHAR(255) DEFAULT NULL COMMENT '专长',
    rating DECIMAL(2,1) DEFAULT 5.0 COMMENT '评分',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否在职',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工表';

-- 预约表
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    service_id INT NOT NULL COMMENT '服务ID',
    staff_id INT NOT NULL COMMENT '员工ID',
    appointment_date DATE NOT NULL COMMENT '预约日期',
    appointment_time TIME NOT NULL COMMENT '预约时间',
    customer_name VARCHAR(100) DEFAULT NULL COMMENT '客户姓名',
    customer_phone VARCHAR(20) DEFAULT NULL COMMENT '客户电话',
    remark TEXT DEFAULT NULL COMMENT '备注',
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约表';

-- 队列表
CREATE TABLE IF NOT EXISTS queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    current_number INT DEFAULT 0 COMMENT '当前号码',
    estimated_wait_time INT DEFAULT 0 COMMENT '预计等待时间(分钟)',
    last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '上次重置时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='队列表';

-- 排队记录表
CREATE TABLE IF NOT EXISTS queue_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    queue_number INT NOT NULL COMMENT '排队号码',
    user_id INT DEFAULT NULL COMMENT '用户ID',
    service_id INT DEFAULT NULL COMMENT '服务ID',
    customer_name VARCHAR(100) DEFAULT NULL COMMENT '客户姓名',
    status ENUM('waiting', 'called', 'skipped', 'completed', 'cancelled') DEFAULT 'waiting' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    called_at TIMESTAMP NULL DEFAULT NULL COMMENT '叫号时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='排队记录表';

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    role ENUM('admin', 'staff') DEFAULT 'admin' COMMENT '角色',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- 员工评分表
CREATE TABLE IF NOT EXISTS staff_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL COMMENT '员工ID',
    appointment_id INT NOT NULL COMMENT '预约ID',
    service_attitude INT NOT NULL COMMENT '服务态度评分(1-5)',
    technical_skill INT NOT NULL COMMENT '技术水平评分(1-5)',
    communication INT NOT NULL COMMENT '沟通能力评分(1-5)',
    total_rating DECIMAL(3,2) NOT NULL COMMENT '综合评分',
    comment TEXT DEFAULT NULL COMMENT '评价内容',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_appointment_rating (appointment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工评分表';

-- 营收记录表
CREATE TABLE IF NOT EXISTS revenue_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL COMMENT '用户ID',
    service_id INT DEFAULT NULL COMMENT '服务ID',
    amount DECIMAL(10,2) NOT NULL COMMENT '金额',
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '状态',
    source ENUM('appointment', 'queue') DEFAULT 'queue' COMMENT '来源：预约或排队',
    appointment_id INT DEFAULT NULL COMMENT '预约ID（如果来源是预约）',
    queue_record_id INT DEFAULT NULL COMMENT '排队记录ID（如果来源是排队）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_source (source),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='营收记录表';

-- 插入默认数据

-- 插入默认商户信息
INSERT INTO merchant (name, address, phone, description) VALUES 
('示例商户', '北京市朝阳区某某街道', '13800138000', '专业提供各类服务，品质保证，价格合理');

-- 插入默认服务项目
INSERT INTO services (name, price, duration, description) VALUES 
('理发', 38.00, 30, '专业理发服务，由资深理发师为您打造理想发型'),
('烫发', 188.00, 120, '时尚烫发造型，多种风格可选'),
('染发', 168.00, 90, '健康染发，色彩持久亮丽'),
('护理', 88.00, 60, '深层头发护理，修复受损发质');

-- 插入默认员工
INSERT INTO staff (name, avatar, specialty, rating) VALUES 
('张三', '', '理发、烫发', 4.8),
('李四', '', '染发、护理', 4.6),
('王五', '', '造型设计', 4.9);

-- 插入默认队列信息
INSERT INTO queue (current_number, estimated_wait_time) VALUES (5, 0);

-- 插入默认管理员
INSERT INTO admins (username, password, role) VALUES 
('admin', 'admin123', 'admin');

-- 创建索引优化查询性能
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_queue_records_status ON queue_records(status);
CREATE INDEX idx_users_openid ON users(openid);
CREATE INDEX idx_revenue_status ON revenue_records(status);
CREATE INDEX idx_revenue_source ON revenue_records(source);
CREATE INDEX idx_revenue_created_at ON revenue_records(created_at);
