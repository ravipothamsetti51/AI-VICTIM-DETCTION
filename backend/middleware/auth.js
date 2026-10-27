const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
      error: 'UnauthorizedError',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aerosentry_classified_disaster_jwt_secret_key_2026');
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The security credential does not match an active operator.',
        error: 'UserNotFound',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token.',
      error: 'TokenExpiredOrInvalid',
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Security clearance insufficient. Role '${req.user?.role || 'unknown'}' is unauthorized for this action. Required: [${roles.join(', ')}].`,
        error: 'ForbiddenError',
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
