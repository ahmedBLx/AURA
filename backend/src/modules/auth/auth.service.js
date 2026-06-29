const authRepository = require('./auth.repository');
const auditLogRepository = require('../audit-logs/audit-log.repository');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../core/jwt');
const AppError = require('../../core/appError');

class AuthService {
  async register({ name, email, password, role, adminCode, ipAddress }) {
    const existingAdmin = await authRepository.findByEmail(email);
    if (existingAdmin) {
      throw new AppError('Email is already registered', 400);
    }

    const code = process.env.ADMIN_SECRET_CODE || 'AD#M#M#IN#';
    if (adminCode !== code) {
      throw new AppError('Invalid admin verification code', 403);
    }

    const admin = await authRepository.create({
      name,
      email,
      password,
      role: 'admin',
    });

    // Write audit log
    await auditLogRepository.create({
      user: admin._id,
      userName: admin.name,
      action: 'SIGNUP',
      details: 'Admin registered successfully',
      ipAddress: ipAddress || 'Unknown',
    });

    const accessToken = generateAccessToken(admin);
    const { token: refreshToken, expiresAt } = generateRefreshToken(admin);

    await authRepository.addRefreshToken(admin._id, refreshToken, expiresAt);

    const adminResponse = {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };

    return { user: adminResponse, accessToken, refreshToken };
  }

  async login({ email, password, ipAddress }) {
    const admin = await authRepository.findByEmail(email);
    if (!admin) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = generateAccessToken(admin);
    const { token: refreshToken, expiresAt } = generateRefreshToken(admin);

    await authRepository.addRefreshToken(admin._id, refreshToken, expiresAt);

    // Write audit log
    await auditLogRepository.create({
      user: admin._id,
      userName: admin.name,
      action: 'LOGIN',
      details: 'Admin logged in successfully',
      ipAddress: ipAddress || 'Unknown',
    });

    const adminResponse = {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };

    return { user: adminResponse, accessToken, refreshToken };
  }

  async refresh(token) {
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (err) {
      throw new AppError('Invalid refresh token', 401);
    }

    const admin = await authRepository.findById(payload.id);
    if (!admin) {
      throw new AppError('Admin not found', 401);
    }

    const activeToken = admin.refreshTokens.find(
      (t) => t.token === token && t.expiresAt > new Date()
    );

    if (!activeToken) {
      throw new AppError('Refresh token expired or invalid', 401);
    }

    const accessToken = generateAccessToken(admin);
    return { accessToken };
  }

  async logout(adminId, token) {
    await authRepository.removeRefreshToken(adminId, token);
    const admin = await authRepository.findById(adminId);
    
    if (admin) {
      await auditLogRepository.create({
        user: admin._id,
        userName: admin.name,
        action: 'LOGOUT',
        details: 'Admin logged out successfully',
        ipAddress: 'System',
      });
    }
    return true;
  }

  async getAllUsers() {
    const admins = await authRepository.findAll();
    return admins.map(a => ({
      id: a._id,
      name: a.name,
      email: a.email,
      role: a.role,
      createdAt: a.createdAt
    }));
  }
}

module.exports = new AuthService();
