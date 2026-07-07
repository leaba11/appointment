const express = require('express');
const router = express.Router();

const TABLES = [
  'merchant',
  'services',
  'staff',
  'queue',
  'admins',
  'users',
  'appointments',
  'queue_records',
  'staff_ratings',
  'revenue_records'
];

router.post('/', async (req, res) => {
  const db = req.app.locals.db;
  
  try {
    const { tables, overwrite = false } = req.body;
    
    if (!tables || typeof tables !== 'object') {
      return res.status(400).json({
        success: false,
        message: '缺少 tables 数据'
      });
    }

    await db.query('SET FOREIGN_KEY_CHECKS = 0');

    const results = {};
    let totalMigrated = 0;

    for (const tableName of TABLES) {
      if (!tables[tableName] || !Array.isArray(tables[tableName])) {
        results[tableName] = { skipped: true, reason: '无数据' };
        continue;
      }

      const rows = tables[tableName];
      if (rows.length === 0) {
        results[tableName] = { skipped: true, reason: '空数组' };
        continue;
      }

      try {
        if (overwrite) {
          try {
            await db.query(`DELETE FROM ${tableName}`);
          } catch (e) {}
        }

        let inserted = 0;
        let failed = 0;
        const errors = [];

        for (const row of rows) {
          const columns = Object.keys(row);
          const placeholders = columns.map(() => '?').join(', ');
          const values = columns.map(col => row[col]);
          const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

          try {
            await db.query(sql, values);
            inserted++;
            totalMigrated++;
          } catch (err) {
            failed++;
            if (errors.length < 3) {
              errors.push(err.message.substring(0, 100));
            }
          }
        }

        results[tableName] = { total: rows.length, inserted, failed, errors: errors.length > 0 ? errors : undefined };
      } catch (err) {
        results[tableName] = { error: err.message };
      }
    }

    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    res.json({
      success: true,
      message: `数据导入完成，共 ${totalMigrated} 条记录`,
      totalMigrated,
      results
    });

  } catch (err) {
    console.error('数据导入失败:', err);
    res.status(500).json({
      success: false,
      message: '数据导入失败',
      error: err.message
    });
  }
});

module.exports = router;
