const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Get available tutors for a course
router.get('/course/:courseId/tutors', authMiddleware, requireRole('student'), matchController.getAvailableTutors);

// Select a tutor manually
router.post('/course/:courseId/select', authMiddleware, requireRole('student'), matchController.selectTutor);

// Auto-select a tutor
router.post('/course/:courseId/auto-select', authMiddleware, requireRole('student'), matchController.autoSelectTutor);

module.exports = router;
