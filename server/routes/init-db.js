const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

function splitStatements(sql) {
  const statements = [];
  let current = '';
  let inComment = false;
  let inString = false;
  let stringChar = '';
  let i = 0;

  while (i < sql.length) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    if (!inString) {
      if (char === '-' && nextChar === '-') {
        inComment = true;
        current += char;
        i++;
        continue;
      }
      if (inComment && char === '\n') {
        inComment = false;
        current += char;
        i++;
        continue;
      }
      if (inComment) {
        current += char;
        i++;
        continue;
      }
    }

    if ((char === "'" || char === '"') && sql[i - 1] !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }

    if (char === ';' && !inString && !inComment) {
      const stmt = current.trim();
      if (stmt.length > 0) {
        statements.push(stmt);
      }
      current = '';
      i++;
      continue;
    }

    current += char;
    i++;
  }

  const last = current.trim();
  if (last.length > 0) {
    statements.push(last);
  }

  return statements;
}

router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  
  try {
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'schema.sql 文件不存在',
        path: schemaPath
      });
    }

    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    let statements = splitStatements(sql);
    
    statements = statements.filter(s => {
      const upper = s.toUpperCase().trim();
      return !upper.startsWith('CREATE DATABASE') 
          && !upper.startsWith('USE ');
    });

    const totalStatements = statements.length;
    const results = [];
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await db.query(statement);
        successCount++;
        results.push({ 
          index: i + 1, 
          success: true, 
          type: statement.toUpperCase().split('(')[0].substring(0, 30).replace(/\n/g, ' ')
        });
      } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.errno === 1050) {
          skippedCount++;
          results.push({ 
            index: i + 1, 
            success: true, 
            skipped: '表已存在', 
            type: statement.toUpperCase().split('(')[0].substring(0, 30).replace(/\n/g, ' ')
          });
        } else if (err.code === 'ER_DUP_KEYNAME' || err.errno === 1061) {
          skippedCount++;
          results.push({ 
            index: i + 1, 
            success: true, 
            skipped: '索引已存在', 
            type: statement.toUpperCase().split('(')[0].substring(0, 30).replace(/\n/g, ' ')
          });
        } else if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
          skippedCount++;
          results.push({ 
            index: i + 1, 
            success: true, 
            skipped: '数据已存在', 
            type: statement.toUpperCase().split('(')[0].substring(0, 30).replace(/\n/g, ' ')
          });
        } else {
          errorCount++;
          results.push({ 
            index: i + 1, 
            success: false, 
            error: err.message, 
            errorCode: err.code,
            type: statement.toUpperCase().split('(')[0].substring(0, 30).replace(/\n/g, ' ')
          });
        }
      }
    }

    const [tables] = await db.execute('SHOW TABLES;');
    const tableNames = tables.map(t => Object.values(t)[0]);

    res.json({
      success: errorCount === 0 || (successCount + skippedCount > 0),
      message: errorCount === 0 ? '数据库初始化完成' : `数据库初始化完成（有${errorCount}个错误）`,
      totalStatements,
      successCount,
      skippedCount,
      errorCount,
      tableCount: tableNames.length,
      tables: tableNames,
      first5Statements: statements.slice(0, 5).map(s => s.substring(0, 50).replace(/\n/g, ' ')),
      details: results
    });

  } catch (err) {
    console.error('数据库初始化失败:', err);
    res.status(500).json({
      success: false,
      message: '数据库初始化失败',
      error: err.message,
      stack: err.stack
    });
  }
});

module.exports = router;
