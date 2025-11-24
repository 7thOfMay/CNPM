const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { authMiddleware } = require('../middleware/auth');

router.get('/search', authMiddleware, resourceController.searchLibrary);
router.get('/categories', authMiddleware, resourceController.getLibraryCategories);
router.get('/resource/:id', authMiddleware, resourceController.getLibraryResource);

module.exports = router;
