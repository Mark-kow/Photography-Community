const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

/**
 * 生成JWT Token
 */
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * 生成访问令牌和刷新令牌
 */
const generateTokens = (userId, username, role = 'user') => {
  const accessToken = generateToken(
    { userId, username, role },
    process.env.JWT_EXPIRES_IN
  );
  
  const refreshToken = generateToken(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_EXPIRES_IN
  );

  return { accessToken, refreshToken };
};

/**
 * 密码加密
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * 密码验证
 */
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * 生成唯一ID
 */
const generateId = () => {
  return uuidv4();
};

/**
 * 生成6位数字验证码
 */
const generateVerifyCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * 标准响应格式
 */
const successResponse = (data = null, message = 'success') => {
  return {
    code: 0,
    message,
    data,
    timestamp: Date.now()
  };
};

const errorResponse = (code, message, errors = null) => {
  const response = {
    code,
    message,
    timestamp: Date.now()
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return response;
};

/**
 * 分页响应格式
 */
const paginationResponse = (items, page, pageSize, total) => {
  return {
    code: 0,
    message: 'success',
    data: {
      items,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    },
    timestamp: Date.now()
  };
};

module.exports = {
  generateToken,
  generateTokens,
  hashPassword,
  comparePassword,
  generateId,
  generateVerifyCode,
  successResponse,
  errorResponse,
  paginationResponse
};
