const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authMiddleware } = require('../middleware/auth');

router.get('/recommendations', authMiddleware, aiController.getRecommendations);
router.get('/learning-path', authMiddleware, aiController.analyzeLearningPath);
router.post('/chat', authMiddleware, aiController.chat);

module.exports = router;
