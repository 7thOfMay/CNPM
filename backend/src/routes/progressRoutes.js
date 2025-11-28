const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.get('/course/:courseId', authMiddleware, requireRole('tutor', 'admin'), progressController.getCourseProgress);
router.post('/course/:courseId/student/:studentId/note', authMiddleware, requireRole('tutor', 'admin'), progressController.addProgressNote);
router.get('/student/course/:courseId', authMiddleware, requireRole('student'), progressController.getStudentCourseProgress);

// Admin Routes
router.get('/students', authMiddleware, requireRole('admin'), progressController.getAllStudents);
router.get('/transcript/:studentId', authMiddleware, requireRole('admin'), progressController.getStudentTranscript);

module.exports = router;
