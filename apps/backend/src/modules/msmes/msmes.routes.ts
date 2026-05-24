import { Router } from 'express';
import { msmeController } from './msmes.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize('msme:read'), msmeController.list.bind(msmeController));
router.get('/map', authorize('msme:read'), msmeController.mapData.bind(msmeController));
router.get('/export', authorize('msme:export'), msmeController.export.bind(msmeController));
router.get('/:id', authorize('msme:read'), msmeController.getById.bind(msmeController));
router.post('/', authorize('msme:create'), msmeController.create.bind(msmeController));
router.put('/:id', authorize('msme:update'), msmeController.update.bind(msmeController));
router.patch('/:id', authorize('msme:update'), msmeController.update.bind(msmeController));
router.delete('/:id', authorize('msme:delete'), msmeController.delete.bind(msmeController));
router.post('/:id/workflow', authorize('msme:approve'), msmeController.workflow.bind(msmeController));

export default router;
