const express = require('express');
const router = express.Router();

// 获取服务列表接口
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const [services] = await db.execute(
      'SELECT id, name, price, duration, description FROM services WHERE is_active = 1'
    );
    res.status(200).json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('获取服务列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取服务详情接口
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const [services] = await db.execute(
      'SELECT id, name, price, duration, description FROM services WHERE id = ? AND is_active = 1',
      [req.params.id]
    );
    if (services.length === 0) {
      return res.status(404).json({ success: false, message: '服务不存在' });
    }
    res.status(200).json({
      success: true,
      data: services[0]
    });
  } catch (error) {
    console.error('获取服务详情错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 创建服务接口（管理后台使用）
router.post('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, price, duration, description } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO services (name, price, duration, description) VALUES (?, ?, ?, ?)',
      [name, price, duration, description]
    );
    
    res.status(200).json({
      success: true,
      data: { id: result.insertId, name, price, duration, description }
    });
  } catch (error) {
    console.error('创建服务错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新服务接口（管理后台使用）
router.put('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, price, duration, description } = req.body;
    
    await db.execute(
      'UPDATE services SET name = ?, price = ?, duration = ?, description = ? WHERE id = ?',
      [name, price, duration, description, req.params.id]
    );
    
    res.status(200).json({
      success: true,
      data: { id: req.params.id, name, price, duration, description }
    });
  } catch (error) {
    console.error('更新服务错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 删除服务接口（管理后台使用）
router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await db.execute(
      'UPDATE services SET is_active = 0 WHERE id = ?',
      [req.params.id]
    );
    
    res.status(200).json({
      success: true,
      message: '服务已删除'
    });
  } catch (error) {
    console.error('删除服务错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;