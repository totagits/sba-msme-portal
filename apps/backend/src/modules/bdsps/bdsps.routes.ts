import { Router } from 'express';
import { bdspController } from './bdsps.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', authorize('bdsp:read'), bdspController.list.bind(bdspController));
router.get('/map', authorize('bdsp:read'), bdspController.mapData.bind(bdspController));
router.get('/export', authorize('bdsp:read'), bdspController.export.bind(bdspController));
router.get('/:id', authorize('bdsp:read'), bdspController.getById.bind(bdspController));
router.post('/', authorize('bdsp:create'), bdspController.create.bind(bdspController));
router.put('/:id', authorize('bdsp:update'), bdspController.update.bind(bdspController));
router.delete('/:id', authorize('bdsp:delete'), bdspController.delete.bind(bdspController));
router.post('/:id/workflow', authorize('bdsp:approve'), bdspController.workflow.bind(bdspController));
export default router;
