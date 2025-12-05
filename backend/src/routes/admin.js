const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, adminOnly, adminOrEditor } = require('../middleware/auth');

// 所有管理接口都需要认证
router.use(authMiddleware);

// 仪表盘统计 - admin和editor可访问
router.get('/dashboard/stats', adminOrEditor, adminController.getDashboardStats);

// 地点管理 - admin和editor可管理
router.get('/locations', adminOrEditor, adminController.getLocationList);
router.get('/locations/:id', adminOrEditor, adminController.getLocationDetail);
router.post('/locations', adminOrEditor, adminController.createLocation);
router.put('/locations/:id', adminOrEditor, adminController.updateLocation);
router.delete('/locations/:id', adminOnly, adminController.deleteLocation);
router.get('/cities', adminOrEditor, adminController.getCityList);

// 课程管理 - admin和editor可管理
router.get('/courses', adminOrEditor, adminController.getCourseList);
router.get('/courses/:id', adminOrEditor, adminController.getCourseDetail);
router.post('/courses', adminOrEditor, adminController.createCourse);
router.put('/courses/:id', adminOrEditor, adminController.updateCourse);
router.delete('/courses/:id', adminOnly, adminController.deleteCourse);

// 课程章节管理 - admin和editor可管理
router.post('/courses/:course_id/chapters', adminOrEditor, adminController.createChapter);
router.put('/chapters/:id', adminOrEditor, adminController.updateChapter);
router.delete('/chapters/:id', adminOnly, adminController.deleteChapter);

// 技巧库管理 - admin和editor可管理
router.get('/tips', adminOrEditor, adminController.getTipList);
router.get('/tips/:id', adminOrEditor, adminController.getTipDetail);
router.post('/tips', adminOrEditor, adminController.createTip);
router.put('/tips/:id', adminOrEditor, adminController.updateTip);
router.delete('/tips/:id', adminOnly, adminController.deleteTip);

// 约拍活动管理 - admin和editor可管理
router.get('/activities', adminOrEditor, adminController.getActivityList);
router.get('/activities/:id', adminOrEditor, adminController.getActivityDetail);
router.post('/activities', adminOrEditor, adminController.createActivity);
router.put('/activities/:id', adminOrEditor, adminController.updateActivity);
router.delete('/activities/:id', adminOnly, adminController.deleteActivity);

// 挑战赛管理 - admin和editor可管理
router.get('/challenges', adminOrEditor, adminController.getChallengeList);
router.get('/challenges/:id', adminOrEditor, adminController.getChallengeDetail);
router.post('/challenges', adminOrEditor, adminController.createChallenge);
router.put('/challenges/:id', adminOrEditor, adminController.updateChallenge);
router.delete('/challenges/:id', adminOnly, adminController.deleteChallenge);

// 器材管理 - 相机 - admin和editor可管理
router.get('/cameras', adminOrEditor, adminController.getCameraList);
router.get('/cameras/:id', adminOrEditor, adminController.getCameraDetail);
router.post('/cameras', adminOrEditor, adminController.createCamera);
router.put('/cameras/:id', adminOrEditor, adminController.updateCamera);
router.delete('/cameras/:id', adminOnly, adminController.deleteCamera);

// 器材管理 - 镜头 - admin和editor可管理
router.get('/lenses', adminOrEditor, adminController.getLensList);
router.get('/lenses/:id', adminOrEditor, adminController.getLensDetail);
router.post('/lenses', adminOrEditor, adminController.createLens);
router.put('/lenses/:id', adminOrEditor, adminController.updateLens);
router.delete('/lenses/:id', adminOnly, adminController.deleteLens);

// 用户管理 - 仅admin可管理
router.get('/users', adminOnly, adminController.getUserList);
router.get('/users/:id', adminOnly, adminController.getUserDetail);
router.put('/users/:id', adminOnly, adminController.updateUser);
router.put('/users/:id/status', adminOnly, adminController.toggleUserStatus);

// 作品管理 - admin和editor可查看和编辑，仅admin可删除
router.get('/works', adminOrEditor, adminController.getWorkList);
router.get('/works/:id', adminOrEditor, adminController.getWorkDetail);
router.put('/works/:id/status', adminOrEditor, adminController.updateWorkStatus);
router.delete('/works/:id', adminOnly, adminController.deleteWork);

// 评论管理 - admin和editor可查看，仅admin可删除
router.get('/comments', adminOrEditor, adminController.getCommentList);
router.get('/comments/:id', adminOrEditor, adminController.getCommentDetail);
router.delete('/comments/:id', adminOnly, adminController.deleteComment);

module.exports = router;
