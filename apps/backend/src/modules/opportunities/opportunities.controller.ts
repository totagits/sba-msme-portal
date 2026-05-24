import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { createError } from '../../middleware/errorHandler';
import { z } from 'zod';

const opportunitySchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  type: z.enum(['FINANCING','TRAINING','GRANT','PROCUREMENT','MARKET_LINKAGE','MENTORSHIP','EQUIPMENT_SUPPORT']),
  status: z.enum(['DRAFT','OPEN','MATCHED','UNDER_REVIEW','AWARDED','CLOSED']).default('DRAFT'),
  countyId: z.string().uuid().optional(),
  sectorId: z.string().uuid().optional(),
  targetCategory: z.enum(['MICRO','SMALL','MEDIUM']).optional(),
  deadline: z.string().datetime().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  providedBy: z.string().optional(),
  contactEmail: z.string().email().optional(),
  requirements: z.string().optional(),
});

export class OpportunitiesController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string || '1'));
      const limit = Math.min(50, parseInt(req.query.limit as string || '20'));
      const where: any = { deletedAt: null };
      if (req.query.type) where.type = req.query.type;
      if (req.query.status) where.status = req.query.status;
      if (req.query.countyId) where.countyId = req.query.countyId;
      const [total, opps] = await Promise.all([
        prisma.opportunity.count({ where }),
        prisma.opportunity.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { createdAt: 'desc' },
          include: { county: { select: { name: true } }, _count: { select: { matches: true } } } }),
      ]);
      res.json({ success: true, data: opps, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id }, include: { county: true, matches: { include: { msme: { select: { id: true, businessName: true, countyId: true, msmeCategory: true } } } } } });
      if (!opp) throw createError('Opportunity not found', 404, 'NOT_FOUND');
      res.json({ success: true, data: opp });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = opportunitySchema.parse(req.body);
      const opp = await prisma.opportunity.create({ data: { ...data, createdById: req.user!.userId } });
      res.status(201).json({ success: true, data: opp });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = opportunitySchema.partial().parse(req.body);
      const opp = await prisma.opportunity.update({ where: { id: req.params.id }, data });
      res.json({ success: true, data: opp });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await prisma.opportunity.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
      res.json({ success: true });
    } catch (err) { next(err); }
  }

  async addMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { msmeId } = z.object({ msmeId: z.string().uuid() }).parse(req.body);
      const msme = await prisma.mSME.findUnique({ where: { id: msmeId, deletedAt: null } });
      if (!msme) throw createError('MSME not found', 404, 'NOT_FOUND');
      const match = await prisma.opportunityMatch.create({ data: { opportunityId: req.params.id, msmeId, status: 'EXPRESSED_INTEREST' } });
      res.status(201).json({ success: true, data: match });
    } catch (err) { next(err); }
  }

  async updateMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, notes } = z.object({ status: z.enum(['EXPRESSED_INTEREST','SHORTLISTED','AWARDED','REJECTED']), notes: z.string().optional() }).parse(req.body);
      const match = await prisma.opportunityMatch.update({ where: { id: req.params.matchId }, data: { status, notes } });
      res.json({ success: true, data: match });
    } catch (err) { next(err); }
  }
}
export const opportunitiesController = new OpportunitiesController();
