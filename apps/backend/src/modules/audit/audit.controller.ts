import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { createError } from '../../middleware/errorHandler';

export class AuditController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string || '1'));
      const limit = Math.min(100, parseInt(req.query.limit as string || '50'));
      const skip = (page - 1) * limit;
      const where: any = {};
      if (req.query.userId) where.userId = req.query.userId;
      if (req.query.action) where.action = req.query.action;
      if (req.query.entityType) where.entityType = req.query.entityType;
      if (req.query.dateFrom || req.query.dateTo) {
        where.createdAt = {};
        if (req.query.dateFrom) where.createdAt.gte = new Date(req.query.dateFrom as string);
        if (req.query.dateTo) where.createdAt.lte = new Date(req.query.dateTo as string);
      }
      if (req.query.search) where.OR = [
        { description: { contains: req.query.search as string, mode: 'insensitive' } },
        { userEmail: { contains: req.query.search as string, mode: 'insensitive' } },
      ];
      const [total, logs] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } }),
      ]);
      res.json({ success: true, data: logs, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await prisma.auditLog.findUnique({ where: { id: req.params.id }, include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } });
      if (!log) throw createError('Audit log not found', 404, 'NOT_FOUND');
      res.json({ success: true, data: log });
    } catch (err) { next(err); }
  }
}
export const auditController = new AuditController();
