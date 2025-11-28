const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Submit a rating (Student only)
router.post('/', authMiddleware, requireRole('student'), ratingController.createRating);

// Get my ratings (Tutor only)
router.get('/my-ratings', authMiddleware, requireRole('tutor'), ratingController.getTutorRatings);

module.exports = router;
