const express = require('express');
const router = express.Router();

// 获取员工列表接口
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const [staff] = await db.execute(
      'SELECT id, name, avatar, specialty, rating FROM staff WHERE is_active = 1'
    );
    
    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('获取员工列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取员工详情接口
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const [staff] = await db.execute(
      'SELECT id, name, avatar, specialty, rating FROM staff WHERE id = ? AND is_active = 1',
      [req.params.id]
    );
    
    if (staff.length === 0) {
      return res.status(404).json({ success: false, message: '员工不存在' });
    }
    
    res.status(200).json({
      success: true,
      data: staff[0]
    });
  } catch (error) {
    console.error('获取员工详情错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 创建员工接口（管理后台使用）
router.post('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, avatar, specialty, rating } = req.body;
    
    // 为 rating 设置默认值，处理空字符串或无效值
    const validRating = (rating !== undefined && rating !== null && rating !== '') ? parseFloat(rating) : 5.0;
    // 确保 rating 在 0.0 到 5.0 之间
    const finalRating = Math.min(5.0, Math.max(0.0, isNaN(validRating) ? 5.0 : validRating));
    
    const [result] = await db.execute(
      'INSERT INTO staff (name, avatar, specialty, rating) VALUES (?, ?, ?, ?)',
      [name, avatar || '', specialty || '', finalRating]
    );
    
    res.status(200).json({
      success: true,
      data: { id: result.insertId, name, avatar, specialty, rating: finalRating }
    });
  } catch (error) {
    console.error('创建员工错误:', error);
    res.status(500).json({ success: false, message: error.message || '服务器错误' });
  }
});

// 更新员工接口（管理后台使用）
router.put('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, avatar, specialty, rating } = req.body;
    
    // 为 rating 设置默认值，处理空字符串或无效值
    const validRating = (rating !== undefined && rating !== null && rating !== '') ? parseFloat(rating) : null;
    let finalRating = null;
    if (validRating !== null) {
      // 如果提供了 rating，确保它在 0.0 到 5.0 之间
      finalRating = Math.min(5.0, Math.max(0.0, isNaN(validRating) ? 5.0 : validRating));
    }
    
    // 构建更新查询，只更新提供的字段
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (avatar !== undefined) {
      updateFields.push('avatar = ?');
      updateValues.push(avatar);
    }
    if (specialty !== undefined) {
      updateFields.push('specialty = ?');
      updateValues.push(specialty);
    }
    if (finalRating !== null) {
      updateFields.push('rating = ?');
      updateValues.push(finalRating);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: '没有提供更新字段' });
    }
    
    updateValues.push(req.params.id);
    
    await db.execute(
      `UPDATE staff SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    res.status(200).json({
      success: true,
      data: { id: req.params.id, name, avatar, specialty, rating: finalRating !== null ? finalRating : rating }
    });
  } catch (error) {
    console.error('更新员工错误:', error);
    res.status(500).json({ success: false, message: error.message || '服务器错误' });
  }
});

// 删除员工接口（管理后台使用）
router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    await db.execute(
      'UPDATE staff SET is_active = 0 WHERE id = ?',
      [req.params.id]
    );
    
    res.status(200).json({
      success: true,
      message: '员工已删除'
    });
  } catch (error) {
    console.error('删除员工错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 提交评分接口
router.post('/rating', async (req, res) => {
  try {
    console.log('收到评分请求:', req.body);
    
    const db = req.app.locals.db;
    const { staffId, appointmentId, serviceAttitude, technicalSkill, communication, totalRating, comment } = req.body;
    
    // 校验措施：范围检查
    const validateRating = (rating) => {
      if (rating < 1 || rating > 5) {
        return false;
      }
      return true;
    };
    
    if (!validateRating(serviceAttitude) || !validateRating(technicalSkill) || !validateRating(communication)) {
      return res.status(400).json({ success: false, message: '评分必须在1-5之间' });
    }
    
    // 检查是否已经评过分
    const [existingRating] = await db.execute(
      'SELECT * FROM staff_ratings WHERE appointment_id = ?',
      [appointmentId]
    );
    
    if (existingRating.length > 0) {
      return res.status(400).json({ success: false, message: '该预约已评分' });
    }
    
    // 计算最终的综合评分（确保准确性）
    const finalTotalRating = Math.round(
      (serviceAttitude * 0.4 + technicalSkill * 0.4 + communication * 0.2) * 100
    ) / 100;
    
    console.log('计算的综合评分:', finalTotalRating);
    
    // 创建评分记录
    await db.execute(
      `INSERT INTO staff_ratings (staff_id, appointment_id, service_attitude, 
       technical_skill, communication, total_rating, comment, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [staffId, appointmentId, serviceAttitude, technicalSkill, communication, finalTotalRating, comment || '']
    );
    
    console.log('评分记录创建成功！');
    
    // 更新理发师的评分（考虑时间衰减因子）
    try {
      await updateStaffRating(db, staffId);
    } catch (updateError) {
      console.error('更新理发师评分时出错（不影响评分提交）:', updateError);
    }
    
    res.status(200).json({
      success: true,
      message: '评分成功'
    });
  } catch (error) {
    console.error('提交评分错误:', error);
    res.status(500).json({ success: false, message: error.message || '服务器错误' });
  }
});

// 更新理发师评分（采用加权评分和时间衰减因子）
async function updateStaffRating(db, staffId) {
  try {
    // 获取该理发师的所有评分记录
    const [ratings] = await db.execute(
      'SELECT total_rating, created_at FROM staff_ratings WHERE staff_id = ? ORDER BY created_at DESC',
      [staffId]
    );
    
    if (ratings.length === 0) {
      return;
    }
    
    // 时间衰减因子：最近30天内的评分权重最高，超过30天的评分权重逐渐降低
    const now = new Date();
    let weightedSum = 0;
    let weightSum = 0;
    
    for (const rating of ratings) {
      const ratingDate = new Date(rating.created_at);
      const daysDiff = Math.floor((now - ratingDate) / (1000 * 60 * 60 * 24));
      
      // 时间衰减因子：评分越新权重越高
      // 公式: weight = e^(-daysDiff/30)  指数衰减，半衰期约21天
      const weight = Math.exp(-daysDiff / 30);
      
      weightedSum += rating.total_rating * weight;
      weightSum += weight;
    }
    
    // 计算加权平均分
    const newRating = weightSum > 0 ? Math.round(weightedSum / weightSum * 100) / 100 : 0;
    
    // 更新理发师的评分
    await db.execute(
      'UPDATE staff SET rating = ? WHERE id = ?',
      [newRating, staffId]
    );
    
    console.log(`理发师 ${staffId} 的评分已更新为 ${newRating}`);
  } catch (error) {
    console.error('更新理发师评分错误:', error);
  }
}

// 获取理发师评分统计
router.get('/:id/ratings', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const [ratings] = await db.execute(
      `SELECT r.*, a.appointment_date, a.appointment_time, s.name as serviceName
       FROM staff_ratings r
       LEFT JOIN appointments a ON r.appointment_id = a.id
       LEFT JOIN services s ON a.service_id = s.id
       WHERE r.staff_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    
    res.status(200).json({
      success: true,
      data: ratings
    });
  } catch (error) {
    console.error('获取理发师评分错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取所有评分列表（管理后台）
router.get('/ratings/list', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    console.log('=== 获取评分列表请求 ===');
    console.log('请求头:', req.headers);
    
    // 检查是否有用户ID（来自认证）或者是否是管理员
    let userId = null;
    try {
      const authHeader = req.headers.authorization;
      console.log('Authorization header:', authHeader);
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        console.log('Token:', token ? '有token' : '无token');
        if (token) {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          console.log('Decoded token:', decoded);
          if (decoded.userId) {
            userId = decoded.userId;
            console.log('用户ID:', userId);
          }
        }
      }
    } catch (e) {
      console.log('认证错误:', e);
      // 忽略认证错误，返回空数组
    }
    
    const { search, staffId, startDate, endDate } = req.query;
    
    let query = `
      SELECT r.*, 
             s.name as staffName,
             a.appointment_date, 
             a.appointment_time,
             sv.name as serviceName,
             u.nickName as customerName,
             u.phone as customerPhone,
             u.gender as customerGender,
             a.user_id
      FROM staff_ratings r
      LEFT JOIN staff s ON r.staff_id = s.id
      LEFT JOIN appointments a ON r.appointment_id = a.id
      LEFT JOIN services sv ON a.service_id = sv.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // 如果是用户，只返回该用户的评分
    if (userId) {
      query += ' AND a.user_id = ?';
      params.push(userId);
      console.log('添加用户筛选:', userId);
    }
    
    if (search) {
      query += ' AND (u.nickName LIKE ? OR s.name LIKE ? OR sv.name LIKE ? OR r.comment LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    if (staffId) {
      query += ' AND r.staff_id = ?';
      params.push(staffId);
    }
    
    if (startDate) {
      query += ' AND DATE(a.appointment_date) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND DATE(a.appointment_date) <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY r.created_at DESC';
    
    console.log('执行查询:', query);
    console.log('查询参数:', params);
    
    const [ratings] = await db.execute(query, params);
    console.log('查询到的评分数量:', ratings.length);
    console.log('查询结果:', ratings);
    
    // 保持下划线命名（管理后台使用）
    const formattedRatings = ratings.map(rating => ({
      id: rating.id,
      staff_id: rating.staff_id,
      appointment_id: rating.appointment_id,
      service_attitude: rating.service_attitude,
      technical_skill: rating.technical_skill,
      communication: rating.communication,
      total_rating: rating.total_rating,
      comment: rating.comment,
      created_at: rating.created_at,
      staffName: rating.staffName,
      appointment_date: rating.appointment_date,
      appointment_time: rating.appointment_time,
      serviceName: rating.serviceName,
      customerName: rating.customerName,
      customerPhone: rating.customerPhone,
      customerGender: rating.customerGender
    }));
    
    console.log('格式化后的评分:', formattedRatings);
    
    res.status(200).json({
      success: true,
      data: formattedRatings
    });
  } catch (error) {
    console.error('获取评分列表错误:', error);
    res.status(200).json({
      success: true,
      data: []
    });
  }
});

module.exports = router;