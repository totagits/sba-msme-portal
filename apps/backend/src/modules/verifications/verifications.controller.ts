import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { createError } from '../../middleware/errorHandler';
import { z } from 'zod';

const visitSchema = z.object({
  msmeId: z.string().uuid().optional(),
  bdspId: z.string().uuid().optional(),
  scheduledDate: z.string().datetime().optional(),
  visitDate: z.string().datetime().optional(),
  gpsLatitude: z.number().optional(),
  gpsLongitude: z.number().optional(),
  businessExists: z.boolean().optional(),
  ownershipConfirmed: z.boolean().optional(),
  locationConfirmed: z.boolean().optional(),
  notes: z.string().optional(),
  findings: z.string().optional(),
  outcome: z.string().optional(),
});

export class VerificationsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string || '1'));
      const limit = Math.min(50, parseInt(req.query.limit as string || '20'));
      const where: any = {};
      if (req.query.msmeId) where.msmeId = req.query.msmeId;
      if (req.query.bdspId) where.bdspId = req.query.bdspId;
      if (req.query.officerId) where.officerId = req.query.officerId;
      const [total, visits] = await Promise.all([
        prisma.verificationVisit.count({ where }),
        prisma.verificationVisit.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { createdAt: 'desc' },
          include: { officer: { select: { id: true, firstName: true, lastName: true } }, msme: { select: { id: true, businessName: true } }, documents: true } }),
      ]);
      res.json({ success: true, data: visits, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const visit = await prisma.verificationVisit.findUnique({ where: { id: req.params.id }, include: { officer: { select: { id: true, firstName: true, lastName: true } }, msme: true, documents: true } });
      if (!visit) throw createError('Visit not found', 404, 'NOT_FOUND');
      res.json({ success: true, data: visit });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = visitSchema.parse(req.body);
      const visit = await prisma.verificationVisit.create({ data: { ...data, officerId: req.user!.userId } });
      res.status(201).json({ success: true, data: visit });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = visitSchema.partial().parse(req.body);
      const visit = await prisma.verificationVisit.update({ where: { id: req.params.id }, data });
      res.json({ success: true, data: visit });
    } catch (err) { next(err); }
  }
}
export const verificationsController = new VerificationsController();
