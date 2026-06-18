const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const generateRefreshToken = (user) => {
  const expiresIn = process.env.JWT_REFRESH_EXPIRE || '30d';
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn }
  );

  // Calculate expiration date for storage
  // Simple parser for days (e.g. '30d') or hours
  let ms = 30 * 24 * 60 * 60 * 1000; // default 30 days
  const match = expiresIn.match(/^(\d+)([dhm])$/);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    if (unit === 'd') ms = value * 24 * 60 * 60 * 1000;
    else if (unit === 'h') ms = value * 60 * 60 * 1000;
    else if (unit === 'm') ms = value * 60 * 1000;
  }
  const expiresAt = new Date(Date.now() + ms);

  return { token, expiresAt };
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
