const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  
  try {
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'schema.sql 文件不存在' 
      });
    }

    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
      .filter(s => !s.match(/^CREATE\s+DATABASE/i) && !s.match(/^USE\s+/i));

    const results = [];
    for (const statement of statements) {
      try {
        await db.query(statement);
        results.push({ success: true, preview: statement.substring(0, 60).replace(/\n/g, ' ') + '...' });
      } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.errno === 1050) {
          results.push({ success: true, skipped: '表已存在', preview: statement.substring(0, 60).replace(/\n/g, ' ') + '...' });
        } else if (err.code === 'ER_DUP_KEYNAME' || err.errno === 1061) {
          results.push({ success: true, skipped: '索引已存在', preview: statement.substring(0, 60).replace(/\n/g, ' ') + '...' });
        } else {
          results.push({ success: false, error: err.message, preview: statement.substring(0, 60).replace(/\n/g, ' ') + '...' });
        }
      }
    }

    const [tables] = await db.execute('SHOW TABLES;');
    const tableNames = tables.map(t => Object.values(t)[0]);

    res.json({
      success: true,
      message: '数据库初始化完成',
      executedStatements: results.length,
      tableCount: tableNames.length,
      tables: tableNames,
      details: results
    });

  } catch (err) {
    console.error('数据库初始化失败:', err);
    res.status(500).json({
      success: false,
      message: '数据库初始化失败',
      error: err.message
    });
  }
});

module.exports = router;
