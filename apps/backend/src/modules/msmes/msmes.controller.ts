import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { createError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../middleware/audit';

const msmeSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  registrationNumber: z.string().optional(),
  taxIdentificationNumber: z.string().optional(),
  businessType: z.enum(['SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'CORPORATION', 'COOPERATIVE', 'ASSOCIATION', 'INFORMAL_ENTERPRISE']),
  msmeCategory: z.enum(['MICRO', 'SMALL', 'MEDIUM']),
  formalityStatus: z.enum(['REGISTERED', 'UNREGISTERED', 'PENDING_REGISTRATION']),
  sectorId: z.string().uuid().optional(),
  subsectorId: z.string().uuid().optional(),
  countyId: z.string().uuid(),
  districtId: z.string().uuid().optional(),
  cityTownCommunity: z.string().optional(),
  physicalAddress: z.string().optional(),
  gpsLatitude: z.number().min(-90).max(90).optional(),
  gpsLongitude: z.number().min(-180).max(180).optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  ownerName: z.string().optional(),
  ownerGender: z.string().optional(),
  ownerAge: z.number().int().min(15).max(120).optional(),
  ownerNationality: z.string().optional(),
  isYouthLed: z.boolean().default(false),
  isWomenLed: z.boolean().default(false),
  hasDisabilityInclusion: z.boolean().default(false),
  ownershipStructure: z.string().optional(),
  numberOfEmployees: z.number().int().min(0).optional(),
  numberOfFemaleEmployees: z.number().int().min(0).optional(),
  numberOfYouthEmployees: z.number().int().min(0).optional(),
  annualRevenueRange: z.enum(['UNDER_50K', 'FROM_50K_TO_200K', 'FROM_200K_TO_500K', 'FROM_500K_TO_1M', 'ABOVE_1M']).optional(),
  businessStage: z.enum(['IDEA', 'STARTUP', 'EARLY_GROWTH', 'GROWTH', 'MATURE']).optional(),
  digitalReadiness: z.enum(['NONE', 'BASIC', 'INTERMEDIATE', 'ADVANCED']).default('NONE'),
  financingNeeds: z.array(z.string()).default([]),
  trainingNeeds: z.array(z.string()).default([]),
  marketAccessNeeds: z.array(z.string()).default([]),
  equipmentNeeds: z.array(z.string()).default([]),
  productsServices: z.string().optional(),
  notes: z.string().optional(),
});

const workflowSchema = z.object({
  action: z.enum(['submit', 'return', 'verify', 'approve', 'reject', 'archive']),
  comment: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
});

function buildWhereClause(query: Record<string, string>) {
  const where: any = { deletedAt: null };

  if (query.search) {
    where.OR = [
      { businessName: { contains: query.search, mode: 'insensitive' } },
      { registrationNumber: { contains: query.search, mode: 'insensitive' } },
      { ownerName: { contains: query.search, mode: 'insensitive' } },
      { phone: { contains: query.search } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.countyId) where.countyId = query.countyId;
  if (query.sectorId) where.sectorId = query.sectorId;
  if (query.msmeCategory) where.msmeCategory = query.msmeCategory;
  if (query.workflowStatus) where.workflowStatus = query.workflowStatus;
  if (query.formalityStatus) where.formalityStatus = query.formalityStatus;
  if (query.businessType) where.businessType = query.businessType;
  if (query.businessStage) where.businessStage = query.businessStage;
  if (query.isYouthLed === 'true') where.isYouthLed = true;
  if (query.isWomenLed === 'true') where.isWomenLed = true;
  if (query.hasDisabilityInclusion === 'true') where.hasDisabilityInclusion = true;

  return where;
}

export class MSMEController {
  /**
   * @swagger
   * /api/msmes:
   *   get:
   *     tags: [MSMEs]
   *     summary: List MSMEs with pagination, search, and filters
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 20 }
   *       - in: query
   *         name: search
   *         schema: { type: string }
   *       - in: query
   *         name: countyId
   *         schema: { type: string }
   *       - in: query
   *         name: sectorId
   *         schema: { type: string }
   *       - in: query
   *         name: msmeCategory
   *         schema: { type: string, enum: [MICRO, SMALL, MEDIUM] }
   *       - in: query
   *         name: workflowStatus
   *         schema: { type: string }
   *       - in: query
   *         name: isYouthLed
   *         schema: { type: boolean }
   *       - in: query
   *         name: isWomenLed
   *         schema: { type: boolean }
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string || '1'));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string || '20')));
      const skip = (page - 1) * limit;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

      const where = buildWhereClause(req.query as Record<string, string>);

      const [total, msmes] = await Promise.all([
        prisma.mSME.count({ where }),
        prisma.mSME.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          select: {
            id: true,
            businessName: true,
            registrationNumber: true,
            msmeCategory: true,
            businessType: true,
            formalityStatus: true,
            workflowStatus: true,
            isYouthLed: true,
            isWomenLed: true,
            phone: true,
            email: true,
            ownerName: true,
            ownerGender: true,
            numberOfEmployees: true,
            businessStage: true,
            gpsLatitude: true,
            gpsLongitude: true,
            cityTownCommunity: true,
            createdAt: true,
            updatedAt: true,
            county: { select: { id: true, name: true } },
            sector: { select: { id: true, name: true } },
          },
        }),
      ]);

      res.json({
        success: true,
        data: msmes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /api/msmes/{id}:
   *   get:
   *     tags: [MSMEs]
   *     summary: Get MSME by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const msme = await prisma.mSME.findUnique({
        where: { id: req.params.id, deletedAt: null },
        include: {
          county: true,
          district: true,
          sector: true,
          subsector: true,
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          owners: true,
          products: { where: { deletedAt: null } },
          documents: true,
          verifications: {
            include: { officer: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          workflowActions: {
            include: { user: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' },
          },
          opportunityMatches: {
            include: { opportunity: { select: { id: true, title: true, type: true, status: true } } },
          },
        },
      });

      if (!msme) throw createError('MSME not found', 404, 'NOT_FOUND');

      res.json({ success: true, data: msme });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /api/msmes:
   *   post:
   *     tags: [MSMEs]
   *     summary: Create a new MSME record
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = msmeSchema.parse(req.body);

      // Duplicate detection
      const duplicateChecks: any[] = [
        { businessName: { equals: data.businessName, mode: 'insensitive' }, countyId: data.countyId, deletedAt: null },
      ];
      if (data.registrationNumber) {
        duplicateChecks.push({ registrationNumber: data.registrationNumber, deletedAt: null });
      }
      if (data.taxIdentificationNumber) {
        duplicateChecks.push({ taxIdentificationNumber: data.taxIdentificationNumber, deletedAt: null });
      }
      if (data.phone) {
        duplicateChecks.push({ phone: data.phone, deletedAt: null });
      }

      const potential = await prisma.mSME.findFirst({ where: { OR: duplicateChecks } });
      if (potential) {
        res.status(409).json({
          success: false,
          error: {
            message: 'A potential duplicate record exists',
            code: 'DUPLICATE_DETECTED',
            duplicateId: potential.id,
            duplicateName: potential.businessName,
          },
        });
        return;
      }

      const msme = await prisma.mSME.create({
        data: {
          ...data,
          createdById: req.user!.userId,
          workflowStatus: 'DRAFT',
        },
      });

      await createAuditLog(req, {
        action: 'CREATE',
        entityType: 'MSME',
        entityId: msme.id,
        newValue: { businessName: msme.businessName, msmeCategory: msme.msmeCategory } as any,
        description: `Created MSME: ${msme.businessName}`,
      });

      res.status(201).json({ success: true, data: msme });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /api/msmes/{id}:
   *   put:
   *     tags: [MSMEs]
   *     summary: Update an MSME record
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const existing = await prisma.mSME.findUnique({ where: { id: req.params.id, deletedAt: null } });
      if (!existing) throw createError('MSME not found', 404, 'NOT_FOUND');

      const data = msmeSchema.partial().parse(req.body);

      const msme = await prisma.mSME.update({
        where: { id: req.params.id },
        data: { ...data, updatedById: req.user!.userId },
      });

      await createAuditLog(req, {
        action: 'UPDATE',
        entityType: 'MSME',
        entityId: msme.id,
        oldValue: { businessName: existing.businessName } as any,
        newValue: { businessName: msme.businessName } as any,
        description: `Updated MSME: ${msme.businessName}`,
      });

      res.json({ success: true, data: msme });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /api/msmes/{id}:
   *   delete:
   *     tags: [MSMEs]
   *     summary: Soft delete an MSME record
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const existing = await prisma.mSME.findUnique({ where: { id: req.params.id, deletedAt: null } });
      if (!existing) throw createError('MSME not found', 404, 'NOT_FOUND');

      await prisma.mSME.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date(), updatedById: req.user!.userId },
      });

      await createAuditLog(req, {
        action: 'SOFT_DELETE',
        entityType: 'MSME',
        entityId: req.params.id,
        description: `Soft deleted MSME: ${existing.businessName}`,
      });

      res.json({ success: true, message: 'MSME record deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /api/msmes/{id}/workflow:
   *   post:
   *     tags: [MSMEs]
   *     summary: Perform a workflow action on an MSME record
   */
  async workflow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { action, comment, assignedToId } = workflowSchema.parse(req.body);
      const existing = await prisma.mSME.findUnique({ where: { id: req.params.id, deletedAt: null } });
      if (!existing) throw createError('MSME not found', 404, 'NOT_FOUND');

      const statusMap: Record<string, string> = {
        submit: 'SUBMITTED',
        return: 'RETURNED_FOR_CORRECTION',
        verify: 'VERIFIED',
        approve: 'APPROVED',
        reject: 'REJECTED',
        archive: 'ARCHIVED',
      };

      const newStatus = statusMap[action] as any;

      await prisma.$transaction([
        prisma.mSME.update({
          where: { id: req.params.id },
          data: {
            workflowStatus: newStatus,
            updatedById: req.user!.userId,
            ...(action === 'verify' ? { verifiedById: req.user!.userId, verifiedAt: new Date() } : {}),
            ...(action === 'approve' ? { approvedById: req.user!.userId, approvedAt: new Date() } : {}),
            ...(action === 'reject' ? { rejectionReason: comment } : {}),
            ...(action === 'return' ? { correctionComments: comment } : {}),
          },
        }),
        prisma.workflowAction.create({
          data: {
            msmeId: req.params.id,
            userId: req.user!.userId,
            fromStatus: existing.workflowStatus,
            toStatus: newStatus,
            comment,
            assignedToId,
          },
        }),
      ]);

      await createAuditLog(req, {
        action: 'APPROVE',
        entityType: 'MSME',
        entityId: req.params.id,
        description: `Workflow action '${action}' on MSME: ${existing.businessName}`,
      });

      res.json({ success: true, message: `MSME ${action} completed successfully` });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /api/msmes/map:
   *   get:
   *     tags: [MSMEs]
   *     summary: Get MSMEs with GPS coordinates for map display
   */
  async mapData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const where = buildWhereClause(req.query as Record<string, string>);
      where.gpsLatitude = { not: null };
      where.gpsLongitude = { not: null };

      const msmes = await prisma.mSME.findMany({
        where,
        take: 2000,
        select: {
          id: true,
          businessName: true,
          msmeCategory: true,
          workflowStatus: true,
          isYouthLed: true,
          isWomenLed: true,
          gpsLatitude: true,
          gpsLongitude: true,
          cityTownCommunity: true,
          county: { select: { name: true } },
          sector: { select: { name: true } },
        },
      });

      res.json({ success: true, data: msmes });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /api/msmes/export:
   *   get:
   *     tags: [MSMEs]
   *     summary: Export MSMEs as CSV
   */
  async export(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const where = buildWhereClause(req.query as Record<string, string>);

      const msmes = await prisma.mSME.findMany({
        where,
        take: 10000,
        include: {
          county: { select: { name: true } },
          sector: { select: { name: true } },
          district: { select: { name: true } },
        },
      });

      const csvHeaders = [
        'ID', 'Business Name', 'Registration Number', 'TIN', 'Business Type', 'Category',
        'Formality Status', 'Sector', 'County', 'District', 'City/Town', 'Physical Address',
        'Phone', 'Email', 'Owner Name', 'Owner Gender', 'Owner Age', 'Youth Led', 'Women Led',
        'Employees', 'Female Employees', 'Youth Employees', 'Business Stage', 'Status',
        'GPS Latitude', 'GPS Longitude', 'Created At',
      ].join(',');

      await createAuditLog(req, {
        action: 'EXPORT',
        entityType: 'MSME',
        description: `Exported ${msmes.length} MSME records`,
      });

      const csvRows = msmes.map((m: any) => [
        m.id, `"${m.businessName}"`, m.registrationNumber || '', m.taxIdentificationNumber || '',
        m.businessType, m.msmeCategory, m.formalityStatus, m.sector?.name || '', m.county.name,
        m.district?.name || '', m.cityTownCommunity || '', `"${m.physicalAddress || ''}"`,
        m.phone || '', m.email || '', `"${m.ownerName || ''}"`, m.ownerGender || '',
        m.ownerAge || '', m.isYouthLed ? 'Yes' : 'No', m.isWomenLed ? 'Yes' : 'No',
        m.numberOfEmployees || 0, m.numberOfFemaleEmployees || 0, m.numberOfYouthEmployees || 0,
        m.businessStage || '', m.workflowStatus, m.gpsLatitude || '', m.gpsLongitude || '',
        m.createdAt.toISOString(),
      ].join(','));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=msmes-export-${Date.now()}.csv`);
      res.send([csvHeaders, ...csvRows].join('\n'));
    } catch (err) {
      next(err);
    }
  }
}

export const msmeController = new MSMEController();
