const User = require('../models/User');
const Admin = require('../models/Admin');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Story = require('../models/Story');

const seedInitialData = async () => {
  try {
    // 1. Seed or Update Super Admin
    const adminEmail = process.env.ADMIN_INIT_EMAIL || 'shubhammishra23082004@gmail.com';
    const adminPass = process.env.ADMIN_INIT_PASSWORD || 'Shubham@080605';

    let admin = await Admin.findOne({ email: adminEmail.toLowerCase() });
    if (!admin) {
      admin = await Admin.create({
        name: 'Shubham Mishra (Super Admin)',
        email: adminEmail.toLowerCase(),
        password: adminPass,
        role: 'superadmin',
        twoFactorEnabled: true,
        twoFactorSecret: '999888',
        isActive: true,
      });
      console.log(`[Seed] Super Admin initialized: ${adminEmail}`);
    } else {
      admin.password = adminPass;
      admin.role = 'superadmin';
      admin.isActive = true;
      await admin.save();
      console.log(`[Seed] Super Admin updated: ${adminEmail}`);
    }

    // 2. Clean up any legacy demo users
    const demoUsernames = ['alice', 'bob', 'chloe'];
    const demoUsers = await User.find({ username: { $in: demoUsernames } });
    if (demoUsers.length > 0) {
      const demoUserIds = demoUsers.map((u) => u._id);
      await Message.deleteMany({ sender: { $in: demoUserIds } });
      await Conversation.deleteMany({ 'participants.user': { $in: demoUserIds } });
      await Story.deleteMany({ user: { $in: demoUserIds } });
      await User.deleteMany({ _id: { $in: demoUserIds } });
      console.log('[Seed] Removed legacy demo users and mock data. Clean database ready!');
    }
  } catch (err) {
    console.error('[Seed Error]', err.message);
  }
};

module.exports = seedInitialData;
