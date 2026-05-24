import { Router } from 'express';
import { syncController as c } from './sync.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.post('/sync', c.syncRecords.bind(c));
router.post('/session', c.startSession.bind(c));
router.patch('/session/:id', c.endSession.bind(c));
export default router;
