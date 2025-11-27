const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { authMiddleware } = require('../middleware/auth');

// Define the route for getting recommended tutors
// The frontend calls /api/match/tutors
router.get('/tutors', authMiddleware, matchController.getRecommendedTutors);

module.exports = router;
