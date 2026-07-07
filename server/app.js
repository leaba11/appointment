const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('错误: JWT_SECRET 环境变量未设置');
  process.exit(1);
}

const app = express();

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN || '*' 
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
}

// 数据库连接池配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'wechat_manage',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
};

if (process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production') {
  dbConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(dbConfig);

// 测试数据库连接并初始化表格
pool.getConnection()
  .then(async connection => {
    console.log('数据库连接成功');
    
    // 检查并创建staff_ratings表
    try {
      await connection.execute(`
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工评分表'
      `);
      console.log('staff_ratings表初始化完成');
    } catch (tableErr) {
      console.error('初始化staff_ratings表失败:', tableErr);
    }
    
    // 检查并创建revenue_records表
    try {
      await connection.execute(`
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
          INDEX idx_status (status),
          INDEX idx_source (source),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='营收记录表'
      `);
      console.log('revenue_records表初始化完成');
    } catch (tableErr) {
      console.error('初始化revenue_records表失败:', tableErr);
    }
    
    // 检查queue_records表是否有service_id字段，如果没有则添加
    try {
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'queue_records' AND COLUMN_NAME = 'service_id'
      `, [process.env.DB_NAME || 'wechat_manage']);
      
      if (columns.length === 0) {
        await connection.execute(`
          ALTER TABLE queue_records 
          ADD COLUMN service_id INT DEFAULT NULL COMMENT '服务ID' AFTER user_id,
          ADD FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
        `);
        console.log('queue_records表添加service_id字段完成');
      }
    } catch (tableErr) {
      console.error('检查/添加queue_records.service_id字段失败:', tableErr);
    }
    
    connection.release();
  })
  .catch(err => {
    console.error('数据库连接失败:', err);
  });

// 将数据库连接池挂载到app上，供路由使用
app.locals.db = pool;

// 路由配置
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const appointmentRoutes = require('./routes/appointments');
const queueRoutes = require('./routes/queue');
const merchantRoutes = require('./routes/merchant');
const staffRoutes = require('./routes/staff');
const adminRoutes = require('./routes/admin');
const statsRoutes = require('./routes/stats');
const initDbRoutes = require('./routes/init-db');


app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/init-db', initDbRoutes);


// 静态文件服务
app.use('/images', express.static(path.join(__dirname, '../merchant-appointment-system/images')));
// 提供管理后台页面
app.use('/merchant-admin', express.static(path.join(__dirname, '../merchant-admin'), { index: 'index.html' }));
// 处理merchant-admin根路径，重定向到index.html
app.get('/merchant-admin', (req, res) => {
  res.redirect('/merchant-admin/index.html');
});

// 根路径处理
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: '服务器运行正常', data: { version: '1.0.0', endpoints: '/api' } });
});

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: '服务器运行正常' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    if (process.env.NODE_ENV !== 'production') {
      const interfaces = require('os').networkInterfaces();
      let ipv4Address = '192.168.x.x';
      for (const key in interfaces) {
        for (const iface of interfaces[key]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            ipv4Address = iface.address;
            break;
          }
        }
      }
      console.log(`局域网访问地址: http://${ipv4Address}:${PORT}`);
    }
  });
}

module.exports = app;
