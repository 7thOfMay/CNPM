const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/users', chatController.getChatUsers);
router.post('/room', chatController.createRoom);
router.get('/rooms', chatController.getRooms);
router.post('/message', chatController.sendMessage);
router.get('/messages/:roomId', chatController.getMessages);
router.get('/unread', chatController.getUnreadCount);

module.exports = router;
