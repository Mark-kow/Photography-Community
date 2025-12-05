const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const { authMiddleware } = require('../middleware/auth');

// 公开接口
router.get('/', challengeController.getChallenges);
router.get('/:id', challengeController.getChallengeById);
router.get('/:challengeId/works', challengeController.getChallengeWorks);

// 需要认证的接口
router.post('/submit', authMiddleware, challengeController.submitWork);
router.post('/vote', authMiddleware, challengeController.voteWork);
router.delete('/vote', authMiddleware, challengeController.cancelVote);
router.get('/my/list', authMiddleware, challengeController.getMyChallenges);

module.exports = router;
