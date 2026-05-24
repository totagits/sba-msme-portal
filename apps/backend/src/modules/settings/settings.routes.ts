import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', authorize('settings:read'), settingsController.getAll.bind(settingsController));
router.put('/:key', authorize('settings:update'), settingsController.update.bind(settingsController));
router.get('/counties', settingsController.getCounties.bind(settingsController));
router.post('/counties', authorize('settings:update'), settingsController.createCounty.bind(settingsController));
router.put('/counties/:id', authorize('settings:update'), settingsController.updateCounty.bind(settingsController));
router.get('/sectors', settingsController.getSectors.bind(settingsController));
router.post('/sectors', authorize('settings:update'), settingsController.createSector.bind(settingsController));
router.get('/districts', settingsController.getDistricts.bind(settingsController));
router.post('/districts', authorize('settings:update'), settingsController.createDistrict.bind(settingsController));
export default router;
