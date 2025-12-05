const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authMiddleware } = require('../middleware/auth');

// 课程相关
router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourseById);

// 需要认证的接口
router.get('/chapters/:chapterId', authMiddleware, courseController.getChapter);
router.post('/chapters/:chapterId/complete', authMiddleware, courseController.completeChapter);
router.get('/user/learning', authMiddleware, courseController.getMyLearning);

// 技巧库
router.get('/tips/list', courseController.getTips);
router.get('/tips/:id', courseController.getTipById);

module.exports = router;
