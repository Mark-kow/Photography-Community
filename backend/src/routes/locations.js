const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authMiddleware } = require('../middleware/auth');

// 公开接口
router.get('/', locationController.getLocations);
// 先写更具体的路径，再写 /:id
router.get('/guides/:guideId', locationController.getGuideById);
router.get('/user/:userId/checkins', locationController.getUserCheckins);
router.get('/:id', locationController.getLocationById);

// 需要认证的接口
router.post('/', authMiddleware, locationController.createLocation);
router.post('/:id/checkin', authMiddleware, locationController.checkin);
router.post('/:id/guides', authMiddleware, locationController.createGuide);

module.exports = router;
