const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authMiddleware } = require('../middleware/auth');

// AI问答助手
router.post('/qa', authMiddleware, aiController.photographyQA);

// 器材选购助手
router.post('/equipment-advice', authMiddleware, aiController.equipmentAdvice);

// 作品分析（增强版，支持EXIF数据）
router.post('/analyze-work', authMiddleware, aiController.analyzeWork);

// 拍摄地AI推荐
router.post('/location-advice', authMiddleware, aiController.locationAdvice);

// 课程推荐AI（新增）
router.post('/recommend-course', authMiddleware, aiController.recommendCourse);

// 挑战赛主题生成AI（新增）
router.post('/generate-challenge', authMiddleware, aiController.generateChallengeTheme);

// 快速提问模板
router.get('/quick-questions', aiController.getQuickQuestions);

// AI统计数据（新增）
router.get('/stats', authMiddleware, aiController.getAIStats);

// 智能标签生成（新增）
router.post('/generate-tags', authMiddleware, aiController.generateTags);

// 获取热门标签
router.get('/popular-tags', aiController.getPopularTags);

// 搜索标签（自动补全）
router.get('/search-tags', aiController.searchTags);

module.exports = router;
