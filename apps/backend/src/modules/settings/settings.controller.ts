import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { createError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../middleware/audit';
import { z } from 'zod';

const settingSchema = z.object({ value: z.string() });
const countySchema = z.object({ name: z.string().min(2), code: z.string().min(2), capital: z.string().optional(), latitude: z.number().optional(), longitude: z.number().optional() });
const sectorSchema = z.object({ name: z.string().min(2), code: z.string().min(2), description: z.string().optional() });
const districtSchema = z.object({ name: z.string().min(2), countyId: z.string().uuid() });

export class SettingsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await prisma.systemSetting.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] });
      const grouped = settings.reduce((acc: any, s: any) => { const cat = s.category || 'general'; if (!acc[cat]) acc[cat] = []; acc[cat].push(s); return acc; }, {} as Record<string, typeof settings>);
      res.json({ success: true, data: grouped });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { value } = settingSchema.parse(req.body);
      const setting = await prisma.systemSetting.findUnique({ where: { key: req.params.key } });
      if (!setting) throw createError('Setting not found', 404, 'NOT_FOUND');
      const updated = await prisma.systemSetting.update({ where: { key: req.params.key }, data: { value } });
      await createAuditLog(req, { action: 'UPDATE', entityType: 'Setting', entityId: req.params.key, description: `Updated setting: ${req.params.key}` });
      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  }

  async getCounties(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const counties = await prisma.county.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { msmes: true } } } });
      res.json({ success: true, data: counties });
    } catch (err) { next(err); }
  }

  async createCounty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = countySchema.parse(req.body);
      const county = await prisma.county.create({ data });
      res.status(201).json({ success: true, data: county });
    } catch (err) { next(err); }
  }

  async updateCounty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = countySchema.partial().parse(req.body);
      const county = await prisma.county.update({ where: { id: req.params.id }, data });
      res.json({ success: true, data: county });
    } catch (err) { next(err); }
  }

  async getSectors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sectors = await prisma.sector.findMany({ orderBy: { name: 'asc' }, include: { subsectors: true, _count: { select: { msmes: true } } } });
      res.json({ success: true, data: sectors });
    } catch (err) { next(err); }
  }

  async createSector(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = sectorSchema.parse(req.body);
      const sector = await prisma.sector.create({ data });
      res.status(201).json({ success: true, data: sector });
    } catch (err) { next(err); }
  }

  async getDistricts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const where: any = {};
      if (req.query.countyId) where.countyId = req.query.countyId;
      const districts = await prisma.district.findMany({ where, orderBy: { name: 'asc' }, include: { county: { select: { id: true, name: true } } } });
      res.json({ success: true, data: districts });
    } catch (err) { next(err); }
  }

  async createDistrict(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = districtSchema.parse(req.body);
      const district = await prisma.district.create({ data });
      res.status(201).json({ success: true, data: district });
    } catch (err) { next(err); }
  }
}
export const settingsController = new SettingsController();
