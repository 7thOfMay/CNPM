const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.get('/', courseController.getAllCourses);
router.post('/', authMiddleware, requireRole('tutor', 'admin'), courseController.createCourse);
router.post('/:id/enroll', authMiddleware, requireRole('student'), courseController.enrollCourse);
router.get('/my-courses', authMiddleware, courseController.getMyCourses);

module.exports = router;
