const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg).join(', ');
    return res.status(400).json({
      status: 'error',
      message: `Validation failed: ${errorMessages}`,
    });
  }
  next();
};

module.exports = validate;
