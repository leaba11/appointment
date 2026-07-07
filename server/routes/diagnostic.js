const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  
  const diagnostics = {
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DB_HOST: process.env.DB_HOST ? process.env.DB_HOST.substring(0, 20) + '...' : 'not set',
      DB_PORT: process.env.DB_PORT || 'not set',
      DB_USER: process.env.DB_USER || 'not set',
      DB_NAME: process.env.DB_NAME || 'not set',
      DB_SSL: process.env.DB_SSL || 'not set',
      JWT_SECRET: process.env.JWT_SECRET ? (process.env.JWT_SECRET.substring(0, 10) + '...') : 'not set'
    },
    tests: {}
  };

  try {
    const connection = await db.getConnection();
    diagnostics.tests.connection = { success: true, message: '数据库连接成功' };
    
    const [tables] = await connection.execute('SHOW TABLES;');
    diagnostics.tests.tables = { 
      success: true, 
      count: tables.length,
      tables: tables.map(t => Object.values(t)[0])
    };
    
    try {
      const [services] = await connection.execute('SELECT * FROM services LIMIT 3;');
      diagnostics.tests.services = { success: true, count: services.length, data: services };
    } catch (err) {
      diagnostics.tests.services = { success: false, error: err.message };
    }
    
    try {
      const [admins] = await connection.execute('SELECT id, username, role FROM admins LIMIT 3;');
      diagnostics.tests.admins = { success: true, count: admins.length, data: admins };
    } catch (err) {
      diagnostics.tests.admins = { success: false, error: err.message };
    }
    
    connection.release();
    res.json({
      success: true,
      diagnostics
    });
  } catch (err) {
    diagnostics.tests.connection = { success: false, error: err.message, code: err.code };
    res.json({
      success: false,
      message: '诊断失败',
      diagnostics
    });
  }
});

module.exports = router;
