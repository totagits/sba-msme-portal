import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { config } from '../../config';
import { createError } from '../../middleware/errorHandler';
import { JWTPayload } from '../../middleware/auth';

export class AuthService {
  async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase(), deletedAt: null },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    // Record failed attempt helper
    const recordFailed = async (userId?: string, reason?: string) => {
      await prisma.loginHistory.create({
        data: {
          userId: userId || 'unknown',
          ipAddress,
          userAgent,
          success: false,
          failReason: reason,
        },
      });
    };

    if (!user) {
      await recordFailed(undefined, 'User not found');
      throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check account status
    if (user.status === 'SUSPENDED') {
      throw createError('Your account has been suspended. Contact the administrator.', 403, 'ACCOUNT_SUSPENDED');
    }

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw createError(`Account locked. Try again in ${minutesLeft} minute(s).`, 423, 'ACCOUNT_LOCKED');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      const newAttempts = user.failedLoginAttempts + 1;
      const shouldLock = newAttempts >= config.auth.maxLoginAttempts;
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts,
          status: shouldLock ? 'LOCKED' : user.status,
          lockedUntil: shouldLock
            ? new Date(Date.now() + config.auth.lockoutDurationMinutes * 60000)
            : null,
        },
      });

      await recordFailed(user.id, `Invalid password (attempt ${newAttempts})`);

      if (shouldLock) {
        throw createError('Account locked after too many failed attempts. Contact your administrator.', 423, 'ACCOUNT_LOCKED');
      }

      const remaining = config.auth.maxLoginAttempts - newAttempts;
      throw createError(`Invalid email or password. ${remaining} attempt(s) remaining.`, 401, 'INVALID_CREDENTIALS');
    }

    // Reset failed attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        status: user.status === 'PENDING' ? 'ACTIVE' : user.status,
      },
    });

    // Record success
    await prisma.loginHistory.create({
      data: { userId: user.id, ipAddress, userAgent, success: true },
    });

    // Extract roles and permissions
    const roles = user.userRoles.map(ur => ur.role.name);
    const permissions = Array.from(new Set(
      user.userRoles.flatMap(ur => ur.role.rolePermissions.map(rp => rp.permission.name))
    ));

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      roles,
      permissions,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        permissions,
        countyId: user.countyId,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string };
      
      const user = await prisma.user.findUnique({
        where: { id: payload.userId, deletedAt: null },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: { include: { permission: true } },
                },
              },
            },
          },
        },
      });

      if (!user || user.status === 'SUSPENDED' || user.status === 'LOCKED') {
        throw createError('Invalid refresh token', 401, 'INVALID_TOKEN');
      }

      const roles = user.userRoles.map(ur => ur.role.name);
      const permissions = Array.from(new Set(
        user.userRoles.flatMap(ur => ur.role.rolePermissions.map(rp => rp.permission.name))
      ));

      const jwtPayload: JWTPayload = { userId: user.id, email: user.email, roles, permissions };
      const newAccessToken = jwt.sign(jwtPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      } as jwt.SignOptions);

      return { accessToken: newAccessToken };
    } catch {
      throw createError('Invalid or expired refresh token', 401, 'INVALID_TOKEN');
    }
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    
    // Always return success to prevent email enumeration
    if (!user || user.deletedAt) return;

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, resetTokenExpiry: expiry },
    });

    return { token, user };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        resetTokenExpiry: { gt: new Date() },
        deletedAt: null,
      },
    });

    if (!user) {
      throw createError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        resetTokenExpiry: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        status: 'ACTIVE',
      },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw createError('User not found', 404, 'NOT_FOUND');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw createError('Current password is incorrect', 400, 'INVALID_PASSWORD');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }
}

export const authService = new AuthService();
