# 微信小程序商户预约系统启动脚本
# PowerShell版本

# 显示菜单
function Show-Menu {
    Clear-Host
    Write-Host "======================================="
    Write-Host "微信小程序商户预约系统启动脚本"
    Write-Host "======================================="
    Write-Host ""
    Write-Host "1. 测试数据库连接"
    Write-Host "2. 启动服务器"
    Write-Host "3. 查看服务器状态"
    Write-Host "4. 退出"
    Write-Host ""
}

# 测试数据库连接
function Test-DBConnection {
    Write-Host ""
    Write-Host "=== 测试数据库连接 ==="
    Write-Host "正在连接MySQL数据库..."
    Write-Host "连接设置: localhost:3306, 用户名: root, 密码: 1234"
    Write-Host ""
    Read-Host "按Enter键继续..."
    
    try {
        # 尝试使用MySQL命令行工具测试连接
        $cmd = 'mysql -h localhost -P 3306 -u root -p1234 -e "SELECT 1;"'
        $result = Invoke-Expression $cmd
        Write-Host "[成功] MySQL命令行连接成功！"
        
        # 检查数据库是否存在
        $cmd_check_db = 'mysql -h localhost -P 3306 -u root -p1234 -e "SHOW DATABASES LIKE \"wechat_manage\";"'
        $result_db = Invoke-Expression $cmd_check_db
        
        if ($result_db -like "*wechat_manage*") {
            Write-Host "[成功] 数据库 wechat_manage 存在！"
            
            # 检查表结构
            $cmd_check_tables = 'mysql -h localhost -P 3306 -u root -p1234 wechat_manage -e "SHOW TABLES;"'
            $result_tables = Invoke-Expression $cmd_check_tables
            Write-Host "[信息] 数据库表结构:"
            Write-Host $result_tables
        } else {
            Write-Host "[错误] 数据库 wechat_manage 不存在！"
            Write-Host "[提示] 请运行 database/schema.sql 创建数据库和表结构"
            
            # 尝试创建数据库
            Write-Host "[信息] 尝试创建数据库..."
            $cmd_create_db = 'mysql -h localhost -P 3306 -u root -p1234 -e "CREATE DATABASE IF NOT EXISTS wechat_manage DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"'
            $result_create = Invoke-Expression $cmd_create_db
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[成功] 数据库创建成功！"
                # 导入schema.sql
                Write-Host "[信息] 尝试导入数据库表结构..."
                $cmd_import = 'mysql -h localhost -P 3306 -u root -p1234 wechat_manage < database\schema.sql'
                $result_import = Invoke-Expression $cmd_import
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "[成功] 数据库表结构导入成功！"
                } else {
                    Write-Host "[错误] 数据库表结构导入失败！"
                }
            } else {
                Write-Host "[错误] 数据库创建失败！"
            }
        }
    } catch {
        Write-Host "[错误] 测试连接失败: $_"
    }
    
    Write-Host ""
    Read-Host "按Enter键返回菜单..."
}

# 启动服务器
function Start-Server {
    Write-Host ""
    Write-Host "=== 启动服务器 ==="
    Write-Host "正在启动Node.js服务器..."
    Write-Host "服务器地址: http://localhost:3000"
    Write-Host "数据库配置: localhost:3306, 用户名: root, 密码: 1234"
    Write-Host ""
    Read-Host "按Enter键继续..."
    
    # 检查是否安装了npm
    try {
        npm --version | Out-Null
    } catch {
        Write-Host "[错误] Node.js未安装，请先安装Node.js"
        Read-Host "按Enter键返回菜单..."
        return
    }
    
    # 进入server目录
    Set-Location .\server
    
    # 检查是否安装了依赖
    if (-not (Test-Path "node_modules")) {
        Write-Host "[信息] 正在安装依赖..."
        try {
            npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Host "[错误] 依赖安装失败"
                Set-Location ..
                Read-Host "按Enter键返回菜单..."
                return
            }
        } catch {
            Write-Host "[错误] 依赖安装失败: $_"
            Set-Location ..
            Read-Host "按Enter键返回菜单..."
            return
        }
    }
    
    # 启动服务器
    Write-Host "[信息] 正在启动服务器..."
    Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Normal -WorkingDirectory .
    
    Set-Location ..
    Write-Host "服务器已启动，请在浏览器中访问 http://localhost:3000/health 检查服务器状态"
    Write-Host "注意：服务器启动需要一定时间，请耐心等待..."
    Write-Host ""
    Read-Host "按Enter键返回菜单..."
}

# 查看服务器状态
function Check-ServerStatus {
    Write-Host ""
    Write-Host "=== 服务器状态检查 ==="
    Write-Host "正在检查服务器状态..."
    Write-Host ""
    
    try {
        $response = Invoke-WebRequest -Uri 'http://localhost:3000/health' -UseBasicParsing
        Write-Host "[成功] 服务器运行正常！"
        Write-Host "响应内容:"
        Write-Host $response.Content
    } catch {
        Write-Host "[错误] 服务器未运行或无法访问"
    }
    
    Write-Host ""
    Read-Host "按Enter键返回菜单..."
}

# 主循环
while ($true) {
    Show-Menu
    $choice = Read-Host "请选择操作 (1-4)"
    
    switch ($choice) {
        '1' { Test-DBConnection }
        '2' { Start-Server }
        '3' { Check-ServerStatus }
        '4' {
            Write-Host "退出脚本..."
            Read-Host "按Enter键退出..."
            exit
        }
        default {
            Write-Host "输入有误，请重新选择"
            Read-Host "按Enter键继续..."
        }
    }
}
