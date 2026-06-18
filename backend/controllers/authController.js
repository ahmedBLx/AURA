const authService = require('../services/authService');

class AuthController {
  async signup(req, res, next) {
    try {
      const { name, email, password, role, adminCode } = req.body;
      const ipAddress = req.ip;

      const result = await authService.register({
        name,
        email,
        password,
        role,
        adminCode,
        ipAddress,
      });

      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;

      const result = await authService.login({ email, password, ipAddress });

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(req.user._id, refreshToken);

      res.status(200).json({
        status: 'success',
        message: 'Successfully logged out',
      });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      };

      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }

  async getUsers(req, res, next) {
    try {
      const users = await authService.getAllUsers();
      res.status(200).json({
        status: 'success',
        data: { users },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
