const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT认证中间件
const authMiddleware = async (req, res, next) => {
  try {
    // 获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 40100,
        message: '未提供认证令牌'
      });
    }

    const token = authHeader.substring(7);

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 将用户信息附加到请求对象
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 40101,
        message: '令牌已过期'
      });
    }
    
    return res.status(401).json({
      code: 40102,
      message: '无效的令牌'
    });
  }
};

// 可选的认证中间件（允许未登录用户访问）
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role
      };
    }
    
    next();
  } catch (error) {
    // 忽略错误，允许继续
    next();
  }
};

/**
 * 角色权限中间件
 * @param {Array<string>} allowedRoles - 允许访问的角色数组，例如 ['admin', 'editor']
 * @returns {Function} Express中间件函数
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 40100,
        message: '未登录'
      });
    }

    const userRole = req.user.role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        code: 40300,
        message: '无权访问此资源'
      });
    }

    next();
  };
};

/**
 * 管理员权限中间件（仅限admin）
 */
const adminOnly = roleMiddleware(['admin']);

/**
 * 管理员和编辑权限中间件（admin和editor都可访问）
 */
const adminOrEditor = roleMiddleware(['admin', 'editor']);

/**
 * 检查是否为作品所有者或管理员/编辑
 * @param {Object} work - 作品对象
 * @param {Object} user - 用户对象 {userId, role}
 * @returns {boolean}
 */
const canEditWork = (work, user) => {
  // 管理员可以编辑所有作品
  if (user.role === 'admin') {
    return true;
  }
  
  // 编辑可以编辑所有作品（仅限内容质量方面）
  if (user.role === 'editor') {
    return true;
  }
  
  // 普通用户只能编辑自己的作品
  return work.user_id === user.userId;
};

/**
 * 检查是否可以删除作品
 * @param {Object} work - 作品对象
 * @param {Object} user - 用户对象 {userId, role}
 * @returns {boolean}
 */
const canDeleteWork = (work, user) => {
  // 只有管理员和作品所有者可以删除作品
  if (user.role === 'admin') {
    return true;
  }
  
  // 编辑不能删除作品
  if (user.role === 'editor') {
    return false;
  }
  
  // 普通用户只能删除自己的作品
  return work.user_id === user.userId;
};

/**
 * 检查是否可以管理用户
 * @param {string} role - 用户角色
 * @returns {boolean}
 */
const canManageUsers = (role) => {
  // 只有管理员可以管理用户
  return role === 'admin';
};

module.exports = {
  authMiddleware,
  optionalAuth,
  roleMiddleware,
  adminOnly,
  adminOrEditor,
  canEditWork,
  canDeleteWork,
  canManageUsers
};
