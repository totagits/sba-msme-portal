import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

export class AnalyticsController {
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [totalMSMEs, verifiedMSMEs, approvedMSMEs, totalBDSPs, youthLed, womenLed, employment, pendingVerification] = await Promise.all([
        prisma.mSME.count({ where: { deletedAt: null } }),
        prisma.mSME.count({ where: { deletedAt: null, workflowStatus: 'VERIFIED' } }),
        prisma.mSME.count({ where: { deletedAt: null, workflowStatus: 'APPROVED' } }),
        prisma.bDSP.count({ where: { deletedAt: null } }),
        prisma.mSME.count({ where: { deletedAt: null, isYouthLed: true } }),
        prisma.mSME.count({ where: { deletedAt: null, isWomenLed: true } }),
        prisma.mSME.aggregate({ where: { deletedAt: null }, _sum: { numberOfEmployees: true, numberOfFemaleEmployees: true, numberOfYouthEmployees: true } }),
        prisma.mSME.count({ where: { deletedAt: null, workflowStatus: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
      ]);

      res.json({
        success: true,
        data: {
          totalMSMEs, verifiedMSMEs, approvedMSMEs, totalBDSPs,
          youthLed, womenLed,
          pendingVerification,
          employment: {
            total: employment._sum.numberOfEmployees || 0,
            female: employment._sum.numberOfFemaleEmployees || 0,
            youth: employment._sum.numberOfYouthEmployees || 0,
          },
        },
      });
    } catch (err) { next(err); }
  }

  async msmesByCounty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const counties = await prisma.county.findMany({ select: { id: true, name: true } });
      const data = await Promise.all(counties.map(async (county: any) => {
        const [total, approved, youth, women] = await Promise.all([
          prisma.mSME.count({ where: { countyId: county.id, deletedAt: null } }),
          prisma.mSME.count({ where: { countyId: county.id, deletedAt: null, workflowStatus: 'APPROVED' } }),
          prisma.mSME.count({ where: { countyId: county.id, deletedAt: null, isYouthLed: true } }),
          prisma.mSME.count({ where: { countyId: county.id, deletedAt: null, isWomenLed: true } }),
        ]);
        return { county: county.name, countyId: county.id, total, approved, youth, women };
      }));
      res.json({ success: true, data: data.filter(d => d.total > 0) });
    } catch (err) { next(err); }
  }

  async msmesBySector(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sectors = await prisma.sector.findMany({ select: { id: true, name: true } });
      const data = await Promise.all(sectors.map(async (sector: any) => {
        const total = await prisma.mSME.count({ where: { sectorId: sector.id, deletedAt: null } });
        return { sector: sector.name, sectorId: sector.id, total };
      }));
      res.json({ success: true, data: data.filter(d => d.total > 0) });
    } catch (err) { next(err); }
  }

  async msmesByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [micro, small, medium] = await Promise.all([
        prisma.mSME.count({ where: { deletedAt: null, msmeCategory: 'MICRO' } }),
        prisma.mSME.count({ where: { deletedAt: null, msmeCategory: 'SMALL' } }),
        prisma.mSME.count({ where: { deletedAt: null, msmeCategory: 'MEDIUM' } }),
      ]);
      res.json({ success: true, data: [{ name: 'Micro', value: micro }, { name: 'Small', value: small }, { name: 'Medium', value: medium }] });
    } catch (err) { next(err); }
  }

  async msmesByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const statuses = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'RETURNED_FOR_CORRECTION', 'VERIFIED', 'APPROVED', 'REJECTED', 'ARCHIVED'];
      const data = await Promise.all(statuses.map(async (status) => {
        const count = await prisma.mSME.count({ where: { deletedAt: null, workflowStatus: status as any } });
        return { status, count };
      }));
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async monthlyRegistrations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const months: Array<{ month: string; count: number }> = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
        const count = await prisma.mSME.count({ where: { deletedAt: null, createdAt: { gte: startOfMonth, lte: endOfMonth } } });
        months.push({ month: startOfMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), count });
      }
      res.json({ success: true, data: months });
    } catch (err) { next(err); }
  }

  async dataQuality(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [total, noGPS, noPhone, noEmail, noSector, unverified, pendingCorrection] = await Promise.all([
        prisma.mSME.count({ where: { deletedAt: null } }),
        prisma.mSME.count({ where: { deletedAt: null, gpsLatitude: null } }),
        prisma.mSME.count({ where: { deletedAt: null, phone: null } }),
        prisma.mSME.count({ where: { deletedAt: null, email: null } }),
        prisma.mSME.count({ where: { deletedAt: null, sectorId: null } }),
        prisma.mSME.count({ where: { deletedAt: null, workflowStatus: { in: ['DRAFT', 'SUBMITTED'] } } }),
        prisma.mSME.count({ where: { deletedAt: null, workflowStatus: 'RETURNED_FOR_CORRECTION' } }),
      ]);
      res.json({ success: true, data: { total, noGPS, noPhone, noEmail, noSector, unverified, pendingCorrection, completenessRate: total > 0 ? Math.round(((total - noGPS - noPhone) / total) * 100) : 0 } });
    } catch (err) { next(err); }
  }
}
export const analyticsController = new AnalyticsController();
