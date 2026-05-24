import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../config/prisma';
import { createError } from './errorHandler';

export interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw createError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    const token = authHeader.substring(7);
    let payload: JWTPayload;

    try {
      payload = jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw createError('Token expired', 401, 'TOKEN_EXPIRED');
      }
      throw createError('Invalid token', 401, 'INVALID_TOKEN');
    }

    // Check user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId, deletedAt: null },
      select: { id: true, status: true, email: true },
    });

    if (!user) throw createError('User not found', 401, 'USER_NOT_FOUND');
    if (user.status === 'SUSPENDED') throw createError('Account suspended', 403, 'ACCOUNT_SUSPENDED');
    if (user.status === 'LOCKED') throw createError('Account locked', 403, 'ACCOUNT_LOCKED');

    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}

export function authorize(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(createError('Authentication required', 401, 'AUTH_REQUIRED'));
      return;
    }

    if (requiredPermissions.length === 0) {
      next();
      return;
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.some(p => userPermissions.includes(p));

    if (!hasPermission) {
      next(createError('Insufficient permissions', 403, 'FORBIDDEN'));
      return;
    }

    next();
  };
}

export function authorizeRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(createError('Authentication required', 401, 'AUTH_REQUIRED'));
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some(r => userRoles.includes(r));

    if (!hasRole) {
      next(createError('Insufficient role privileges', 403, 'FORBIDDEN'));
      return;
    }

    next();
  };
}
