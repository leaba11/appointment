const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET;

function verifyToken(token) {
  if (!jwtSecret) {
    throw new Error('JWT_SECRET_NOT_CONFIGURED');
  }
  return jwt.verify(token, jwtSecret);
}

function extractToken(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

function sendAuthError(res, status, message, code) {
  return res.status(status).json({ success: false, message, code });
}

function authenticate(req, res, next) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return sendAuthError(res, 401, '请先登录', 'TOKEN_MISSING');
    }

    try {
      const decoded = verifyToken(token);
      req.user = { id: decoded.userId };
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return sendAuthError(res, 401, '登录已过期，请重新登录', 'TOKEN_EXPIRED');
      }
      return sendAuthError(res, 401, '认证无效，请重新登录', 'TOKEN_INVALID');
    }
  } catch (error) {
    console.error('认证中间件错误:', error);
    return sendAuthError(res, 500, '服务器错误', 'SERVER_ERROR');
  }
}

function adminAuthenticate(req, res, next) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return sendAuthError(res, 401, '请先登录', 'TOKEN_MISSING');
    }

    try {
      const decoded = verifyToken(token);
      if (!decoded.adminId) {
        return sendAuthError(res, 403, '权限不足，仅管理员可访问', 'PERMISSION_DENIED');
      }
      req.admin = {
        id: decoded.adminId,
        role: decoded.role || 'admin'
      };
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return sendAuthError(res, 401, '登录已过期，请重新登录', 'TOKEN_EXPIRED');
      }
      return sendAuthError(res, 401, '认证无效，请重新登录', 'TOKEN_INVALID');
    }
  } catch (error) {
    console.error('管理员认证中间件错误:', error);
    return sendAuthError(res, 500, '服务器错误', 'SERVER_ERROR');
  }
}

function optionalAuthenticate(req, res, next) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token || !jwtSecret) return next();

    try {
      const decoded = verifyToken(token);
      if (decoded.userId) {
        req.user = { id: decoded.userId };
      }
      if (decoded.adminId) {
        req.admin = { id: decoded.adminId, role: decoded.role || 'admin' };
      }
    } catch (error) {
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
  adminAuthenticate,
  optionalAuthenticate
};
