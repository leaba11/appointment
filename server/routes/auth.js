const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/auth');
const crypto = require('crypto');

/**
 * 生成稳定的用户标识
 * 使用微信登录 code 和用户信息生成相对稳定的用户ID
 * 同一微信用户使用相同的标识
 */
function generateStableUserId(code, userInfo, phone) {
  // 优先使用手机号作为稳定标识（如果有）
  if (phone && phone.length >= 11) {
    return 'openid_phone_' + crypto.createHash('md5').update(phone).digest('hex').substring(0, 16);
  }
  
  // 如果有用户昵称，使用昵称+code前缀生成稳定标识
  if (userInfo && userInfo.nickName) {
    const nickNameHash = crypto.createHash('md5').update(userInfo.nickName).digest('hex').substring(0, 12);
    return 'openid_nick_' + nickNameHash;
  }
  
  // 如果有code，使用code生成临时标识（每次登录会变化，不够稳定）
  if (code) {
    return 'openid_code_' + crypto.createHash('md5').update(code).digest('hex').substring(0, 16);
  }
  
  // 兜底方案：使用固定标识
  return 'openid_demo_user_123';
}

/**
 * 查找用户：优先通过openid，其次通过手机号
 */
async function findUser(db, openid, phone) {
  // 首先通过 openid 查找
  let [users] = await db.execute('SELECT * FROM users WHERE openid = ?', [openid]);
  if (users.length > 0) {
    return { user: users[0], foundBy: 'openid' };
  }
  
  // 如果没找到且有手机号，通过手机号查找
  if (phone && phone.length >= 11) {
    [users] = await db.execute('SELECT * FROM users WHERE phone = ?', [phone]);
    if (users.length > 0) {
      return { user: users[0], foundBy: 'phone' };
    }
  }
  
  return { user: null, foundBy: null };
}

// 登录接口
router.post('/login', async (req, res) => {
  try {
    const { code, userInfo, gender, phone, deviceId } = req.body || {};
    console.log('接收到登录请求:', { code: code ? code.substring(0, 10) + '...' : null, userInfo, gender, phone, deviceId });
    const db = req.app.locals.db;
    
    // 生成稳定的用户标识
    const openid = generateStableUserId(code, userInfo, phone);
    console.log('使用的稳定用户标识:', openid);
    
    // 查找用户
    const { user: existingUser, foundBy } = await findUser(db, openid, phone);
    
    // 根据性别设置头像
    const avatarUrl = gender === 'male' ? '/images/1.png' : '/images/2.png';
    
    let user;
    if (!existingUser) {
      // 创建新用户
      const nickName = (userInfo && userInfo.nickName) || '微信用户';
      const genderValue = gender || '';
      const phoneValue = phone || '';
      
      const [result] = await db.execute(
        'INSERT INTO users (openid, nickName, phone, avatarUrl, gender, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [openid, nickName, phoneValue, avatarUrl, genderValue]
      );
      
      user = {
        id: result.insertId,
        openid,
        nickName: nickName,
        phone: phoneValue,
        avatarUrl: avatarUrl,
        gender: genderValue
      };
      console.log('创建新用户:', { id: user.id, nickName: user.nickName, openid: user.openid });
    } else {
      user = existingUser;
      console.log('找到已有用户:', { id: user.id, nickName: user.nickName, foundBy });
      
      // 如果是通过手机号找到的，更新 openid（让后续登录能直接通过 openid 找到）
      if (foundBy === 'phone' && user.openid !== openid) {
        console.log('更新用户 openid:', { oldOpenid: user.openid, newOpenid: openid });
        await db.execute(
          'UPDATE users SET openid = ? WHERE id = ?',
          [openid, user.id]
        );
        user.openid = openid;
      }
      
      // 更新用户信息（保留原手机号，除非有新手机号）
      const nickName = (userInfo && userInfo.nickName) || user.nickName;
      const genderValue = gender || user.gender || '';
      const phoneValue = phone || user.phone || '';
      
      await db.execute(
        'UPDATE users SET nickName = ?, avatarUrl = ?, gender = ?, phone = ? WHERE id = ?',
        [nickName, avatarUrl, genderValue, phoneValue, user.id]
      );
      
      user.nickName = nickName;
      user.avatarUrl = avatarUrl;
      user.gender = genderValue;
      user.phone = phoneValue;
      console.log('更新用户信息:', user);
    }
    
    // 生成JWT token（有效期7天）
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { userId: user.id },
      jwtSecret,
      { expiresIn: '7d' }
    );
    
    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          openid: user.openid,
          nickName: user.nickName,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          gender: user.gender
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取用户信息接口
router.get('/user', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user.id;
    
    const [users] = await db.execute(
      'SELECT id, openid, nickName, phone, avatarUrl, gender FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    res.status(200).json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新用户信息接口
router.put('/update', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { nickName, phone, gender } = req.body;
    const userId = req.user.id;
    
    // 根据性别设置头像，使用本地图片路径
    const avatarUrl = gender === 'male' ? '/images/1.png' : '/images/2.png';
    
    const [result] = await db.execute(
      'UPDATE users SET nickName = ?, phone = ?, avatarUrl = ?, gender = ? WHERE id = ?',
      [nickName, phone, avatarUrl, gender, userId]
    );
    
    res.status(200).json({
      success: true,
      message: '用户信息更新成功'
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 绑定手机号接口
router.post('/bind-phone', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { code } = req.body;
    const userId = req.user.id;
    
    // 这里应该调用微信小程序的接口解密手机号
    const phone = '138' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    
    // 更新用户手机号
    const [result] = await db.execute(
      'UPDATE users SET phone = ? WHERE id = ?',
      [phone, userId]
    );
    
    res.status(200).json({
      success: true,
      data: {
        phone
      }
    });
  } catch (error) {
    console.error('绑定手机号错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
