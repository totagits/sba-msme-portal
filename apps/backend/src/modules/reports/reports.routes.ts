import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', authorize('report:read'), reportsController.list.bind(reportsController));
router.get('/:id', authorize('report:read'), reportsController.getById.bind(reportsController));
router.post('/', authorize('report:generate'), reportsController.generate.bind(reportsController));
router.get('/:id/export', authorize('report:export'), reportsController.exportCSV.bind(reportsController));
export default router;
