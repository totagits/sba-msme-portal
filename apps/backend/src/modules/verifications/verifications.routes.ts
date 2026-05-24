import { Router } from 'express';
import { verificationsController as c } from './verifications.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', authorize('msme:verify'), c.list.bind(c));
router.get('/:id', authorize('msme:verify'), c.getById.bind(c));
router.post('/', authorize('msme:verify'), c.create.bind(c));
router.put('/:id', authorize('msme:verify'), c.update.bind(c));
export default router;
