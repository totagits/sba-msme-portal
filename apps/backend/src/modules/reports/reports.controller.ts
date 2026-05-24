import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { createError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../middleware/audit';
import { z } from 'zod';

const reportSchema = z.object({
  title: z.string().min(3),
  reportType: z.string(),
  period: z.string().optional(),
  countyId: z.string().uuid().optional(),
  sectorId: z.string().uuid().optional(),
  filters: z.record(z.any()).optional(),
});

export class ReportsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string || '1'));
      const limit = Math.min(50, parseInt(req.query.limit as string || '20'));
      const where: any = { deletedAt: null };
      if (req.query.reportType) where.reportType = req.query.reportType;
      const [total, reports] = await Promise.all([
        prisma.report.count({ where }),
        prisma.report.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { createdAt: 'desc' }, include: { generatedBy: { select: { id: true, firstName: true, lastName: true } }, exports: true } }),
      ]);
      res.json({ success: true, data: reports, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await prisma.report.findUnique({ where: { id: req.params.id }, include: { generatedBy: { select: { id: true, firstName: true, lastName: true } }, exports: true } });
      if (!report) throw createError('Report not found', 404, 'NOT_FOUND');
      res.json({ success: true, data: report });
    } catch (err) { next(err); }
  }

  async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, reportType, period, countyId, sectorId, filters } = reportSchema.parse(req.body);
      const msmeWhere: any = { deletedAt: null };
      if (countyId) msmeWhere.countyId = countyId;
      if (sectorId) msmeWhere.sectorId = sectorId;

      const [totalMSMEs, approvedMSMEs, verifiedMSMEs, youthLed, womenLed, totalBDSPs, employment] = await Promise.all([
        prisma.mSME.count({ where: msmeWhere }),
        prisma.mSME.count({ where: { ...msmeWhere, workflowStatus: 'APPROVED' } }),
        prisma.mSME.count({ where: { ...msmeWhere, workflowStatus: 'VERIFIED' } }),
        prisma.mSME.count({ where: { ...msmeWhere, isYouthLed: true } }),
        prisma.mSME.count({ where: { ...msmeWhere, isWomenLed: true } }),
        prisma.bDSP.count({ where: { deletedAt: null } }),
        prisma.mSME.aggregate({ where: msmeWhere, _sum: { numberOfEmployees: true, numberOfFemaleEmployees: true } }),
      ]);

      const counties = await prisma.county.findMany({ select: { id: true, name: true } });
      const countyBreakdown = await Promise.all(counties.map(async (c: any) => ({
        county: c.name, total: await prisma.mSME.count({ where: { countyId: c.id, deletedAt: null } }),
        approved: await prisma.mSME.count({ where: { countyId: c.id, deletedAt: null, workflowStatus: 'APPROVED' } }),
      })));

      const sectors = await prisma.sector.findMany({ select: { id: true, name: true } });
      const sectorBreakdown = await Promise.all(sectors.map(async (s: any) => ({
        sector: s.name, total: await prisma.mSME.count({ where: { sectorId: s.id, deletedAt: null } }),
      })));

      const summary = { totalMSMEs, approvedMSMEs, verifiedMSMEs, youthLed, womenLed, totalBDSPs,
        employment: { total: employment._sum.numberOfEmployees || 0, female: employment._sum.numberOfFemaleEmployees || 0 },
        countyBreakdown: countyBreakdown.filter(c => c.total > 0),
        sectorBreakdown: sectorBreakdown.filter(s => s.total > 0) };

      const report = await prisma.report.create({ data: { title, reportType, period, countyId, sectorId, filters: filters as any, summary: summary as any, generatedById: req.user!.userId } });

      await createAuditLog(req, { action: 'CREATE', entityType: 'Report', entityId: report.id, description: `Generated report: ${title}` });
      res.status(201).json({ success: true, data: { ...report, summary } });
    } catch (err) { next(err); }
  }

  async exportCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await prisma.report.findUnique({ where: { id: req.params.id } });
      if (!report) throw createError('Report not found', 404, 'NOT_FOUND');
      const summary = report.summary as any;
      let csv = `Report: ${report.title}\nGenerated: ${report.createdAt.toISOString()}\nPeriod: ${report.period || 'All time'}\n\n`;
      csv += 'Metric,Value\n';
      csv += `Total MSMEs,${summary?.totalMSMEs || 0}\nApproved MSMEs,${summary?.approvedMSMEs || 0}\nVerified MSMEs,${summary?.verifiedMSMEs || 0}\n`;
      csv += `Youth-Led,${summary?.youthLed || 0}\nWomen-Led,${summary?.womenLed || 0}\nTotal BDSPs,${summary?.totalBDSPs || 0}\n\n`;
      csv += 'County,Total MSMEs,Approved\n';
      (summary?.countyBreakdown || []).forEach((c: any) => { csv += `${c.county},${c.total},${c.approved}\n`; });
      await createAuditLog(req, { action: 'EXPORT', entityType: 'Report', entityId: req.params.id, description: `Exported report as CSV` });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report-${report.id}.csv`);
      res.send(csv);
    } catch (err) { next(err); }
  }
}
export const reportsController = new ReportsController();
