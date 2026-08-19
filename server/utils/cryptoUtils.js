const jwt = require('jsonwebtoken');

const generateAccessToken = (userId, extraPayload = {}) => {
  return jwt.sign(
    { id: userId, ...extraPayload },
    process.env.JWT_SECRET || 'super_secret_jwt_access_key_change_in_production_93817342948',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'super_secret_jwt_refresh_key_change_in_production_84719284729',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};

const generateAdminToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id,
      email: admin.email,
      role: admin.role,
      isAdmin: true,
    },
    process.env.JWT_SECRET || 'super_secret_jwt_access_key_change_in_production_93817342948',
    { expiresIn: '12h' }
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateAdminToken,
};
