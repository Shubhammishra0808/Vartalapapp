const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');

const protectAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Admin authorization denied. Missing admin credentials.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_access_key_change_in_production_93817342948');
    
    if (!decoded.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Non-admin token provided.',
      });
    }

    const admin = await Admin.findById(decoded.id);

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account revoked or disabled.',
      });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Admin token invalid or expired.',
    });
  }
};

// Role-Based Access Control (RBAC)
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.admin ? req.admin.role : 'none'}) is not permitted to perform this operation. Required: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

// Audit Helper
const logAdminAction = async ({ admin, action, targetType, targetId, reason, details, req }) => {
  try {
    await AuditLog.create({
      adminId: admin._id,
      adminEmail: admin.email,
      adminRole: admin.role,
      action,
      targetType,
      targetId: targetId ? targetId.toString() : '',
      reason: reason || 'Routine Administration',
      details: details || {},
      ipAddress: req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : '',
      userAgent: req ? req.headers['user-agent'] : '',
    });
  } catch (err) {
    console.error('[AuditLog Error]', err);
  }
};

module.exports = { protectAdmin, authorizeRoles, logAdminAction };
