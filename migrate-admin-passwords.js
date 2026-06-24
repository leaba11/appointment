const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const readline = require('readline');

dotenv.config();

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 提问函数
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function migrate() {
  console.log('=' .repeat(50));
  console.log('管理员密码安全迁移工具');
  console.log('=' .repeat(50));
  console.log();
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'wechat_manage'
  });
  
  try {
    console.log('正在连接数据库...');
    console.log('数据库连接成功！');
    console.log();
    
    // 获取所有管理员
    const [admins] = await connection.execute('SELECT id, username, password FROM admins');
    
    console.log(`找到 ${admins.length} 个管理员账户`);
    console.log();
    
    // 检查哪些是明文密码
    const plainTextAdmins = admins.filter(admin => 
      !admin.password.startsWith('$2a$') && !admin.password.startsWith('$2b$')
    );
    
    if (plainTextAdmins.length === 0) {
      console.log('所有管理员密码已经是加密存储！无需迁移。');
      rl.close();
      return;
    }
    
    console.log(`发现 ${plainTextAdmins.length} 个管理员使用明文密码：`);
    plainTextAdmins.forEach(admin => {
      console.log(`  - ${admin.username} (ID: ${admin.id})`);
    });
    console.log();
    
    const choice = await question(
      '请选择操作：\n' +
      '  1) 使用登录时自动升级（推荐，不修改现有数据）\n' +
      '  2) 批量更新所有管理员为默认强密码\n' +
      '  3) 取消\n' +
      '请输入选项 (1/2/3): '
    );
    
    if (choice === '2') {
      const defaultPassword = await question('请输入新的默认密码 (最少8位，需包含数字、字母和特殊字符): ');
      
      // 验证密码复杂度
      if (!defaultPassword || defaultPassword.length < 8) {
        console.error('密码长度至少为8位！');
        rl.close();
        return;
      }
      
      if (!/\d/.test(defaultPassword)) {
        console.error('密码必须包含至少一个数字！');
        rl.close();
        return;
      }
      
      if (!/[a-zA-Z]/.test(defaultPassword)) {
        console.error('密码必须包含至少一个字母！');
        rl.close();
        return;
      }
      
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(defaultPassword)) {
        console.error('密码必须包含至少一个特殊字符！');
        rl.close();
        return;
      }
      
      const confirm = await question(`确认将所有 ${plainTextAdmins.length} 个管理员的密码更新为 \"${defaultPassword}\"? (yes/no): `);
      
      if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        for (const admin of plainTextAdmins) {
          await connection.execute(
            'UPDATE admins SET password = ? WHERE id = ?',
            [hashedPassword, admin.id]
          );
          console.log(`  ✅ 已更新: ${admin.username}`);
        }
        
        console.log();
        console.log('=' .repeat(50));
        console.log('密码更新完成！');
        console.log('=' .repeat(50));
      } else {
        console.log('操作已取消。');
      }
    } else if (choice === '1') {
      console.log();
      console.log('好的！系统已配置为登录时自动升级密码。');
      console.log('当管理员下次使用旧密码登录时，密码将自动加密存储。');
    } else {
      console.log('操作已取消。');
    }
    
  } catch (error) {
    console.error('迁移过程出错:', error);
  } finally {
    await connection.end();
    rl.close();
    console.log();
    console.log('迁移工具已退出。');
  }
}

migrate().catch(console.error);
