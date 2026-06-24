
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function init() {
  console.log('连接数据库...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'wechat_manage'
  });

  console.log('数据库连接成功！');

  try {
    // 检查表是否存在
    const [tables] = await connection.execute("SHOW TABLES LIKE 'staff_ratings'");
    
    if (tables.length === 0) {
      console.log('创建 staff_ratings 表...');
      
      await connection.execute(`
        CREATE TABLE staff_ratings (
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
      
      console.log('staff_ratings 表创建成功！');
    } else {
      console.log('staff_ratings 表已存在！');
    }
    
    // 显示所有表
    const [allTables] = await connection.execute('SHOW TABLES');
    console.log('\n数据库中的表：');
    allTables.forEach(table => {
      console.log('-', Object.values(table)[0]);
    });
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await connection.end();
    console.log('\n数据库初始化完成！');
  }
}

init().catch(console.error);

