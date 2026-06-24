const express = require('express');
const router = express.Router();

// 检查预约时间是否已过
function isAppointmentExpired(date, time) {
  const appointmentDateTime = new Date(`${date} ${time}`);
  const now = new Date();
  return appointmentDateTime < now;
}

// 状态转换函数：英文状态转中文，同时检查是否过期
function getStatusWithExpirationCheck(status, date, time) {
  // 如果预约已取消，保持原状态
  if (status === 'cancelled') {
    return '已取消';
  }
  
  // 如果预约时间已过，显示为已完成
  if (isAppointmentExpired(date, time)) {
    return '已完成';
  }
  
  // 否则使用原状态
  const statusMap = {
    'pending': '待确认',
    'waiting': '等待中',
    'called': '已叫号',
    'completed': '已完成',
    'cancelled': '已取消',
    'skipped': '已过号'
  };
  return statusMap[status] || status;
}

// 获取统计数据接口
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // 获取今日预约数
    const [todayAppointments] = await db.execute(
      'SELECT COUNT(*) as count FROM appointments WHERE appointment_date = CURDATE()'
    );
    
    // 获取当前排队数（只统计今日的等待中记录）
    const [currentQueue] = await db.execute(
      `SELECT COUNT(*) as count FROM queue_records 
       WHERE status = 'waiting' AND DATE(created_at) = CURDATE()`
    );
    
    // 获取总客户数（统计所有用户）
    const [totalCustomers] = await db.execute(
      `SELECT COUNT(*) as count FROM users WHERE id IS NOT NULL AND id != 0`
    );
    
    // 获取今日营收（优先从营收记录表获取，只统计已完成的）
    const [todayRevenue] = await db.execute(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM revenue_records 
       WHERE DATE(created_at) = CURDATE() AND status = 'completed'`
    );
    
    let totalTodayRevenue = parseFloat(todayRevenue[0].total);
    
    // 如果营收记录表为空，回退到原来的计算方式（包含过期的预约）
    if (totalTodayRevenue === 0) {
      const [appointmentRevenue] = await db.execute(
        `SELECT COALESCE(SUM(s.price), 0) as total
         FROM appointments a
         JOIN services s ON a.service_id = s.id
         WHERE a.appointment_date = CURDATE() AND (a.status = 'completed' OR (a.status = 'pending' AND CONCAT(a.appointment_date, ' ', a.appointment_time) < NOW()))`
      );
      const [queueRevenue] = await db.execute(
        `SELECT COALESCE(SUM(s.price), 0) as total
         FROM queue_records qr
         JOIN services s ON qr.service_id = s.id
         WHERE DATE(qr.created_at) = CURDATE() AND qr.status = 'completed'`
      );
      totalTodayRevenue = parseFloat(appointmentRevenue[0].total) + parseFloat(queueRevenue[0].total);
    }

    // 获取月营收（优先从营收记录表获取）
    const [monthlyRevenue] = await db.execute(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM revenue_records 
       WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01') AND status = 'completed'`
    );
    
    let totalMonthlyRevenue = parseFloat(monthlyRevenue[0].total);
    
    // 如果营收记录表为空，回退到原来的计算方式（包含过期的预约）
    if (totalMonthlyRevenue === 0) {
      const [appointmentRevenue] = await db.execute(
        `SELECT COALESCE(SUM(s.price), 0) as total
         FROM appointments a
         JOIN services s ON a.service_id = s.id
         WHERE a.appointment_date >= DATE_FORMAT(NOW(), '%Y-%m-01') AND (a.status = 'completed' OR (a.status = 'pending' AND CONCAT(a.appointment_date, ' ', a.appointment_time) < NOW()))`
      );
      const [queueRevenue] = await db.execute(
        `SELECT COALESCE(SUM(s.price), 0) as total
         FROM queue_records qr
         JOIN services s ON qr.service_id = s.id
         WHERE DATE(qr.created_at) >= DATE_FORMAT(NOW(), '%Y-%m-01') AND qr.status = 'completed'`
      );
      totalMonthlyRevenue = parseFloat(appointmentRevenue[0].total) + parseFloat(queueRevenue[0].total);
    }

    // 获取年营收（优先从营收记录表获取）
    const [yearlyRevenue] = await db.execute(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM revenue_records 
       WHERE created_at >= DATE_FORMAT(NOW(), '%Y-01-01') AND status = 'completed'`
    );
    
    let totalYearlyRevenue = parseFloat(yearlyRevenue[0].total);
    
    // 如果营收记录表为空，回退到原来的计算方式（包含过期的预约）
    if (totalYearlyRevenue === 0) {
      const [appointmentRevenue] = await db.execute(
        `SELECT COALESCE(SUM(s.price), 0) as total
         FROM appointments a
         JOIN services s ON a.service_id = s.id
         WHERE a.appointment_date >= DATE_FORMAT(NOW(), '%Y-01-01') AND (a.status = 'completed' OR (a.status = 'pending' AND CONCAT(a.appointment_date, ' ', a.appointment_time) < NOW()))`
      );
      const [queueRevenue] = await db.execute(
        `SELECT COALESCE(SUM(s.price), 0) as total
         FROM queue_records qr
         JOIN services s ON qr.service_id = s.id
         WHERE DATE(qr.created_at) >= DATE_FORMAT(NOW(), '%Y-01-01') AND qr.status = 'completed'`
      );
      totalYearlyRevenue = parseFloat(appointmentRevenue[0].total) + parseFloat(queueRevenue[0].total);
    }

    res.status(200).json({
      success: true,
      data: {
        totalAppointments: todayAppointments[0].count,
        currentQueue: currentQueue[0].count,
        totalCustomers: totalCustomers[0].count,
        totalRevenue: totalTodayRevenue,
        monthlyRevenue: totalMonthlyRevenue,
        yearlyRevenue: totalYearlyRevenue
      }
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取客户列表接口（管理后台使用）
router.get('/customers', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const [customers] = await db.execute(
      `SELECT u.id, u.nickName as name, u.phone, u.gender, COUNT(a.id) as orderCount
       FROM users u
       LEFT JOIN appointments a ON u.id = a.user_id
       GROUP BY u.id, u.nickName, u.phone, u.gender`
    );
    
    res.status(200).json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('获取客户列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取客户详情接口（管理后台使用）
router.get('/customers/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // 获取客户信息
    const [customers] = await db.execute(
      'SELECT id, nickName as name, phone FROM users WHERE id = ?',
      [req.params.id]
    );
    
    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }
    
    const customer = customers[0];
    
    // 获取客户订单历史
    const [orders] = await db.execute(
      `SELECT a.id, s.name as serviceName, a.appointment_date as date, a.appointment_time as time, a.status
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.user_id = ?
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [req.params.id]
    );
    
    // 转换订单状态为中文，同时检查是否过期，并处理日期格式
    const ordersWithChineseStatus = orders.map(order => {
      let formattedDate = order.date;
      // 如果是日期对象，转换为字符串格式
      if (typeof formattedDate === 'object' && formattedDate instanceof Date) {
        const year = formattedDate.getFullYear();
        const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
        const day = String(formattedDate.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      } else if (typeof formattedDate === 'string' && formattedDate.includes('T')) {
        formattedDate = formattedDate.split('T')[0];
      }
      
      return {
        ...order,
        date: formattedDate,
        status: getStatusWithExpirationCheck(order.status, formattedDate, order.time)
      };
    });
    
    customer.orders = ordersWithChineseStatus;
    customer.orderCount = orders.length;
    
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('获取客户详情错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取营收记录列表接口（管理后台使用）
router.get('/revenue', async (req, res) => {
  try {
    const db = req.app.locals.db;
    let revenueRecords = [];
    
    // 优先从营收记录表获取数据
    const [rrRecords] = await db.execute(
      `SELECT rr.id, rr.user_id, rr.service_id, rr.amount, rr.status, rr.source,
              rr.appointment_id, rr.queue_record_id, rr.created_at,
              u.nickName as customerName, s.name as serviceName
       FROM revenue_records rr
       LEFT JOIN users u ON rr.user_id = u.id
       LEFT JOIN services s ON rr.service_id = s.id
       ORDER BY rr.created_at DESC
       LIMIT 100`
    );
    
    // 如果营收记录表有数据，使用它
    if (rrRecords.length > 0) {
      revenueRecords = rrRecords;
    } else {
      // 如果营收记录表为空，回退到原来的方式获取数据
      // 获取预约的营收记录
      const [appointmentRecords] = await db.execute(
        `SELECT a.id, a.user_id, a.service_id, s.price as amount, 
                a.status, 'appointment' as source,
                a.id as appointment_id, NULL as queue_record_id,
                CONCAT(a.appointment_date, ' ', a.appointment_time) as created_at,
                u.nickName as customerName, s.name as serviceName
         FROM appointments a
         JOIN services s ON a.service_id = s.id
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.status = 'completed'
         ORDER BY a.appointment_date DESC, a.appointment_time DESC`
      );
      
      // 获取排队的营收记录
      const [queueRecords] = await db.execute(
        `SELECT qr.id, qr.user_id, qr.service_id, s.price as amount,
                qr.status, 'queue' as source,
                NULL as appointment_id, qr.id as queue_record_id,
                qr.created_at,
                u.nickName as customerName, s.name as serviceName
         FROM queue_records qr
         JOIN services s ON qr.service_id = s.id
         LEFT JOIN users u ON qr.user_id = u.id
         WHERE qr.status = 'completed'
         ORDER BY qr.created_at DESC`
      );
      
      // 合并数据并按时间排序
      revenueRecords = [...appointmentRecords, ...queueRecords].sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      }).slice(0, 100);
    }

    // 格式化营收记录
    const formattedRecords = revenueRecords.map(record => {
      // 处理created_at字段，可能是Date对象或字符串
      let dateStr, timeStr;
      if (typeof record.created_at === 'string') {
        // 如果是字符串，直接分割
        const parts = record.created_at.split(' ');
        dateStr = parts[0];
        timeStr = parts[1] ? parts[1].substring(0, 5) : '00:00';
      } else {
        // 如果是Date对象，使用toISOString
        dateStr = record.created_at.toISOString().split('T')[0];
        timeStr = record.created_at.toISOString().split('T')[1].substring(0, 5);
      }
      
      return {
        id: record.id,
        customerName: record.customerName || '匿名用户',
        serviceName: record.serviceName || '未知服务',
        amount: parseFloat(record.amount),
        status: record.status === 'completed' ? '已完成' : (record.status === 'pending' ? '待确认' : '已取消'),
        date: dateStr,
        time: timeStr,
        source: record.source === 'appointment' ? '预约' : '排队'
      };
    });

    res.status(200).json({
      success: true,
      data: formattedRecords
    });
  } catch (error) {
    console.error('获取营收记录错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取预约时段分布数据接口
router.get('/appointment-distribution', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // 定义时间段（9:00-23:30，每半小时一个时间段）
    const timeSlots = [
      '9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
      '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
      '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
    ];
    
    // 初始化结果数组
    const distribution = timeSlots.map(slot => ({
      time: slot,
      count: 0
    }));
    
    console.log('=== 开始获取预约时段分布数据 ===');
    
    // 获取今日预约数据
    console.log('查询今日预约数据...');
    const [appointments] = await db.execute(
      `SELECT appointment_time, COUNT(*) as count
       FROM appointments
       WHERE DATE(appointment_date) = CURDATE()
       GROUP BY appointment_time`
    );
    console.log('预约数据查询结果:', appointments);
    
    // 填充预约数据
    appointments.forEach(appointment => {
      // 格式化时间，确保与时间段匹配
      const time = appointment.appointment_time;
      console.log('预约时间:', time);
      // 提取小时和分钟，格式化为 HH:MM
      const formattedTime = time.slice(0, 5);
      console.log('格式化后的时间:', formattedTime);
      const index = distribution.findIndex(item => item.time === formattedTime);
      if (index !== -1) {
        console.log('找到匹配的时间段:', distribution[index].time, '索引:', index);
        distribution[index].count += appointment.count;
        console.log('更新后的数据:', distribution[index].count);
      } else {
        console.log('未找到匹配的时间段:', formattedTime);
      }
    });
    
    // 获取今日排队数据
    console.log('查询今日排队数据...');
    const [queueRecords] = await db.execute(
      `SELECT TIME(created_at) as time, COUNT(*) as count
       FROM queue_records
       WHERE DATE(created_at) = CURDATE()
       GROUP BY TIME(created_at)`
    );
    console.log('排队数据查询结果:', queueRecords);
    
    // 填充排队数据
    queueRecords.forEach(record => {
      // 格式化时间，确保与时间段匹配
      const time = record.time;
      console.log('排队时间:', time);
      // 提取小时和分钟，格式化为 HH:MM
      const formattedTime = time.slice(0, 5);
      console.log('格式化后的时间:', formattedTime);
      const index = distribution.findIndex(item => item.time === formattedTime);
      if (index !== -1) {
        console.log('找到匹配的时间段:', distribution[index].time, '索引:', index);
        distribution[index].count += record.count;
        console.log('更新后的数据:', distribution[index].count);
      } else {
        console.log('未找到匹配的时间段:', formattedTime);
      }
    });
    
    console.log('最终分布数据:', distribution);
    
    res.status(200).json({
      success: true,
      data: {
        labels: distribution.map(item => item.time),
        data: distribution.map(item => item.count)
      }
    });
  } catch (error) {
    console.error('获取预约时段分布错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;