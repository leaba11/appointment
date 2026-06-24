const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 密码复杂度验证函数
function validatePasswordComplexity(password) {
  if (!password || password.length < 8) {
    return { valid: false, message: '密码长度至少为8位' };
  }
  
  // 检查是否包含数字
  if (!/\d/.test(password)) {
    return { valid: false, message: '密码必须包含至少一个数字' };
  }
  
  // 检查是否包含字母
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: '密码必须包含至少一个字母' };
  }
  
  // 检查是否包含特殊字符
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: '密码必须包含至少一个特殊字符' };
  }
  
  return { valid: true, message: '密码复杂度符合要求' };
}

// 创建管理员接口（仅超级管理员可用）
router.post('/create', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { username, password, role = 'admin' } = req.body;
    
    // 验证密码复杂度
    const passwordValidation = validatePasswordComplexity(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: passwordValidation.message 
      });
    }
    
    // 检查用户名是否已存在
    const [existingAdmins] = await db.execute(
      'SELECT * FROM admins WHERE username = ?',
      [username]
    );
    
    if (existingAdmins.length > 0) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }
    
    // 使用bcrypt加密密码，工作因子为10
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建管理员 - 存储加密后的密码
    const [result] = await db.execute(
      'INSERT INTO admins (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );
    
    res.status(200).json({
      success: true,
      data: {
        id: result.insertId,
        username,
        role
      }
    });
  } catch (error) {
    console.error('创建管理员错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 管理员登录接口
router.post('/login', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { username, password } = req.body;
    
    const [admins] = await db.execute(
      'SELECT * FROM admins WHERE username = ? AND is_active = 1',
      [username]
    );
    
    if (admins.length === 0) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    
    const admin = admins[0];
    
    // 验证密码 - 兼容明文和加密密码
    let isPasswordValid = false;
    if (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$')) {
      // 加密密码，使用bcrypt验证
      isPasswordValid = await bcrypt.compare(password, admin.password);
    } else {
      // 明文密码，直接比较
      isPasswordValid = (password === admin.password);
    }
    
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    
    // 如果密码是明文，则自动升级为加密存储
    if (!admin.password.startsWith('$2a$') && !admin.password.startsWith('$2b$')) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.execute(
        'UPDATE admins SET password = ? WHERE id = ?',
        [hashedPassword, admin.id]
      );
      console.log(`管理员 ${username} 的密码已自动升级为加密存储`);
    }
    
    // 生成JWT token
    const token = jwt.sign(
      { adminId: admin.id, role: admin.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.status(200).json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          role: admin.role
        }
      }
    });
  } catch (error) {
    console.error('管理员登录错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 重置管理员密码接口
router.post('/reset-password', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { username, oldPassword, newPassword } = req.body;
    
    // 验证新密码复杂度
    const passwordValidation = validatePasswordComplexity(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: passwordValidation.message 
      });
    }
    
    // 获取管理员信息
    const [admins] = await db.execute(
      'SELECT * FROM admins WHERE username = ? AND is_active = 1',
      [username]
    );
    
    if (admins.length === 0) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    
    const admin = admins[0];
    
    // 验证旧密码（兼容明文和加密密码）
    let isOldPasswordValid = false;
    if (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$')) {
      // 加密密码，使用bcrypt验证
      isOldPasswordValid = await bcrypt.compare(oldPassword, admin.password);
    } else {
      // 明文密码，直接比较
      isOldPasswordValid = (oldPassword === admin.password);
    }
    
    if (!isOldPasswordValid) {
      return res.status(401).json({ success: false, message: '原密码错误' });
    }
    
    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // 更新密码
    await db.execute(
      'UPDATE admins SET password = ? WHERE id = ?',
      [hashedNewPassword, admin.id]
    );
    
    res.status(200).json({
      success: true,
      message: '密码重置成功'
    });
  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;