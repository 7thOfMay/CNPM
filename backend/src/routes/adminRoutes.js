const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// All admin routes require admin role
router.use(authMiddleware, requireRole('admin'));

router.get('/stats', adminController.getStats);
router.get('/export', adminController.exportData);
router.get('/datacore', adminController.getDataCore);

module.exports = router;
