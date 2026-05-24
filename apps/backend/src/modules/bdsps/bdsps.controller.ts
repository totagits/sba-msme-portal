import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { createError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../middleware/audit';
import { AuditAction, WorkflowStatus, Prisma } from '@prisma/client';
import { z } from 'zod';

const bdspSchema = z.object({
  providerName: z.string().min(2),
  providerType: z.enum(['CONSULTANT','TRAINING_INSTITUTION','INCUBATOR','ACCELERATOR','FINANCIAL_INSTITUTION','NGO','COOPERATIVE_SUPPORT','MENTOR','TECHNOLOGY_PROVIDER','MARKET_LINKAGE','LEGAL_ACCOUNTING']),
  registrationStatus: z.enum(['REGISTERED','UNREGISTERED','PENDING_REGISTRATION']).default('REGISTERED'),
  areaOfExpertise: z.array(z.string()).default([]),
  servicesOffered: z.array(z.string()).default([]),
  countiesServed: z.array(z.string()).default([]),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  physicalAddress: z.string().optional(),
  gpsLatitude: z.number().optional(),
  gpsLongitude: z.number().optional(),
  yearsOfExperience: z.number().int().min(0).optional(),
  targetBeneficiaries: z.string().optional(),
  staffCapacity: z.number().int().min(0).optional(),
  pastAssignments: z.string().optional(),
  certifications: z.array(z.string()).default([]),
  servicePricingModel: z.string().optional(),
  availabilityStatus: z.enum(['AVAILABLE','UNAVAILABLE','SEASONAL']).default('AVAILABLE'),
  sectorId: z.string().uuid().optional(),
  countyId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

function buildBDSPWhere(query: Record<string, string>): Prisma.BDSPWhereInput {
  const where: Prisma.BDSPWhereInput = { deletedAt: null };
  if (query.search) where.OR = [
    { providerName: { contains: query.search, mode: 'insensitive' } },
    { contactPerson: { contains: query.search, mode: 'insensitive' } },
    { phone: { contains: query.search } },
  ];
  if (query.countyId) where.countyId = query.countyId;
  if (query.providerType) where.providerType = query.providerType as any;
  if (query.workflowStatus) where.workflowStatus = query.workflowStatus as WorkflowStatus;
  if (query.availabilityStatus) where.availabilityStatus = query.availabilityStatus as any;
  if (query.sectorId) where.sectorId = query.sectorId;
  return where;
}

export class BDSPController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string || '1'));
      const limit = Math.min(100, parseInt(req.query.limit as string || '20'));
      const skip = (page - 1) * limit;
      const where = buildBDSPWhere(req.query as any);
      const [total, bdsps] = await Promise.all([
        prisma.bDSP.count({ where }),
        prisma.bDSP.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' },
          include: { county: { select: { id: true, name: true } }, sector: { select: { id: true, name: true } } } }),
      ]);
      res.json({ success: true, data: bdsps, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bdsp = await prisma.bDSP.findUnique({ where: { id: req.params.id, deletedAt: null },
        include: { county: true, sector: true, services: true, documents: true,
          workflowActions: { include: { user: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } },
          createdBy: { select: { id: true, firstName: true, lastName: true } } } });
      if (!bdsp) throw createError('BDSP not found', 404, 'NOT_FOUND');
      res.json({ success: true, data: bdsp });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = bdspSchema.parse(req.body);
      const duplicate = await prisma.bDSP.findFirst({ where: { providerName: { equals: data.providerName, mode: 'insensitive' }, countyId: data.countyId, deletedAt: null } });
      if (duplicate) { res.status(409).json({ success: false, error: { message: 'Potential duplicate BDSP', code: 'DUPLICATE_DETECTED', duplicateId: duplicate.id } }); return; }
      const bdsp = await prisma.bDSP.create({ data: { ...data, createdById: req.user!.userId, workflowStatus: WorkflowStatus.DRAFT } });
      await createAuditLog(req, { action: AuditAction.CREATE, entityType: 'BDSP', entityId: bdsp.id, description: `Created BDSP: ${bdsp.providerName}` });
      res.status(201).json({ success: true, data: bdsp });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const existing = await prisma.bDSP.findUnique({ where: { id: req.params.id, deletedAt: null } });
      if (!existing) throw createError('BDSP not found', 404, 'NOT_FOUND');
      const data = bdspSchema.partial().parse(req.body);
      const bdsp = await prisma.bDSP.update({ where: { id: req.params.id }, data: { ...data, updatedById: req.user!.userId } });
      await createAuditLog(req, { action: AuditAction.UPDATE, entityType: 'BDSP', entityId: bdsp.id, description: `Updated BDSP: ${bdsp.providerName}` });
      res.json({ success: true, data: bdsp });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const existing = await prisma.bDSP.findUnique({ where: { id: req.params.id, deletedAt: null } });
      if (!existing) throw createError('BDSP not found', 404, 'NOT_FOUND');
      await prisma.bDSP.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
      await createAuditLog(req, { action: AuditAction.SOFT_DELETE, entityType: 'BDSP', entityId: req.params.id, description: `Deleted BDSP: ${existing.providerName}` });
      res.json({ success: true, message: 'BDSP deleted' });
    } catch (err) { next(err); }
  }

  async workflow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { action, comment } = z.object({ action: z.enum(['submit','return','verify','approve','reject','archive']), comment: z.string().optional() }).parse(req.body);
      const existing = await prisma.bDSP.findUnique({ where: { id: req.params.id, deletedAt: null } });
      if (!existing) throw createError('BDSP not found', 404, 'NOT_FOUND');
      const statusMap: Record<string, WorkflowStatus> = { submit: 'SUBMITTED', return: 'RETURNED_FOR_CORRECTION', verify: 'VERIFIED', approve: 'APPROVED', reject: 'REJECTED', archive: 'ARCHIVED' };
      const newStatus = statusMap[action];
      await prisma.$transaction([
        prisma.bDSP.update({ where: { id: req.params.id }, data: { workflowStatus: newStatus, updatedById: req.user!.userId, ...(action === 'reject' ? { rejectionReason: comment } : {}) } }),
        prisma.workflowAction.create({ data: { bdspId: req.params.id, userId: req.user!.userId, fromStatus: existing.workflowStatus, toStatus: newStatus, comment } }),
      ]);
      res.json({ success: true, message: `BDSP ${action} completed` });
    } catch (err) { next(err); }
  }

  async mapData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const where = buildBDSPWhere(req.query as any);
      where.gpsLatitude = { not: null };
      const bdsps = await prisma.bDSP.findMany({ where, take: 1000, select: { id: true, providerName: true, providerType: true, workflowStatus: true, gpsLatitude: true, gpsLongitude: true, county: { select: { name: true } } } });
      res.json({ success: true, data: bdsps });
    } catch (err) { next(err); }
  }

  async export(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const where = buildBDSPWhere(req.query as any);
      const bdsps = await prisma.bDSP.findMany({ where, take: 5000, include: { county: { select: { name: true } } } });
      const headers = ['ID','Provider Name','Type','County','Phone','Email','Years Exp','Staff Capacity','Status','Created At'].join(',');
      const rows = bdsps.map(b => [b.id, `"${b.providerName}"`, b.providerType, b.county?.name || '', b.phone || '', b.email || '', b.yearsOfExperience || '', b.staffCapacity || '', b.workflowStatus, b.createdAt.toISOString()].join(','));
      await createAuditLog(req, { action: AuditAction.EXPORT, entityType: 'BDSP', description: `Exported ${bdsps.length} BDSP records` });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=bdsps-export-${Date.now()}.csv`);
      res.send([headers, ...rows].join('\n'));
    } catch (err) { next(err); }
  }
}
export const bdspController = new BDSPController();
