const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// 检查预约时间是否已过
function isAppointmentExpired(date, time) {
  // 日期已经在SQL查询中通过CONVERT_TZ转换为本地时间字符串（YYYY-MM-DD格式）
  const dateStr = date;
  
  // 获取今天的本地日期字符串
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  // 如果日期字符串小于今天，说明已过期
  if (dateStr < today) {
    return true;
  }
  
  // 如果日期字符串等于今天，需要比较时间
  if (dateStr === today) {
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    return time < currentTime;
  }
  
  // 日期字符串大于今天，未过期
  return false;
}



// 状态转换函数：英文状态转中文，同时检查是否过期
function getStatusWithExpirationCheck(status, date, time) {
  // 如果预约已取消，保持原状态
  if (status === 'cancelled') {
    return '已取消';
  }
  
  // 如果状态已经是已完成或已过号，保持原状态
  if (status === 'completed' || status === 'skipped') {
    return status === 'completed' ? '已完成' : '已过号';
  }
  
  // 日期已经在SQL查询中通过CONVERT_TZ转换为本地时间字符串（YYYY-MM-DD格式）
  // 构建预约日期时间对象
  const appointmentDateTime = new Date(`${date} ${time}`);
  
  // 获取当前本地时间
  const now = new Date();
  
  // 调试信息
  console.log('预约时间(本地):', appointmentDateTime.toLocaleString());
  console.log('当前时间:', now.toLocaleString());
  
  // 计算预约结束时间（预约时间 + 2小时服务时长）
  // 只有当预约结束时间已经过去，才认为是"已完成"
  const serviceDuration = 2 * 60 * 60 * 1000; // 2小时（毫秒）
  const appointmentEndTime = new Date(appointmentDateTime.getTime() + serviceDuration);
  
  // 如果当前时间还没到预约时间，保持原状态
  if (now < appointmentDateTime) {
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
  
  // 如果当前时间在预约时间之后但在预约结束时间之前，显示"等待中"或"已叫号"
  if (now >= appointmentDateTime && now < appointmentEndTime) {
    // 根据原状态决定显示"等待中"还是"已叫号"
    if (status === 'called') {
      return '已叫号';
    }
    return '等待中';
  }
  
  // 如果当前时间已经超过预约结束时间，显示"已完成"
  if (now >= appointmentEndTime) {
    return '已完成';
  }
  
  // 默认返回原状态
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

// 中间件：验证token
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ success: false, message: '服务器配置错误' });
    }
    const decoded = jwt.verify(token, jwtSecret);
    // 处理用户和管理员的token
    if (decoded.userId) {
      req.user = {
        id: decoded.userId
      };
      req.userId = decoded.userId; // 保持向后兼容
      console.log('用户ID:', decoded.userId);
    } else if (decoded.adminId) {
      // 管理员可以访问所有预约
      req.userId = null;
      console.log('管理员访问');
    } else {
      // 既不是用户也不是管理员，拒绝访问
      return res.status(401).json({ success: false, message: '未授权' });
    }
    next();
  } catch (error) {
    console.error('认证错误:', error);
    res.status(401).json({ success: false, message: '未授权' });
  }
};

// 获取所有预约接口（管理后台使用）
router.get('/all', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const [appointments] = await db.execute(
      `SELECT a.id, a.appointment_date as date, a.appointment_time as time, a.status, 
              a.customer_name as name, a.customer_phone as phone,
              s.name as serviceName,
              st.name as staffName
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       JOIN staff st ON a.staff_id = st.id
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`
    );
    
    // 日期已经直接以字符串形式从数据库返回（因为设置了 dateStrings: true）
    // 只需要确保格式正确即可
    const formattedAppointments = appointments.map(appointment => {
      let formattedDate = appointment.date;
      
      // 如果是字符串且包含 T，只取前面的日期部分
      if (typeof formattedDate === 'string' && formattedDate.includes('T')) {
        formattedDate = formattedDate.split('T')[0];
      }
      
      return {
        ...appointment,
        date: formattedDate
      };
    });
    
    // 转换状态为中文，同时检查是否过期
    const appointmentsWithChineseStatus = formattedAppointments.map(appointment => ({
      ...appointment,
      status: getStatusWithExpirationCheck(appointment.status, appointment.date, appointment.time)
    }));
    
    res.status(200).json({
      success: true,
      data: appointmentsWithChineseStatus
    });
  } catch (error) {
    console.error('获取所有预约错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 创建预约接口
router.post('/', authMiddleware, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { serviceId, staffId, date, time, name, phone, remark } = req.body;
    
    // 验证服务和员工是否存在
    const [services] = await db.execute('SELECT * FROM services WHERE id = ? AND is_active = 1', [serviceId]);
    const [staff] = await db.execute('SELECT * FROM staff WHERE id = ? AND is_active = 1', [staffId]);
    
    if (services.length === 0 || staff.length === 0) {
      return res.status(404).json({ success: false, message: '服务或员工不存在' });
    }
    
    // 创建预约
    const [result] = await db.execute(
      'INSERT INTO appointments (user_id, service_id, staff_id, appointment_date, appointment_time, customer_name, customer_phone, remark, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.userId, serviceId, staffId, date, time, name, phone, remark, 'pending']
    );
    
    const appointmentId = result.insertId;
    
    // 创建营收记录
    const [service] = await db.execute('SELECT * FROM services WHERE id = ?', [serviceId]);
    if (service.length > 0) {
      await db.execute(
        'INSERT INTO revenue_records (user_id, service_id, amount, status, source, appointment_id, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [req.userId, serviceId, service[0].price, 'pending', 'appointment', appointmentId]
      );
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: appointmentId,
        userId: req.userId,
        serviceId,
        staffId,
        date,
        time,
        name,
        phone,
        remark,
        status: getStatusWithExpirationCheck('pending', date, time)
      }
    });
  } catch (error) {
    console.error('创建预约错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取预约列表接口
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = req.app.locals.db;
    console.log('获取预约列表 - 用户ID:', req.userId, 'req.user:', req.user);
    
    let query, params;
    
    if (req.userId === null) {
      // 管理员：获取所有预约 - 不做时区转换，直接使用存储的日期
      query = `SELECT a.id, a.user_id, a.service_id, a.staff_id, a.appointment_date as date, a.appointment_time as time, a.status, 
                     a.customer_name as name, a.customer_phone as phone,
                     s.name as serviceName, s.price as servicePrice,
                     st.name as staffName
              FROM appointments a
              JOIN services s ON a.service_id = s.id
              JOIN staff st ON a.staff_id = st.id
              ORDER BY a.appointment_date DESC, a.appointment_time DESC`;
      params = [];
    } else {
      // 普通用户：只获取自己的预约 - 不做时区转换，直接使用存储的日期
      query = `SELECT a.id, a.user_id, a.service_id, a.staff_id as staffId, a.appointment_date as date, a.appointment_time as time, a.status, 
                     s.name as serviceName, s.price as servicePrice,
                     st.name as staffName
              FROM appointments a
              JOIN services s ON a.service_id = s.id
              JOIN staff st ON a.staff_id = st.id
              WHERE a.user_id = ?
              ORDER BY a.appointment_date DESC, a.appointment_time DESC`;
      params = [req.userId];
    }
    
    console.log('执行查询:', query, '参数:', params);
    const [appointments] = await db.execute(query, params);
    console.log('查询结果:', appointments);
    
    // 日期已经直接以字符串形式从数据库返回（因为设置了 dateStrings: true）
    // 只需要确保格式正确即可
    const formattedAppointments = appointments.map(appointment => {
      let formattedDate = appointment.date;
      
      // 如果是字符串且包含 T，只取前面的日期部分
      if (typeof formattedDate === 'string' && formattedDate.includes('T')) {
        formattedDate = formattedDate.split('T')[0];
      }
      
      return {
        ...appointment,
        date: formattedDate
      };
    });
    
    console.log('格式化后的预约记录:', formattedAppointments);
    
    // 转换状态为中文，同时检查是否过期
    const appointmentsWithChineseStatus = formattedAppointments.map(appointment => ({
      ...appointment,
      status: getStatusWithExpirationCheck(appointment.status, appointment.date, appointment.time)
    }));
    
    console.log('返回数据:', appointmentsWithChineseStatus);
    res.status(200).json({
      success: true,
      data: appointmentsWithChineseStatus
    });
  } catch (error) {
    console.error('获取预约列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 取消预约接口
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // 验证预约是否存在
    let appointments;
    if (req.userId === null) {
      // 管理员：可以取消任何预约
      [appointments] = await db.execute('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    } else {
      // 普通用户：只能取消自己的预约
      [appointments] = await db.execute(
        'SELECT * FROM appointments WHERE id = ? AND user_id = ?',
        [req.params.id, req.userId]
      );
    }
    
    if (appointments.length === 0) {
      return res.status(404).json({ success: false, message: '预约不存在' });
    }
    
    await db.execute(
      'UPDATE appointments SET status = ? WHERE id = ?',
      ['cancelled', req.params.id]
    );
    
    // 更新营收记录状态为已取消
    await db.execute(
      'UPDATE revenue_records SET status = ? WHERE appointment_id = ?',
      ['cancelled', req.params.id]
    );
    
    res.status(200).json({
      success: true,
      data: {
        id: req.params.id,
        status: getStatusWithExpirationCheck('cancelled', appointments[0].appointment_date, appointments[0].appointment_time)
      }
    });
  } catch (error) {
    console.error('取消预约错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 完成预约接口
router.post('/:id/complete', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // 获取预约信息
    const [appointments] = await db.execute(
      'SELECT * FROM appointments WHERE id = ?',
      [req.params.id]
    );
    
    if (appointments.length === 0) {
      return res.status(404).json({ success: false, message: '预约不存在' });
    }
    
    const appointment = appointments[0];
    
    // 更新预约状态为已完成
    await db.execute(
      'UPDATE appointments SET status = ? WHERE id = ?',
      ['completed', req.params.id]
    );
    
    // 更新营收记录状态为已完成
    await db.execute(
      'UPDATE revenue_records SET status = ? WHERE appointment_id = ?',
      ['completed', req.params.id]
    );
    
    res.status(200).json({
      success: true,
      data: {
        id: req.params.id,
        status: '已完成'
      }
    });
  } catch (error) {
    console.error('完成预约错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取预约详情接口
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    let appointments;
    if (req.userId === null) {
      // 管理员：可以查看任何预约
      [appointments] = await db.execute(
        `SELECT a.id, a.appointment_date as date, a.appointment_time as time, a.status, a.customer_name as name, a.customer_phone as phone, a.remark, 
                s.name as serviceName, s.price as servicePrice,
                st.name as staffName
         FROM appointments a
         JOIN services s ON a.service_id = s.id
         JOIN staff st ON a.staff_id = st.id
         WHERE a.id = ?`,
        [req.params.id]
      );
    } else {
      // 普通用户：只能查看自己的预约
      [appointments] = await db.execute(
        `SELECT a.id, a.appointment_date as date, a.appointment_time as time, a.status, a.customer_name as name, a.customer_phone as phone, a.remark, 
                s.name as serviceName, s.price as servicePrice,
                st.name as staffName
         FROM appointments a
         JOIN services s ON a.service_id = s.id
         JOIN staff st ON a.staff_id = st.id
         WHERE a.id = ? AND a.user_id = ?`,
        [req.params.id, req.userId]
      );
    }
    
    if (appointments.length === 0) {
      return res.status(404).json({ success: false, message: '预约不存在' });
    }
    
    // 转换状态为中文，同时检查是否过期
    const appointmentWithChineseStatus = {
      ...appointments[0],
      status: getStatusWithExpirationCheck(appointments[0].status, appointments[0].date, appointments[0].time)
    };
    
    res.status(200).json({
      success: true,
      data: appointmentWithChineseStatus
    });
  } catch (error) {
    console.error('获取预约详情错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新预约状态接口（管理后台使用）
router.put('/:id/status', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { status } = req.body;
    
    // 验证预约是否存在
    const [appointments] = await db.execute('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    if (appointments.length === 0) {
      return res.status(404).json({ success: false, message: '预约不存在' });
    }
    
    await db.execute(
      'UPDATE appointments SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    
    // 更新营收记录状态
    if (status === 'completed') {
      await db.execute(
        'UPDATE revenue_records SET status = ? WHERE appointment_id = ?',
        ['completed', req.params.id]
      );
    } else if (status === 'cancelled') {
      await db.execute(
        'UPDATE revenue_records SET status = ? WHERE appointment_id = ?',
        ['cancelled', req.params.id]
      );
    } else if (status === 'confirmed' || status === 'pending') {
      await db.execute(
        'UPDATE revenue_records SET status = ? WHERE appointment_id = ?',
        ['pending', req.params.id]
      );
    }
    
    // 获取预约的日期和时间，用于检查是否过期
    const [appointment] = await db.execute(
      'SELECT appointment_date, appointment_time FROM appointments WHERE id = ?',
      [req.params.id]
    );
    
    res.status(200).json({
      success: true,
      data: { 
        id: req.params.id, 
        status: getStatusWithExpirationCheck(status, appointment[0].appointment_date, appointment[0].appointment_time)
      }
    });
  } catch (error) {
    console.error('更新预约状态错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;