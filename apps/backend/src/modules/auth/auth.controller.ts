import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service';
import { createAuditLog } from '../../middleware/audit';


const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export class AuthController {
  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: Login with email and password
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email: { type: string, example: admin@sba.gov.lr }
   *               password: { type: string, example: ChangeMe123! }
   *     responses:
   *       200:
   *         description: Login successful
   *       401:
   *         description: Invalid credentials
   *       423:
   *         description: Account locked
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await authService.login(
        email,
        password,
        req.ip,
        req.headers['user-agent']
      );

      await createAuditLog(req, {
        action: 'LOGIN',
        description: `User ${email} logged in`,
      });

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     tags: [Auth]
   *     summary: Refresh access token
   *     security: []
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ success: false, error: { message: 'Refresh token required' } });
        return;
      }
      const result = await authService.refreshToken(refreshToken);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     tags: [Auth]
   *     summary: Get current user profile
   */
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { prisma } = await import('../../config/prisma');
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
          countyId: true,
          lastLoginAt: true,
          createdAt: true,
          county: { select: { id: true, name: true } },
          userRoles: {
            include: { role: { select: { name: true, displayName: true } } },
          },
        },
      });
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     tags: [Auth]
   *     summary: Logout (audit log)
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await createAuditLog(req, {
        action: 'LOGOUT',
        description: `User ${req.user?.email} logged out`,
      });
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /api/auth/forgot-password:
   *   post:
   *     tags: [Auth]
   *     summary: Request password reset email
   *     security: []
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      await authService.forgotPassword(email);
      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /api/auth/reset-password:
   *   post:
   *     tags: [Auth]
   *     summary: Reset password with token
   *     security: []
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      await authService.resetPassword(token, password);
      res.json({ success: true, message: 'Password reset successfully. You can now login.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /api/auth/change-password:
   *   post:
   *     tags: [Auth]
   *     summary: Change current user's password
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      await authService.changePassword(req.user!.userId, currentPassword, newPassword);
      await createAuditLog(req, {
        action: 'PASSWORD_CHANGE',
        description: 'User changed their password',
      });
      res.json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
