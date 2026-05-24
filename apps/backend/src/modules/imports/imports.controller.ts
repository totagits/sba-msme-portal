import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { createAuditLog } from '../../middleware/audit';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export class ImportsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const batches = await prisma.importBatch.findMany({ orderBy: { createdAt: 'desc' }, include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } }, _count: { select: { errors: true } } } });
      res.json({ success: true, data: batches });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const batch = await prisma.importBatch.findUnique({ where: { id: req.params.id }, include: { errors: { take: 100 }, uploadedBy: { select: { id: true, firstName: true, lastName: true } } } });
      res.json({ success: true, data: batch });
    } catch (err) { next(err); }
  }

  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) { res.status(400).json({ success: false, error: { message: 'No file uploaded' } }); return; }

      const entityType = (req.body.entityType as string) || 'MSME';
      const filePath = req.file.path;
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

      const batch = await prisma.importBatch.create({
        data: { fileName: req.file.originalname, entityType, status: 'PROCESSING', totalRows: rows.length, uploadedById: req.user!.userId },
      });

      let successRows = 0, failedRows = 0, duplicateRows = 0;
      const errors: Array<{ batchId: string; rowNumber: number; field?: string; message: string; rawData?: any }> = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          if (!row.businessName || !row.countyId) { errors.push({ batchId: batch.id, rowNumber: i+2, field: 'businessName/countyId', message: 'Required fields missing', rawData: row }); failedRows++; continue; }
          const county = await prisma.county.findFirst({ where: { name: { equals: String(row.countyId), mode: 'insensitive' } } });
          if (!county) { errors.push({ batchId: batch.id, rowNumber: i+2, field: 'countyId', message: `County not found: ${row.countyId}`, rawData: row }); failedRows++; continue; }
          const duplicate = await prisma.mSME.findFirst({ where: { businessName: { equals: String(row.businessName), mode: 'insensitive' }, countyId: county.id, deletedAt: null } });
          if (duplicate) { errors.push({ batchId: batch.id, rowNumber: i+2, message: `Duplicate: ${row.businessName}`, rawData: row }); duplicateRows++; continue; }
          await prisma.mSME.create({ data: { businessName: String(row.businessName), businessType: (row.businessType || 'SOLE_PROPRIETORSHIP') as any, msmeCategory: (row.msmeCategory || 'MICRO') as any, formalityStatus: (row.formalityStatus || 'UNREGISTERED') as any, countyId: county.id, phone: row.phone ? String(row.phone) : undefined, email: row.email ? String(row.email) : undefined, ownerName: row.ownerName ? String(row.ownerName) : undefined, ownerGender: row.ownerGender ? String(row.ownerGender) : undefined, isYouthLed: row.isYouthLed === 'Yes' || row.isYouthLed === true, isWomenLed: row.isWomenLed === 'Yes' || row.isWomenLed === true, createdById: req.user!.userId, importBatchId: batch.id } });
          successRows++;
        } catch (err: any) { errors.push({ batchId: batch.id, rowNumber: i+2, message: err.message, rawData: row }); failedRows++; }
      }

      if (errors.length > 0) await prisma.importError.createMany({ data: errors });
      await prisma.importBatch.update({ where: { id: batch.id }, data: { status: 'COMPLETED', successRows, failedRows, duplicateRows } });

      try { fs.unlinkSync(filePath); } catch {}

      await createAuditLog(req, { action: 'IMPORT', entityType: 'MSME', entityId: batch.id, description: `Imported ${successRows} MSMEs from ${req.file.originalname}` });
      res.json({ success: true, data: { batchId: batch.id, totalRows: rows.length, successRows, failedRows, duplicateRows } });
    } catch (err) { next(err); }
  }

  async rollback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const batch = await prisma.importBatch.findUnique({ where: { id: req.params.id } });
      if (!batch) { res.status(404).json({ success: false, error: { message: 'Batch not found' } }); return; }
      if (batch.entityType === 'MSME') await prisma.mSME.updateMany({ where: { importBatchId: batch.id, deletedAt: null }, data: { deletedAt: new Date() } });
      await prisma.importBatch.update({ where: { id: batch.id }, data: { status: 'ROLLED_BACK', rolledBackAt: new Date() } });
      res.json({ success: true, message: 'Import batch rolled back' });
    } catch (err) { next(err); }
  }
}
export const importsController = new ImportsController();
