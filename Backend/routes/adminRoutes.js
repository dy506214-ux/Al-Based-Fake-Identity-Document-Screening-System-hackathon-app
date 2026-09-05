const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
    getAllUsers,
    updateUser,
    getStats,
    getAuditLogs,
    getAllDocuments,
    deactivateUser
} = require('../controllers/adminController');

// All admin routes require authentication AND ADMIN role
router.use(protect, authorizeRoles('ADMIN'));

// User management
router.get('/users', getAllUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deactivateUser);

// System statistics
router.get('/stats', getStats);

// Audit log viewer
router.get('/audit-logs', getAuditLogs);

// Document oversight
router.get('/documents', getAllDocuments);

module.exports = router;
