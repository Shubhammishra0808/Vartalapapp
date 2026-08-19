const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token missing.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_access_key_change_in_production_93817342948');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found or revoked.',
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: `Account has been suspended: ${user.suspensionReason || 'Violation of Community Guidelines'}`,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid token. Please log in again.',
    });
  }
};

module.exports = { protect };
