import { Router } from 'express';
import { opportunitiesController as c } from './opportunities.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', c.list.bind(c));
router.get('/:id', c.getById.bind(c));
router.post('/', c.create.bind(c));
router.put('/:id', c.update.bind(c));
router.delete('/:id', c.delete.bind(c));
router.post('/:id/matches', c.addMatch.bind(c));
router.patch('/:id/matches/:matchId', c.updateMatch.bind(c));
export default router;
