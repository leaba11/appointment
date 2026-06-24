
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function test() {
  console.log('测试评分功能...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // 1. 先检查是否有已完成的预约
    console.log('\n1. 查找已完成的预约...');
    const [appointments] = await connection.execute(
      'SELECT a.id, a.staff_id, s.name as staff_name FROM appointments a JOIN staff s ON a.staff_id = s.id WHERE a.status = "completed" LIMIT 1'
    );
    
    if (appointments.length === 0) {
      console.log('⚠ 没有已完成的预约，先查看所有预约状态：');
      const [allApps] = await connection.execute('SELECT id, status FROM appointments LIMIT 5');
      console.log(allApps);
    } else {
      const appointment = appointments[0];
      console.log('✓ 找到预约:', appointment);
      
      // 2. 插入测试评分
      console.log('\n2. 插入测试评分...');
      try {
        const result = await connection.execute(`
          INSERT INTO staff_ratings 
          (staff_id, appointment_id, service_attitude, technical_skill, communication, total_rating, comment) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          appointment.staff_id,
          appointment.id,
          5,  // serviceAttitude
          4,  // technicalSkill
          5,  // communication
          4.8, // totalRating (5*0.4 + 4*0.4 +5*0.2 = 2 +1.6 +1=4.6)
          '服务很好！'
        ]);
        console.log('✓ 评分插入成功，ID:', result[0].insertId);
      } catch (insertErr) {
        if (insertErr.code === 'ER_DUP_ENTRY') {
          console.log('⚠ 该预约已有评分，继续...');
        } else {
          throw insertErr;
        }
      }
    }
    
    // 3. 查询所有评分
    console.log('\n3. 查询所有评分...');
    const [ratings] = await connection.execute('SELECT * FROM staff_ratings');
    console.log('评分数量:', ratings.length);
    console.log('评分详情:', ratings);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await connection.end();
    console.log('\n✓ 测试完成！');
  }
}

test().catch(console.error);

