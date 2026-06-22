const { verifyAccessToken } = require('../core/jwt');
const authRepository = require('../modules/auth/auth.repository');
const AppError = require('../core/appError');

const protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Check if admin still exists
    const currentAdmin = await authRepository.findById(decoded.id);
    if (!currentAdmin) {
      return next(new AppError('The admin account belonging to this token no longer exists.', 401));
    }

    // Grant access
    req.user = currentAdmin;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token. Please log in again.', 401));
    }
    next(err);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

const optionalProtect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    const decoded = verifyAccessToken(token);
    const currentAdmin = await authRepository.findById(decoded.id);
    if (currentAdmin) {
      req.user = currentAdmin;
    }
    next();
  } catch (err) {
    // If optional token is invalid, just proceed as guest
    next();
  }
};

module.exports = {
  protect,
  restrictTo,
  optionalProtect,
};
