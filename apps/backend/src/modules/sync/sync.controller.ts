import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { createAuditLog } from '../../middleware/audit';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';

const syncRecordSchema = z.object({
  entityType: z.enum(['MSME', 'BDSP']),
  payload: z.record(z.any()),
  localId: z.string().optional(),
  sessionId: z.string().uuid().optional(),
});

export class SyncController {
  async syncRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const records = z.array(syncRecordSchema).parse(req.body.records || []);
      const results: Array<{ localId?: string; status: string; serverRecordId?: string; error?: string }> = [];

      for (const record of records) {
        try {
          let serverRecordId: string | undefined;
          if (record.entityType === 'MSME') {
            const { id: _, ...payload } = record.payload;
            // Check for duplicates
            const duplicate = await prisma.mSME.findFirst({ where: { businessName: { equals: payload.businessName, mode: 'insensitive' }, countyId: payload.countyId, deletedAt: null } });
            if (duplicate) {
              results.push({ localId: record.localId, status: 'DUPLICATE', serverRecordId: duplicate.id });
              continue;
            }
            const msme = await prisma.mSME.create({ data: { ...payload, createdById: req.user!.userId } });
            serverRecordId = msme.id;
          }
          results.push({ localId: record.localId, status: 'SYNCED', serverRecordId });
        } catch (err: any) {
          results.push({ localId: record.localId, status: 'FAILED', error: err.message });
        }
      }

      await createAuditLog(req, { action: AuditAction.SYNC, description: `Synced ${records.length} offline records` });
      res.json({ success: true, data: { results, synced: results.filter(r => r.status === 'SYNCED').length, failed: results.filter(r => r.status === 'FAILED').length, duplicates: results.filter(r => r.status === 'DUPLICATE').length } });
    } catch (err) { next(err); }
  }

  async startSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await prisma.fieldCollectionSession.create({ data: { userId: req.user!.userId, deviceInfo: req.body.deviceInfo, countyId: req.body.countyId } });
      res.status(201).json({ success: true, data: session });
    } catch (err) { next(err); }
  }

  async endSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await prisma.fieldCollectionSession.update({ where: { id: req.params.id }, data: { endedAt: new Date(), totalCollected: req.body.totalCollected || 0, totalSynced: req.body.totalSynced || 0, totalFailed: req.body.totalFailed || 0 } });
      res.json({ success: true, data: session });
    } catch (err) { next(err); }
  }
}
export const syncController = new SyncController();
