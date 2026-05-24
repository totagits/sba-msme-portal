import { Router } from 'express';
import { auditController } from './audit.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
router.use(authenticate, authorize('audit:read'));
router.get('/', auditController.list.bind(auditController));
router.get('/:id', auditController.getById.bind(auditController));
export default router;
