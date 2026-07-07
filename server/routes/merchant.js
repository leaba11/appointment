const express = require('express');
const { adminAuthenticate } = require('../middleware/auth');
const router = express.Router();

// 获取商户信息接口
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const [merchant] = await db.execute('SELECT * FROM merchant LIMIT 1');
    
    if (merchant.length === 0) {
      // 如果商户信息不存在，创建一个默认商户
      await db.execute(
        'INSERT INTO merchant (name, address, phone, description) VALUES (?, ?, ?, ?)',
        ['示例商户', '北京市朝阳区某某街道', '13800138000', '专业提供各类服务，品质保证，价格合理']
      );
      return res.status(200).json({
        success: true,
        data: {
          name: '示例商户',
          address: '北京市朝阳区某某街道',
          phone: '13800138000',
          description: '专业提供各类服务，品质保证，价格合理'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: merchant[0]
    });
  } catch (error) {
    console.error('获取商户信息错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新商户信息接口（管理后台使用）
router.put('/', adminAuthenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, address, phone, description } = req.body;
    
    const [merchant] = await db.execute('SELECT * FROM merchant LIMIT 1');
    
    if (merchant.length > 0) {
      await db.execute(
        'UPDATE merchant SET name = ?, address = ?, phone = ?, description = ? WHERE id = ?',
        [name, address, phone, description, merchant[0].id]
      );
    } else {
      await db.execute(
        'INSERT INTO merchant (name, address, phone, description) VALUES (?, ?, ?, ?)',
        [name, address, phone, description]
      );
    }
    
    res.status(200).json({
      success: true,
      data: { name, address, phone, description }
    });
  } catch (error) {
    console.error('更新商户信息错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;