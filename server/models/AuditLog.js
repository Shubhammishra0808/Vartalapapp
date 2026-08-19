const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    adminEmail: {
      type: String,
      required: true,
    },
    adminRole: {
      type: String,
      default: 'moderator',
    },
    action: {
      type: String,
      required: true, // e.g. 'USER_SUSPENDED', 'USER_UNSUSPENDED', 'REPORT_RESOLVED', 'SECURITY_RESET', 'ADMIN_LOGIN'
    },
    targetType: {
      type: String,
      enum: ['user', 'message', 'group', 'report', 'system', 'auth'],
      required: true,
    },
    targetId: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      default: 'Administrative moderation review',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
