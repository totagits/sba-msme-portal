import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
  priceRange: z.string().optional(),
  unitOfMeasure: z.string().optional(),
  productionCapacity: z.string().optional(),
  countyOfProduction: z.string().optional(),
  availability: z.enum(['AVAILABLE','OUT_OF_STOCK','SEASONAL','DISCONTINUED']).default('AVAILABLE'),
  imageUrl: z.string().optional(),
  marketReadiness: z.boolean().default(false),
  exportReadiness: z.boolean().default(false),
});

export class ProductsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string || '1'));
      const limit = Math.min(50, parseInt(req.query.limit as string || '20'));
      const where: any = { deletedAt: null, isApproved: true };
      if (req.query.msmeId) where.msmeId = req.query.msmeId;
      if (req.query.category) where.category = req.query.category;
      if (req.query.search) where.name = { contains: req.query.search as string, mode: 'insensitive' };
      const [total, products] = await Promise.all([
        prisma.mSMEProduct.count({ where }),
        prisma.mSMEProduct.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { createdAt: 'desc' }, include: { msme: { select: { id: true, businessName: true, countyId: true, county: { select: { name: true } } } } } }),
      ]);
      res.json({ success: true, data: products, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { msmeId } = req.body;
      if (!msmeId) { res.status(400).json({ success: false, error: { message: 'msmeId required' } }); return; }
      const data = productSchema.parse(req.body);
      const product = await prisma.mSMEProduct.create({ data: { ...data, msmeId } });
      res.status(201).json({ success: true, data: product });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = productSchema.partial().parse(req.body);
      const product = await prisma.mSMEProduct.update({ where: { id: req.params.id }, data });
      res.json({ success: true, data: product });
    } catch (err) { next(err); }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await prisma.mSMEProduct.update({ where: { id: req.params.id }, data: { isApproved: true, approvedAt: new Date() } });
      res.json({ success: true, data: product });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await prisma.mSMEProduct.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
      res.json({ success: true });
    } catch (err) { next(err); }
  }
}
export const productsController = new ProductsController();
