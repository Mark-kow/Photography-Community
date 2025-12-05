const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authMiddleware } = require('../middleware/auth');

// 公开接口 - 相机
router.get('/cameras', equipmentController.getCameras);
router.get('/cameras/:id', equipmentController.getCameraById);

// 公开接口 - 镜头
router.get('/lenses', equipmentController.getLenses);
router.get('/lenses/:id', equipmentController.getLensById);

// 公开接口 - 二手市场
router.get('/market', equipmentController.getMarketItems);
router.get('/market/:id', equipmentController.getMarketItemById);

// 需要认证的接口 - 用户器材库
router.get('/user/:userId', authMiddleware, equipmentController.getUserEquipments);
router.post('/user/add', authMiddleware, equipmentController.addToUserEquipment);
router.delete('/user/:id', authMiddleware, equipmentController.deleteUserEquipment);

// 需要认证的接口 - 二手市场
router.post('/market', authMiddleware, equipmentController.createMarketItem);
router.put('/market/:id/status', authMiddleware, equipmentController.updateMarketItemStatus);

module.exports = router;
