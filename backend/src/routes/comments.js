const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

// 获取作品评论列表
router.get('/work/:workId', optionalAuth, commentController.getWorkComments);

// 发表评论
router.post('/', authMiddleware, commentController.createComment);

// 删除评论
router.delete('/:id', authMiddleware, commentController.deleteComment);

// 点赞评论
router.post('/:id/like', authMiddleware, commentController.likeComment);

// 取消点赞评论
router.delete('/:id/like', authMiddleware, commentController.unlikeComment);

module.exports = router;
