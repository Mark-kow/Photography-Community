const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authMiddleware } = require('../middleware/auth');

// 公开接口
router.get('/', activityController.getActivities);
router.get('/:id', activityController.getActivityById);

// 需要认证的接口
router.post('/', authMiddleware, activityController.createActivity);
router.put('/:id', authMiddleware, activityController.updateActivity);
router.post('/:id/join', authMiddleware, activityController.joinActivity);
router.delete('/:id/join', authMiddleware, activityController.cancelParticipation);
router.get('/my/list', authMiddleware, activityController.getMyActivities);

module.exports = router;
