import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { NotificationType } from '@prisma/client';

export async function createNotification(userId: string, type: NotificationType, title: string, message: string, entityType?: string, entityId?: string) {
  return prisma.notification.create({ data: { userId, type, title, message, entityType, entityId } });
}

export class NotificationsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string || '1'));
      const limit = Math.min(50, parseInt(req.query.limit as string || '20'));
      const where: any = { userId: req.user!.userId };
      if (req.query.isRead !== undefined) where.isRead = req.query.isRead === 'true';
      const [total, notifications] = await Promise.all([
        prisma.notification.count({ where }),
        prisma.notification.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { createdAt: 'desc' } }),
      ]);
      res.json({ success: true, data: notifications, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } });
    } catch (err) { next(err); }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await prisma.notification.count({ where: { userId: req.user!.userId, isRead: false } });
      res.json({ success: true, data: { count } });
    } catch (err) { next(err); }
  }

  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await prisma.notification.update({ where: { id: req.params.id, userId: req.user!.userId }, data: { isRead: true, readAt: new Date() } });
      res.json({ success: true });
    } catch (err) { next(err); }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await prisma.notification.updateMany({ where: { userId: req.user!.userId, isRead: false }, data: { isRead: true, readAt: new Date() } });
      res.json({ success: true });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await prisma.notification.delete({ where: { id: req.params.id, userId: req.user!.userId } });
      res.json({ success: true });
    } catch (err) { next(err); }
  }
}
export const notificationsController = new NotificationsController();
