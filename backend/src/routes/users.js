const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

// 获取当前用户信息
router.get('/me', authMiddleware, userController.getCurrentUser);

// 更新当前用户信息
router.put('/me', authMiddleware, userController.updateCurrentUser);

// 获取用户资料
router.get('/:id', optionalAuth, userController.getUserProfile);

// 获取用户作品列表
router.get('/:id/works', optionalAuth, userController.getUserWorks);

// 关注用户
router.post('/:id/follow', authMiddleware, userController.followUser);

// 取消关注
router.delete('/:id/follow', authMiddleware, userController.unfollowUser);

// 获取关注列表
router.get('/:id/following', userController.getFollowing);

// 获取粉丝列表
router.get('/:id/followers', userController.getFollowers);

module.exports = router;
