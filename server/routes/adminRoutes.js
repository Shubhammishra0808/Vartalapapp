const express = require('express');
const router = express.Router();
const {
  adminLogin,
  getOverview,
  getUsers,
  toggleSuspendUser,
  resetUserSecurity,
  getReports,
  resolveReport,
  getAuditLogs,
  sendSystemBroadcast,
  deleteUserAccount,
  getAllConversationsAdmin,
  deleteConversationAdmin,
  getSystemHealth,
} = require('../controllers/adminController');
const { protectAdmin, authorizeRoles } = require('../middleware/adminAuth');
const { authLimiter } = require('../middleware/rateLimiter');

// Public admin login
router.post('/login', authLimiter, adminLogin);

// Protected routes (Super Admin, Moderator, Support)
router.use(protectAdmin);

router.get('/overview', getOverview);
router.get('/users', getUsers);
router.get('/reports', getReports);
router.put('/reports/:id', resolveReport);

// Moderator & Superadmin only
router.post('/users/:id/suspend', authorizeRoles('superadmin', 'moderator'), toggleSuspendUser);

// Superadmin Special Powers
router.post('/broadcast', authorizeRoles('superadmin'), sendSystemBroadcast);
router.delete('/users/:id', authorizeRoles('superadmin'), deleteUserAccount);
router.get('/conversations', authorizeRoles('superadmin'), getAllConversationsAdmin);
router.delete('/conversations/:id', authorizeRoles('superadmin'), deleteConversationAdmin);
router.get('/health-telemetry', authorizeRoles('superadmin'), getSystemHealth);
router.post('/users/:id/reset-security', authorizeRoles('superadmin'), resetUserSecurity);
router.get('/audit-logs', authorizeRoles('superadmin'), getAuditLogs);

module.exports = router;
