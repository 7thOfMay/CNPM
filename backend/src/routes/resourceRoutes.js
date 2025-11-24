const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Internal Resources
router.get('/', authMiddleware, resourceController.getResources);
router.post('/', authMiddleware, requireRole('tutor', 'admin'), resourceController.createResource);
router.get('/:id', authMiddleware, resourceController.getResourceById);
router.put('/:id', authMiddleware, requireRole('tutor', 'admin'), resourceController.updateResource);
router.delete('/:id', authMiddleware, requireRole('tutor', 'admin'), resourceController.deleteResource);

module.exports = router;
