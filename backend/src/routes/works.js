const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const workController = require('../controllers/workController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/works/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// 上传图片
router.post('/upload', authMiddleware, upload.single('image'), workController.uploadImage);

// 获取推荐Feed流
router.get('/feed', optionalAuth, workController.getFeed);

// 获取关注动态
router.get('/following', authMiddleware, workController.getFollowingFeed);

// 搜索作品
router.get('/search', optionalAuth, workController.searchWorks);

// 获取作品详情
router.get('/:id', optionalAuth, workController.getWorkDetail);

// 发布作品
router.post('/', authMiddleware, workController.createWork);

// 更新作品
router.put('/:id', authMiddleware, workController.updateWork);

// 删除作品
router.delete('/:id', authMiddleware, workController.deleteWork);

// 点赞作品
router.post('/:id/like', authMiddleware, workController.likeWork);

// 取消点赞
router.delete('/:id/like', authMiddleware, workController.unlikeWork);

// 收藏作品
router.post('/:id/collect', authMiddleware, workController.collectWork);

// 取消收藏
router.delete('/:id/collect', authMiddleware, workController.uncollectWork);

module.exports = router;
