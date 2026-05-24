import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { createError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../middleware/audit';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  countyId: z.string().uuid().optional(),
  roleNames: z.array(z.string()).default([]),
  temporaryPassword: z.string().min(8).optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  countyId: z.string().uuid().optional().nullable(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING', 'LOCKED']).optional(),
});

export class UsersController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string || '1'));
      const limit = Math.min(100, parseInt(req.query.limit as string || '20'));
      const skip = (page - 1) * limit;
      const where: any = { deletedAt: null };
      if (req.query.search) where.OR = [
        { email: { contains: req.query.search as string, mode: 'insensitive' } },
        { firstName: { contains: req.query.search as string, mode: 'insensitive' } },
        { lastName: { contains: req.query.search as string, mode: 'insensitive' } },
      ];
      if (req.query.status) where.status = req.query.status;
      if (req.query.countyId) where.countyId = req.query.countyId;

      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' },
          select: { id: true, email: true, firstName: true, lastName: true, phone: true, status: true, countyId: true, lastLoginAt: true, createdAt: true,
            county: { select: { id: true, name: true } },
            userRoles: { include: { role: { select: { name: true, displayName: true } } } } } }),
      ]);
      res.json({ success: true, data: users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.params.id, deletedAt: null },
        include: { county: true, userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } },
          loginHistory: { orderBy: { createdAt: 'desc' }, take: 10 } } });
      if (!user) throw createError('User not found', 404, 'NOT_FOUND');
      const { passwordHash, ...safeUser } = user as any;
      res.json({ success: true, data: safeUser });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, firstName, lastName, phone, countyId, roleNames, temporaryPassword } = createUserSchema.parse(req.body);
      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) throw createError('Email already registered', 409, 'DUPLICATE_EMAIL');
      const passwordHash = await bcrypt.hash(temporaryPassword || 'TempPass123!', 12);
      const roles = await prisma.role.findMany({ where: { name: { in: roleNames as any[] } } });
      const user = await prisma.user.create({
        data: { email: email.toLowerCase(), firstName, lastName, phone, countyId: countyId || null, passwordHash, status: 'ACTIVE',
          userRoles: { create: roles.map(r => ({ roleId: r.id, grantedBy: req.user!.userId })) } },
        include: { userRoles: { include: { role: true } } } });
      await createAuditLog(req, { action: AuditAction.CREATE, entityType: 'User', entityId: user.id, description: `Created user: ${user.email}` });
      const { passwordHash: _, ...safeUser } = user as any;
      res.status(201).json({ success: true, data: safeUser });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateUserSchema.parse(req.body);
      const user = await prisma.user.findUnique({ where: { id: req.params.id, deletedAt: null } });
      if (!user) throw createError('User not found', 404, 'NOT_FOUND');
      const updated = await prisma.user.update({ where: { id: req.params.id }, data: { ...data, ...(data.status === 'ACTIVE' ? { failedLoginAttempts: 0, lockedUntil: null } : {}) } });
      await createAuditLog(req, { action: AuditAction.UPDATE, entityType: 'User', entityId: user.id, description: `Updated user: ${user.email}` });
      const { passwordHash: _, ...safeUser } = updated as any;
      res.json({ success: true, data: safeUser });
    } catch (err) { next(err); }
  }

  async updateRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleNames } = z.object({ roleNames: z.array(z.string()) }).parse(req.body);
      const user = await prisma.user.findUnique({ where: { id: req.params.id, deletedAt: null } });
      if (!user) throw createError('User not found', 404, 'NOT_FOUND');
      const roles = await prisma.role.findMany({ where: { name: { in: roleNames as any[] } } });
      await prisma.$transaction([
        prisma.userRole.deleteMany({ where: { userId: req.params.id } }),
        prisma.userRole.createMany({ data: roles.map(r => ({ userId: req.params.id, roleId: r.id, grantedBy: req.user!.userId })) }),
      ]);
      await createAuditLog(req, { action: AuditAction.PERMISSION_CHANGE, entityType: 'User', entityId: user.id, description: `Updated roles for: ${user.email}` });
      res.json({ success: true, message: 'Roles updated' });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.params.id, deletedAt: null } });
      if (!user) throw createError('User not found', 404, 'NOT_FOUND');
      if (req.params.id === req.user!.userId) throw createError('Cannot delete your own account', 400, 'SELF_DELETE');
      await prisma.user.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), status: 'SUSPENDED' } });
      await createAuditLog(req, { action: AuditAction.DELETE, entityType: 'User', entityId: user.id, description: `Deleted user: ${user.email}` });
      res.json({ success: true, message: 'User deleted' });
    } catch (err) { next(err); }
  }

  async getRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await prisma.role.findMany({ include: { rolePermissions: { include: { permission: true } } } });
      res.json({ success: true, data: roles });
    } catch (err) { next(err); }
  }

  async getPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
      res.json({ success: true, data: permissions });
    } catch (err) { next(err); }
  }
}
export const usersController = new UsersController();
