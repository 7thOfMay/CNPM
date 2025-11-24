const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { authMiddleware } = require('../middleware/auth');

router.get('/posts', forumController.getPosts);
router.post('/posts', authMiddleware, forumController.createPost);
router.get('/posts/:id/comments', forumController.getComments);
router.post('/posts/:id/comments', authMiddleware, forumController.createComment);
router.delete('/posts/:id', authMiddleware, forumController.deletePost);

module.exports = router;
