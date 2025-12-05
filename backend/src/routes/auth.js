const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// 发送验证码
router.post('/send-code', authController.sendVerifyCode);

// 注册
router.post('/register', authController.register);

// 登录
router.post('/login', authController.login);

// 刷新令牌
router.post('/refresh-token', authController.refreshToken);

// 登出
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
