import { Router } from 'express';
import { productsController as c } from './products.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', c.list.bind(c));
router.post('/', authorize('msme:create'), c.create.bind(c));
router.put('/:id', authorize('msme:update'), c.update.bind(c));
router.post('/:id/approve', authorize('msme:approve'), c.approve.bind(c));
router.delete('/:id', authorize('msme:delete'), c.delete.bind(c));
export default router;
