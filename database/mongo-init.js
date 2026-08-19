// MongoDB Initialization Script for SecureChat
db = db.getSiblingDB('securechat');

// Ensure unique indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ isOnline: 1 });

db.conversations.createIndex({ "participants.user": 1 });
db.conversations.createIndex({ lastMessageAt: -1 });

db.messages.createIndex({ conversation: 1, createdAt: -1 });
db.messages.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

db.stories.createIndex({ user: 1 });
db.stories.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

db.admins.createIndex({ email: 1 }, { unique: true });
db.auditlogs.createIndex({ createdAt: -1 });

print('[MongoDB] Initialized indexes successfully for database: securechat');
