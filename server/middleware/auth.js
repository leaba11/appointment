const jwt = require('jsonwebtoken');

/**
 * 认证中间件
 * 验证 JWT token 并提取用户信息
 */
function authenticate(req, res, next) {
  try {
    // 1. 检查 authorization header 是否存在
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: '请先登录',
        code: 'TOKEN_MISSING'
      });
    }

    // 2. 提取 token（格式：Bearer <token>）
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ 
        success: false, 
        message: '认证格式错误',
        code: 'TOKEN_FORMAT_INVALID'
      });
    }

    const token = parts[1];

    // 3. 验证 token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'; // 与登录接口保持一致

    try {
      const decoded = jwt.verify(token, jwtSecret);
      
      // 4. 将用户信息附加到 request 对象
      req.user = {
        id: decoded.userId,
      };
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: '登录已过期，请重新登录',
          code: 'TOKEN_EXPIRED'
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false, 
          message: '认证无效，请重新登录',
          code: 'TOKEN_INVALID'
        });
      } else {
        console.error('Token 验证错误:', error);
        return res.status(401).json({ 
          success: false, 
          message: '认证失败',
          code: 'AUTH_ERROR'
        });
      }
    }
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * 可选认证中间件
 * 如果提供了 token 则验证，没有 token 也可以继续
 */
function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    if (!jwtSecret) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = {
        id: decoded.userId,
      };
    } catch (error) {
      // 可选认证失败时不阻止请求
      console.warn('可选认证失败:', error.message);
    }
    
    next();
  } catch (error) {
    console.error('可选认证中间件错误:', error);
    next();
  }
}

module.exports = {
  authenticate,
  optionalAuthenticate
};
