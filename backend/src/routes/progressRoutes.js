const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.get('/course/:courseId', authMiddleware, requireRole('tutor', 'admin'), progressController.getCourseProgress);
router.get('/student/course/:courseId', authMiddleware, requireRole('student'), progressController.getStudentCourseProgress);

module.exports = router;
