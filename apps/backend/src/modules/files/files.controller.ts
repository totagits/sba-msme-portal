import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../config/prisma';
import { createError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../middleware/audit';
import { config } from '../../config';

export class FilesController {
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) { res.status(400).json({ success: false, error: { message: 'No file uploaded' } }); return; }
      const { msmeId, bdspId, documentType } = req.body;
      const fileUrl = `/uploads/${req.file.filename}`;
      if (msmeId) {
        await prisma.mSMEDocument.create({ data: { msmeId, documentType: documentType || 'OTHER', fileName: req.file.originalname, fileUrl, fileSize: req.file.size, mimeType: req.file.mimetype, uploadedById: req.user!.userId } });
      } else if (bdspId) {
        await prisma.bDSPDocument.create({ data: { bdspId, documentType: documentType || 'OTHER', fileName: req.file.originalname, fileUrl, fileSize: req.file.size, mimeType: req.file.mimetype, uploadedById: req.user!.userId } });
      }
      await createAuditLog(req, { action: 'CREATE', entityType: 'File', description: `Uploaded file: ${req.file.originalname}` });
      res.json({ success: true, data: { url: fileUrl, fileName: req.file.originalname, size: req.file.size } });
    } catch (err) { next(err); }
  }

  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filePath = path.resolve(config.upload.dir, req.params.filename);
      if (!fs.existsSync(filePath)) throw createError('File not found', 404, 'NOT_FOUND');
      await createAuditLog(req, { action: 'DOWNLOAD', entityType: 'File', description: `Downloaded: ${req.params.filename}` });
      res.sendFile(filePath);
    } catch (err) { next(err); }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.query.msmeId) {
        const docs = await prisma.mSMEDocument.findMany({ where: { msmeId: req.query.msmeId as string } });
        res.json({ success: true, data: docs });
      } else if (req.query.bdspId) {
        const docs = await prisma.bDSPDocument.findMany({ where: { bdspId: req.query.bdspId as string } });
        res.json({ success: true, data: docs });
      } else {
        res.json({ success: true, data: [] });
      }
    } catch (err) { next(err); }
  }
}
export const filesController = new FilesController();
