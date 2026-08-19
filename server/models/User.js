const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 60,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-zA-Z0-9_.]+$/, 'Username can only contain alphanumeric characters, dots, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    coverPhoto: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: 180,
      default: 'Hey there! I am using SecureChat.',
    },
    statusMessage: {
      type: String,
      maxlength: 80,
      default: 'Available',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isPrivateAccount: {
      type: Boolean,
      default: false, // If true, non-contacts cannot message without sending a Chat Request
    },
    publicKey: {
      type: String,
      default: '',
    },
    keyFingerprint: {
      type: String,
      default: '',
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspensionReason: {
      type: String,
      default: '',
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    contacts: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        customName: String,
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    privacySettings: {
      profilePhoto: {
        type: String,
        enum: ['everyone', 'contacts', 'nobody'],
        default: 'everyone',
      },
      lastSeen: {
        type: String,
        enum: ['everyone', 'contacts', 'nobody'],
        default: 'everyone',
      },
      onlineStatus: {
        type: String,
        enum: ['everyone', 'contacts', 'nobody'],
        default: 'everyone',
      },
      readReceipts: {
        type: Boolean,
        default: true,
      },
      callPermissions: {
        type: String,
        enum: ['everyone', 'contacts', 'nobody'],
        default: 'everyone',
      },
      groupAddPermissions: {
        type: String,
        enum: ['everyone', 'contacts', 'nobody'],
        default: 'everyone',
      },
    },
    notificationSettings: {
      soundEnabled: { type: Boolean, default: true },
      previewMessage: { type: Boolean, default: true },
      callRingtone: { type: Boolean, default: true },
    },
    customTheme: {
      wallpaper: { type: String, default: 'obsidian' },
      themeMode: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.twoFactorSecret;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
