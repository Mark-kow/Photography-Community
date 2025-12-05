const db = require('../config/database');
const redisClient = require('../config/redis');
const { 
  generateTokens, 
  hashPassword, 
  comparePassword,
  generateVerifyCode,
  successResponse,
  errorResponse
} = require('../utils/helpers');

/**
 * 发送验证码
 */
exports.sendVerifyCode = async (req, res) => {
  try {
    const { phone } = req.body;

    // 验证手机号格式
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json(errorResponse(10001, '手机号格式不正确'));
    }

    // 检查验证码发送频率（60秒内只能发送一次）
    const cacheKey = `verify_code:${phone}`;
    const existing = await redisClient.get(cacheKey);
    
    if (existing) {
      const ttl = await redisClient.ttl(cacheKey);
      return res.status(429).json(errorResponse(10002, `请${ttl}秒后再试`));
    }

    // 生成验证码
    const code = generateVerifyCode();
    
    // 存储验证码到Redis（5分钟过期）
    await redisClient.setEx(cacheKey, 300, code);

    // TODO: 实际项目中这里应该调用短信服务商API发送验证码
    console.log(`📱 发送验证码到 ${phone}: ${code}`);

    res.json(successResponse({ 
      message: '验证码已发送',
      // 开发环境返回验证码，生产环境不应返回
      ...(process.env.NODE_ENV === 'development' && { code })
    }));
  } catch (error) {
    console.error('发送验证码失败:', error);
    res.status(500).json(errorResponse(50001, '发送验证码失败'));
  }
};

/**
 * 用户注册
 */
exports.register = async (req, res) => {
  try {
    const { phone, password, nickname, verifyCode } = req.body;

    // 验证必填字段
    if (!phone || !password || !nickname || !verifyCode) {
      return res.status(400).json(errorResponse(10001, '缺少必填字段'));
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json(errorResponse(10001, '手机号格式不正确'));
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json(errorResponse(10001, '密码至少6位'));
    }

    // 验证验证码
    const cacheKey = `verify_code:${phone}`;
    const storedCode = await redisClient.get(cacheKey);
    
    if (!storedCode || storedCode !== verifyCode) {
      return res.status(400).json(errorResponse(10001, '验证码错误或已过期'));
    }

    // 检查手机号是否已注册
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE phone = ?',
      [phone]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json(errorResponse(20001, '该手机号已注册'));
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const [result] = await db.query(
      'INSERT INTO users (phone, password, nickname) VALUES (?, ?, ?)',
      [phone, hashedPassword, nickname]
    );

    const userId = result.insertId;

    // 删除已使用的验证码
    await redisClient.del(cacheKey);

    // 生成令牌
    const { accessToken, refreshToken } = generateTokens(userId, nickname);

    // 存储refresh token到Redis（7天过期）
    await redisClient.setEx(`refresh_token:${userId}`, 7 * 24 * 3600, refreshToken);

    res.status(201).json(successResponse({
      user: {
        id: userId,
        phone,
        nickname,
        avatar: null
      },
      accessToken,
      refreshToken
    }, '注册成功'));
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json(errorResponse(50001, '注册失败'));
  }
};

/**
 * 用户登录
 */
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // 验证必填字段
    if (!phone || !password) {
      return res.status(400).json(errorResponse(10001, '缺少必填字段'));
    }

    // 查询用户
    const [users] = await db.query(
      'SELECT id, phone, password, nickname, avatar, role, status FROM users WHERE phone = ?',
      [phone]
    );

    if (users.length === 0) {
      return res.status(401).json(errorResponse(20002, '手机号或密码错误'));
    }

    const user = users[0];

    // 检查用户状态
    if (user.status === 0) {
      return res.status(403).json(errorResponse(20003, '账号已被禁用'));
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json(errorResponse(20002, '手机号或密码错误'));
    }

    // 生成令牌
    const { accessToken, refreshToken } = generateTokens(user.id, user.nickname, user.role);

    // 存储refresh token到Redis
    await redisClient.setEx(`refresh_token:${user.id}`, 7 * 24 * 3600, refreshToken);

    // 返回用户信息和令牌
    res.json(successResponse({
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role
      },
      accessToken,
      refreshToken
    }, '登录成功'));
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json(errorResponse(50001, '登录失败'));
  }
};

/**
 * 刷新令牌
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json(errorResponse(10001, '缺少刷新令牌'));
    }

    // 验证refresh token (简化实现，实际应该验证JWT)
    // 这里为了演示，简化了验证过程
    
    // TODO: 实际项目中应该解析JWT并验证

    res.json(successResponse({
      accessToken: refreshToken, // 简化实现
      refreshToken
    }, '令牌刷新成功'));
  } catch (error) {
    console.error('刷新令牌失败:', error);
    res.status(500).json(errorResponse(50001, '刷新令牌失败'));
  }
};

/**
 * 登出
 */
exports.logout = async (req, res) => {
  try {
    const userId = req.user.userId;

    // 删除Redis中的refresh token
    await redisClient.del(`refresh_token:${userId}`);

    res.json(successResponse(null, '登出成功'));
  } catch (error) {
    console.error('登出失败:', error);
    res.status(500).json(errorResponse(50001, '登出失败'));
  }
};
