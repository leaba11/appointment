const express = require('express');
const router = express.Router();
const { authenticate, optionalAuthenticate, adminAuthenticate } = require('../middleware/auth');

// 状态转换函数：英文状态转中文
function statusToChinese(status) {
  const statusMap = {
    'pending': '待确认',
    'waiting': '等待中',
    'called': '美发中',
    'servicing': '美发中',
    'completed': '已完成',
    'cancelled': '已取消',
    'skipped': '已过号'
  };
  return statusMap[status] || status;
}

// 检查是否需要自动更新状态为已完成（根据服务时长）
async function checkAndUpdateServicingStatus(db) {
  try {
    // 获取所有状态为called或servicing且已超过服务时长的记录
    const [records] = await db.execute(
      `SELECT qr.*, s.duration as service_duration 
       FROM queue_records qr 
       LEFT JOIN services s ON qr.service_id = s.id 
       WHERE qr.status IN ('called', 'servicing') 
       AND qr.called_at IS NOT NULL 
       AND qr.created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)`
    );
    
    const now = new Date();
    
    for (const record of records) {
      if (record.called_at && record.service_duration) {
        const calledTime = new Date(record.called_at);
        const serviceEndTime = new Date(calledTime.getTime() + record.service_duration * 60000);
        
        // 如果服务时间已过，自动更新为已完成
        if (now >= serviceEndTime) {
          await db.execute(
            'UPDATE queue_records SET status = ? WHERE id = ?',
            ['completed', record.id]
          );
          console.log(`排队记录 ${record.id} 已自动完成`);
        }
      }
    }
  } catch (error) {
    console.error('检查服务状态错误:', error);
  }
}

async function checkAndResetQueue(db) {
  try {
    const [queue] = await db.execute('SELECT * FROM queue LIMIT 1');
    
    if (queue.length > 0) {
      const lastReset = queue[0].last_reset;
      const today = new Date().toDateString();
      const lastResetDate = lastReset ? new Date(lastReset).toDateString() : null;
      
      if (lastResetDate !== today) {
        await db.execute(
          `UPDATE queue_records SET status = ? 
           WHERE status = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)`,
          ['cancelled', 'waiting']
        );
        
        await db.execute(
          'UPDATE queue SET current_number = ?, last_reset = NOW() WHERE id = ?',
          [1, queue[0].id]
        );
        
        console.log('队列已自动重置为新的一天');
      }
    }
  } catch (error) {
    console.error('检查队列重置错误:', error);
  }
}

router.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // 检查并更新服务状态（根据服务时长自动完成）
    await checkAndUpdateServicingStatus(db);
    
    await checkAndResetQueue(db);
    
    const [queue] = await db.execute('SELECT * FROM queue LIMIT 1');
    const [waitingCount] = await db.execute(
      'SELECT COUNT(*) as count FROM queue_records WHERE status = ?',
      ['waiting']
    );
    
    let yourNumber = null;
    let aheadCount = 0;
    let yourStatus = null;
    
    // 检查用户是否已登录，获取其排队号码
    if (req.user) {
      try {
        const userId = req.user.id;
        
        // 获取用户当天的排队记录
        const [userQueueRecord] = await db.execute(
          `SELECT qr.queue_number, qr.status, qr.service_id, s.name as serviceName, s.duration as serviceDuration
           FROM queue_records qr
           LEFT JOIN services s ON qr.service_id = s.id
           WHERE qr.user_id = ? AND qr.status IN ('waiting', 'called', 'servicing', 'completed') AND qr.created_at > DATE_SUB(NOW(), INTERVAL 1 DAY) 
           ORDER BY qr.created_at DESC LIMIT 1`,
          [userId]
        );
        
        if (userQueueRecord.length > 0) {
          yourNumber = userQueueRecord[0].queue_number;
          yourStatus = statusToChinese(userQueueRecord[0].status);
          
          // 计算前面还有多少人
          const [aheadCountResult] = await db.execute(
            `SELECT COUNT(*) as count FROM queue_records 
             WHERE status = ? AND queue_number < ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)`,
            ['waiting', yourNumber]
          );
          aheadCount = aheadCountResult[0].count;
        }
      } catch (error) {
        console.error('获取用户排队信息错误:', error);
      }
    }
    
    if (queue.length === 0) {
      await db.execute('INSERT INTO queue (current_number, estimated_wait_time, last_reset) VALUES (?, ?, ?)', [1, 0, new Date()]);
      return res.status(200).json({
        success: true,
        data: {
          currentNumber: 1,
          yourNumber: yourNumber,
          yourStatus: yourStatus,
          aheadCount: aheadCount,
          estimatedWaitTime: 0,
          waitingCount: 0,
          queueList: []
        }
      });
    }
    
    // 计算预计等待时间，考虑理发师数量和当前时间段的预约情况
    let estimatedWaitTime = 0;
    if (aheadCount > 0) {
      // 获取员工数量
      const [staffCount] = await db.execute('SELECT COUNT(*) as count FROM staff WHERE is_active = 1');
      const activeStaffCount = staffCount[0].count || 1;
      
      // 检查当前时间段是否有理发师被预约
      const now = new Date();
      const currentHour = now.getHours();
      const [appointedStaffCount] = await db.execute(
        `SELECT COUNT(DISTINCT staff_id) as count FROM appointments 
         WHERE appointment_date = DATE(NOW()) AND 
               HOUR(appointment_time) = ? AND 
               status = ?`,
        [currentHour, 'confirmed']
      );
      const availableStaffCount = Math.max(1, activeStaffCount - appointedStaffCount[0].count);
      
      // 如果没有可用理发师，使用总理发师数量
      const staffToUse = availableStaffCount > 0 ? availableStaffCount : activeStaffCount;
      
      // 每个理发师平均处理时间为15分钟
      const averageServiceTime = 15;
      estimatedWaitTime = Math.ceil((aheadCount / staffToUse) * averageServiceTime);
    }
    
    // 获取排队列表（返回所有当天的排队记录，按号码顺序排列）
    const [queueRecords] = await db.execute(
      `SELECT qr.id, qr.queue_number, qr.status, qr.created_at, qr.user_id, qr.service_id,
              COALESCE(u.nickName, qr.customer_name) as customerName,
              u.phone as customerPhone,
              s.name as serviceName, s.duration as serviceDuration
       FROM queue_records qr
       LEFT JOIN users u ON qr.user_id = u.id
       LEFT JOIN services s ON qr.service_id = s.id
       WHERE qr.created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
       ORDER BY qr.queue_number ASC`,
      []
    );
    
    // 转换排队列表中的状态为中文
    const queueListWithChineseStatus = queueRecords.map(record => ({
      ...record,
      status: statusToChinese(record.status)
    }));
    
    res.status(200).json({
      success: true,
      data: {
        currentNumber: queue[0].current_number,
        yourNumber: yourNumber,
        yourStatus: yourStatus,
        aheadCount: aheadCount,
        estimatedWaitTime: estimatedWaitTime,
        waitingCount: waitingCount[0].count,
        queueList: queueListWithChineseStatus
      }
    });
  } catch (error) {
    console.error('获取队列信息错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/take-number', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { serviceId } = req.body;
    const userId = req.user.id;
    
    console.log('Take number request:', { userId, serviceId });
    
    // 检查users表是否存在，如果不存在则创建
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY,
          openid VARCHAR(255),
          nickName VARCHAR(255),
          phone VARCHAR(20),
          avatarUrl VARCHAR(255),
          gender VARCHAR(10),
          created_at DATETIME
        )
      `);
      console.log('Users table created or already exists');
    } catch (error) {
      console.error('Error creating users table:', error);
      return res.status(500).json({ success: false, message: '创建用户表失败' });
    }
    
    // 检查用户是否存在，如果不存在则创建
    try {
      const [existingUser] = await db.execute(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );
      console.log('Existing user:', existingUser);
      
      if (existingUser.length === 0) {
        // 创建用户
        await db.execute(
          'INSERT INTO users (id, openid, nickName, phone, avatarUrl, gender, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
          [userId, 'openid' + userId, '用户' + userId, '', '', '']
        );
        console.log('User created:', userId);
      } else {
        console.log('User already exists:', userId);
      }
    } catch (error) {
      console.error('Error checking/creating user:', error);
      return res.status(500).json({ success: false, message: '创建用户失败' });
    }
    
    await checkAndResetQueue(db);
    
    // 检查用户是否已经取过号（只有状态为waiting时才阻止，called/completed/skipped后可以重新取号）
    const [existingRecord] = await db.execute(
      `SELECT * FROM queue_records 
       WHERE user_id = ? AND status = 'waiting' AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)`,
      [userId]
    );
    
    if (existingRecord.length > 0) {
      return res.status(400).json({ success: false, message: '您还有等待中的号码，请先使用或取消后再重新取号' });
    }
    
    const [queue] = await db.execute('SELECT * FROM queue LIMIT 1');
    
    const [maxNumberResult] = await db.execute(
      'SELECT MAX(queue_number) as maxNumber FROM queue_records WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)'
    );
    let nextNumber = 1;
    if (maxNumberResult[0].maxNumber) {
      nextNumber = maxNumberResult[0].maxNumber + 1;
    }
    
    // 计算预计等待时间，考虑理发师数量和当前时间段的预约情况
    const [waitingCount] = await db.execute(
      'SELECT COUNT(*) as count FROM queue_records WHERE status = ?',
      ['waiting']
    );
    
    let estimatedWaitTime = 0;
    if (waitingCount[0].count > 0) {
      // 获取员工数量
      const [staffCount] = await db.execute('SELECT COUNT(*) as count FROM staff WHERE is_active = 1');
      const activeStaffCount = staffCount[0].count || 1;
      
      // 检查当前时间段是否有理发师被预约
      const now = new Date();
      const currentHour = now.getHours();
      const [appointedStaffCount] = await db.execute(
        `SELECT COUNT(DISTINCT staff_id) as count FROM appointments 
         WHERE appointment_date = DATE(NOW()) AND 
               HOUR(appointment_time) = ? AND 
               status = ?`,
        [currentHour, 'confirmed']
      );
      const availableStaffCount = Math.max(1, activeStaffCount - appointedStaffCount[0].count);
      
      // 如果没有可用理发师，使用总理发师数量
      const staffToUse = availableStaffCount > 0 ? availableStaffCount : activeStaffCount;
      
      // 每个理发师平均处理时间为15分钟
      const averageServiceTime = 15;
      estimatedWaitTime = Math.ceil((waitingCount[0].count / staffToUse) * averageServiceTime);
    }
    
    if (queue.length > 0) {
      await db.execute(
        'UPDATE queue SET current_number = ?, estimated_wait_time = ? WHERE id = ?',
        [queue[0].current_number, estimatedWaitTime, queue[0].id]
      );
    } else {
      await db.execute(
        'INSERT INTO queue (current_number, estimated_wait_time, last_reset) VALUES (?, ?, ?)',
        [1, estimatedWaitTime, new Date()]
      );
    }
    
    await db.execute(
      'INSERT INTO queue_records (queue_number, user_id, service_id, status) VALUES (?, ?, ?, ?)',
      [nextNumber, userId, serviceId || null, 'waiting']
    );
    
    // 计算前面还有多少人
    const [aheadCountResult] = await db.execute(
      `SELECT COUNT(*) as count FROM queue_records 
       WHERE status = ? AND queue_number < ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)`,
      ['waiting', nextNumber]
    );
    const aheadCount = aheadCountResult[0].count;
    
    res.status(200).json({
      success: true,
      data: {
        currentNumber: queue.length > 0 ? queue[0].current_number : 1,
        yourNumber: nextNumber,
        aheadCount: aheadCount,
        estimatedWaitTime: estimatedWaitTime
      }
    });
  } catch (error) {
    console.error('取号错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/list', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    await checkAndResetQueue(db);
    
    const [queue] = await db.execute('SELECT * FROM queue LIMIT 1');
    const [queueRecords] = await db.execute(
      `SELECT qr.id, qr.queue_number, qr.status, qr.created_at, qr.user_id,
              COALESCE(u.nickName, qr.customer_name) as customerName,
              u.phone as customerPhone
       FROM queue_records qr 
       LEFT JOIN users u ON qr.user_id = u.id 
       WHERE qr.created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
       ORDER BY qr.queue_number ASC`,
      []
    );
    
    // 转换排队列表中的状态为中文
    const queueListWithChineseStatus = queueRecords.map(record => ({
      ...record,
      status: statusToChinese(record.status)
    }));
    
    res.status(200).json({
      success: true,
      data: {
        currentNumber: queue.length > 0 ? queue[0].current_number : 1,
        queueList: queueListWithChineseStatus
      }
    });
  } catch (error) {
    console.error('获取排队列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/call-next', adminAuthenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    await checkAndResetQueue(db);
    
    const [queue] = await db.execute('SELECT * FROM queue LIMIT 1');
    
    if (queue.length === 0) {
      return res.status(400).json({ success: false, message: '队列未初始化' });
    }
    
    const currentNumber = queue[0].current_number;
    
    // 获取所有等待中的号码，按号码顺序排列
    const [waitingRecords] = await db.execute(
      `SELECT * FROM queue_records 
       WHERE status = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
       ORDER BY queue_number ASC`,
      ['waiting']
    );
    
    if (waitingRecords.length === 0) {
      return res.status(400).json({ success: false, message: '没有等待中的号码' });
    }
    
    // 找到当前号码之后的下一个号码
    let nextRecord = null;
    for (const record of waitingRecords) {
      if (record.queue_number >= currentNumber) {
        nextRecord = record;
        break;
      }
    }
    
    // 如果没有找到大于等于当前号码的记录，就取第一个等待中的号码
    if (!nextRecord && waitingRecords.length > 0) {
      nextRecord = waitingRecords[0];
    }
    
    if (!nextRecord) {
      return res.status(400).json({ success: false, message: '没有等待中的号码' });
    }
    
    const nextNumber = nextRecord.queue_number;
    
    await db.execute(
      'UPDATE queue SET current_number = ? WHERE id = ?',
      [nextNumber, queue[0].id]
    );
    
    await db.execute(
      'UPDATE queue_records SET status = ?, called_at = NOW() WHERE id = ?',
      ['called', nextRecord.id]
    );
    
    res.status(200).json({
      success: true,
      message: '叫号成功',
      data: {
        currentNumber: nextNumber
      }
    });
  } catch (error) {
    console.error('叫号错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/reset', adminAuthenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    await db.execute(
      `UPDATE queue_records SET status = ? 
       WHERE status = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)`,
      ['cancelled', 'waiting']
    );
    
    await db.execute('UPDATE queue SET current_number = ?, last_reset = NOW()', [1]);
    
    res.status(200).json({
      success: true,
      message: '队列已重置'
    });
  } catch (error) {
    console.error('重置队列错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新排队记录状态（刷号或开始处理）
router.post('/update-status', adminAuthenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { recordId, status } = req.body;
    
    if (!recordId || !status) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    if (!['skipped', 'servicing', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: '无效的状态' });
    }
    
    // 获取排队记录信息
    const [record] = await db.execute(
      'SELECT * FROM queue_records WHERE id = ?',
      [recordId]
    );
    
    if (record.length === 0) {
      return res.status(400).json({ success: false, message: '排队记录不存在' });
    }
    
    // 更新状态
    await db.execute(
      'UPDATE queue_records SET status = ?, called_at = IF(called_at IS NULL, NOW(), called_at) WHERE id = ?',
      [status, recordId]
    );
    
    // 如果状态是servicing，开始计算服务时间
    if (status === 'servicing') {
      // 这里可以添加开始计算服务时间的逻辑
      // 实际项目中可能需要使用定时任务来自动完成服务
    }
    
    // 如果状态是skipped（过号），不计算营收
    // 如果状态是servicing（处理中），计算营收
    if (status === 'servicing') {
      // 检查是否已存在营收记录
      const [existingRevenue] = await db.execute(
        'SELECT * FROM revenue_records WHERE queue_record_id = ?',
        [recordId]
      );
      
      if (existingRevenue.length === 0 && record[0].service_id) {
        // 获取服务信息
        const [service] = await db.execute(
          'SELECT * FROM services WHERE id = ?',
          [record[0].service_id]
        );
        
        if (service.length > 0) {
          // 添加营收记录，包含排队记录ID
          await db.execute(
            'INSERT INTO revenue_records (user_id, service_id, amount, status, source, queue_record_id, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [record[0].user_id, record[0].service_id, service[0].price, 'pending', 'queue', recordId]
          );
        }
      }
    }
    
    // 如果状态是completed（已完成），更新营收记录状态
    if (status === 'completed') {
      await db.execute(
        'UPDATE revenue_records SET status = ? WHERE queue_record_id = ?',
        ['completed', recordId]
      );
    }
    
    // 如果状态是cancelled（已取消），更新营收记录状态为cancelled
    if (status === 'cancelled') {
      await db.execute(
        'UPDATE revenue_records SET status = ? WHERE queue_record_id = ?',
        ['cancelled', recordId]
      );
    }
    
    res.status(200).json({
      success: true,
      message: '状态更新成功'
    });
  } catch (error) {
    console.error('更新状态错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 完成服务
router.post('/complete-service', adminAuthenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { recordId } = req.body;
    
    if (!recordId) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    // 获取排队记录信息
    const [record] = await db.execute(
      'SELECT * FROM queue_records WHERE id = ?',
      [recordId]
    );
    
    if (record.length === 0) {
      return res.status(400).json({ success: false, message: '排队记录不存在' });
    }
    
    // 更新状态为已完成
    await db.execute(
      'UPDATE queue_records SET status = ?, completed_at = NOW() WHERE id = ?',
      ['completed', recordId]
    );
    
    // 更新营收记录状态为已完成
    await db.execute(
      'UPDATE revenue_records SET status = ? WHERE queue_record_id = ?',
      ['completed', recordId]
    );
    
    res.status(200).json({
      success: true,
      message: '服务完成成功'
    });
  } catch (error) {
    console.error('完成服务错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 取消排队
router.post('/cancel', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user.id;
    
    // 找到用户当前的等待中排队记录
    const [existingRecord] = await db.execute(
      `SELECT * FROM queue_records 
       WHERE user_id = ? AND status = 'waiting' AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)`,
      [userId]
    );
    
    if (existingRecord.length === 0) {
      return res.status(400).json({ success: false, message: '您没有等待中的排队记录' });
    }
    
    // 更新状态为已取消
    await db.execute(
      'UPDATE queue_records SET status = ? WHERE id = ?',
      ['cancelled', existingRecord[0].id]
    );
    
    // 更新营收记录状态为已取消
    await db.execute(
      'UPDATE revenue_records SET status = ? WHERE queue_record_id = ?',
      ['cancelled', existingRecord[0].id]
    );
    
    res.status(200).json({
      success: true,
      message: '取消排队成功'
    });
  } catch (error) {
    console.error('取消排队错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
