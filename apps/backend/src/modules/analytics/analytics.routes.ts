import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
router.use(authenticate, authorize('analytics:read'));
router.get('/dashboard', analyticsController.getDashboard.bind(analyticsController));
router.get('/msmes-by-county', analyticsController.msmesByCounty.bind(analyticsController));
router.get('/msmes-by-sector', analyticsController.msmesBySector.bind(analyticsController));
router.get('/msmes-by-category', analyticsController.msmesByCategory.bind(analyticsController));
router.get('/msmes-by-status', analyticsController.msmesByStatus.bind(analyticsController));
router.get('/monthly-registrations', analyticsController.monthlyRegistrations.bind(analyticsController));
router.get('/data-quality', analyticsController.dataQuality.bind(analyticsController));
export default router;
