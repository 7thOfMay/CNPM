const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// All admin routes require admin role
router.use(authMiddleware, requireRole('admin'));

router.get('/stats', adminController.getStats);
router.get('/export', adminController.exportData);
router.get('/datacore', adminController.getDataCore);
router.get('/users', adminController.getAllUsers);
router.get('/reports', adminController.getReports);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
