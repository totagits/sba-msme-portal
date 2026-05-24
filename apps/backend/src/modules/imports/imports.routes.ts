import { Router } from 'express';
import { importsController as c } from './imports.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { upload } from '../../middleware/upload';

const router = Router();
router.use(authenticate);
router.get('/', authorize('msme:import'), c.list.bind(c));
router.get('/:id', authorize('msme:import'), c.getById.bind(c));
router.post('/', authorize('msme:import'), upload.single('file'), c.upload.bind(c));
router.post('/:id/rollback', authorize('msme:import'), c.rollback.bind(c));
export default router;
