import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
type AuditAction = string;

export interface AuditContext {
  action: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}

export async function createAuditLog(
  req: Request,
  context: AuditContext
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: context.action,
        entityType: context.entityType,
        entityId: context.entityId,
        description: context.description,
        oldValue: context.oldValue as any,
        newValue: context.newValue as any,
        ipAddress: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    });
  } catch (error) {
    // Audit log failures should never crash the application
    console.error('[Audit] Failed to create audit log:', error);
  }
}

// Middleware that attaches audit log helper to request
export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  (req as any).audit = (context: AuditContext) => createAuditLog(req, context);
  next();
}
