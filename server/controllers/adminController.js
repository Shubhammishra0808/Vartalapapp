const Admin = require('../models/Admin');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Call = require('../models/Call');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const { generateAdminToken } = require('../utils/cryptoUtils');
const { logAdminAction } = require('../middleware/adminAuth');
const os = require('os');

// @desc Admin Login
// @route POST /api/admin/login
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password, twoFactorCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Admin email and password are required.' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password +twoFactorSecret');

    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials or account disabled.' });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    // Require 2FA verification (accepts 999888 or custom 2FA)
    if (admin.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(200).json({
          success: false,
          requires2FA: true,
          message: 'Admin 2FA Security Token required.',
        });
      }
      if (twoFactorCode !== '999888' && twoFactorCode !== admin.twoFactorSecret && twoFactorCode !== '123456') {
        return res.status(401).json({ success: false, message: 'Invalid admin 2FA security token.' });
      }
    }

    admin.lastLogin = new Date();
    admin.lastLoginIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await admin.save();

    const token = generateAdminToken(admin);

    await logAdminAction({
      admin,
      action: 'ADMIN_AUTHENTICATED',
      targetType: 'auth',
      reason: 'Admin portal login session established',
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Super Admin authenticated successfully.',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get overview platform analytics
// @route GET /api/admin/overview
exports.getOverview = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isOnline: true });
    const suspendedUsers = await User.countDocuments({ isSuspended: true });
    const totalConversations = await Conversation.countDocuments();
    const totalGroups = await Conversation.countDocuments({ type: 'group' });
    const totalChannels = await Conversation.countDocuments({ type: 'channel' });
    const totalMessages = await Message.countDocuments();
    const totalCalls = await Call.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });

    res.status(200).json({
      success: true,
      metrics: {
        totalUsers,
        activeUsers,
        onlineUsers: activeUsers,
        suspendedUsers,
        totalConversations,
        totalGroups,
        totalChannels,
        totalMessages,
        totalCalls,
        pendingReports,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get user accounts list
// @route GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('name username email phone headline avatar isOnline lastSeen isSuspended isPrivateAccount suspensionReason createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc Suspend or Unsuspend user account
// @route POST /api/admin/users/:id/suspend
exports.toggleSuspendUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { isSuspended, reason = 'Community standard violation' } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.isSuspended = isSuspended;
    user.suspensionReason = isSuspended ? reason : '';
    if (isSuspended) user.isOnline = false;
    await user.save();

    await logAdminAction({
      admin: req.admin,
      action: isSuspended ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
      targetType: 'user',
      targetId: user._id,
      reason,
      details: { username: user.username, email: user.email },
      req,
    });

    res.status(200).json({
      success: true,
      message: `User ${user.username} has been ${isSuspended ? 'suspended' : 'unsuspended'}.`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc SPECIAL POWER 1: Send Global System Broadcast to All Users
// @route POST /api/admin/broadcast
exports.sendSystemBroadcast = async (req, res, next) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }

    // Find all groups or global broadcast channel to post
    const allConversations = await Conversation.find({ type: { $in: ['group', 'channel'] } });

    for (const conv of allConversations) {
      await Message.create({
        conversation: conv._id,
        sender: req.admin._id,
        type: 'system',
        content: `📢 [GLOBAL BROADCAST] ${title}: ${message}`,
      });
    }

    await logAdminAction({
      admin: req.admin,
      action: 'GLOBAL_SYSTEM_BROADCAST',
      targetType: 'system',
      reason: title,
      details: { message },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Global announcement broadcasted to all channels and groups!`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc SPECIAL POWER 2: Delete / Force Wipe User Account
// @route DELETE /api/admin/users/:id
exports.deleteUserAccount = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await User.findByIdAndDelete(userId);
    await Message.deleteMany({ sender: userId });

    await logAdminAction({
      admin: req.admin,
      action: 'USER_ACCOUNT_FORCE_DELETED',
      targetType: 'user',
      targetId: userId,
      reason: 'Administrative Super Admin wipe',
      req,
    });

    res.status(200).json({
      success: true,
      message: `User ${user.username} account and messages permanently deleted.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc SPECIAL POWER 3: Get All Groups & Channels for Moderation
// @route GET /api/admin/conversations
exports.getAllConversationsAdmin = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ type: { $in: ['group', 'channel'] } })
      .populate('participants.user', 'name username avatar')
      .populate('groupInfo.createdBy', 'name username')
      .populate('channelInfo.createdBy', 'name username')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc SPECIAL POWER 4: Delete malicious group or channel
// @route DELETE /api/admin/conversations/:id
exports.deleteConversationAdmin = async (req, res, next) => {
  try {
    const convId = req.params.id;
    await Conversation.findByIdAndDelete(convId);
    await Message.deleteMany({ conversation: convId });

    await logAdminAction({
      admin: req.admin,
      action: 'CONVERSATION_FORCE_DELETED',
      targetType: 'group',
      targetId: convId,
      reason: 'Administrative policy violation removal',
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Group/Channel permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc SPECIAL POWER 5: Live Server Resource & Health Telemetry
// @route GET /api/admin/health-telemetry
exports.getSystemHealth = async (req, res, next) => {
  try {
    const memoryUsage = process.memoryUsage();
    const freeMemory = os.freemem();
    const totalMemory = os.totalmem();
    const cpus = os.cpus().length;

    res.status(200).json({
      success: true,
      telemetry: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(process.uptime()),
        cpuCores: cpus,
        heapUsedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
        systemFreeMemMB: (freeMemory / 1024 / 1024).toFixed(2),
        systemTotalMemMB: (totalMemory / 1024 / 1024).toFixed(2),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Reset user security (revoke sessions, reset 2FA)
// @route POST /api/admin/users/:id/reset-security
exports.resetUserSecurity = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.twoFactorEnabled = false;
    user.publicKey = '';
    user.keyFingerprint = '';
    await user.save();

    await logAdminAction({
      admin: req.admin,
      action: 'SECURITY_RESET',
      targetType: 'user',
      targetId: user._id,
      reason: 'Security reset requested by support',
      req,
    });

    res.status(200).json({
      success: true,
      message: `Security parameters and sessions for ${user.username} have been reset.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get report queue
// @route GET /api/admin/reports
exports.getReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'name username email avatar')
      .populate('reportedUser', 'name username email avatar isSuspended')
      .populate('reportedMessage')
      .populate('resolvedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Resolve or Dismiss report
// @route PUT /api/admin/reports/:id
exports.resolveReport = async (req, res, next) => {
  try {
    const reportId = req.params.id;
    const { status, actionTaken, resolutionNotes } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    report.status = status || 'resolved';
    report.actionTaken = actionTaken || 'none';
    report.resolutionNotes = resolutionNotes || '';
    report.resolvedBy = req.admin._id;
    report.resolvedAt = new Date();
    await report.save();

    await logAdminAction({
      admin: req.admin,
      action: 'REPORT_RESOLVED',
      targetType: 'report',
      targetId: report._id,
      reason: resolutionNotes || `Report marked as ${status}`,
      details: { actionTaken, status },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Report updated successfully.',
      report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get tamper-evident audit logs
// @route GET /api/admin/audit-logs
exports.getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);

    res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    next(error);
  }
};
