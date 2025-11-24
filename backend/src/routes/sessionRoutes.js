const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.get('/', authMiddleware, sessionController.getSessions);
router.post('/', authMiddleware, requireRole('tutor', 'admin'), sessionController.createSession);
router.post('/:id/book', authMiddleware, requireRole('student'), sessionController.bookSession);
router.delete('/:id/book', authMiddleware, requireRole('student'), sessionController.cancelBooking);
router.put('/:id', authMiddleware, requireRole('tutor', 'admin'), sessionController.updateSession);
router.delete('/:id', authMiddleware, requireRole('tutor', 'admin'), sessionController.deleteSession);

module.exports = router;
