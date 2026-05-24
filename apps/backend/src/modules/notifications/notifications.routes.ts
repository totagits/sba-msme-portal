import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', notificationsController.list.bind(notificationsController));
router.get('/count', notificationsController.getUnreadCount.bind(notificationsController));
router.patch('/read-all', notificationsController.markAllRead.bind(notificationsController));
router.patch('/:id/read', notificationsController.markRead.bind(notificationsController));
router.delete('/:id', notificationsController.delete.bind(notificationsController));
export default router;
