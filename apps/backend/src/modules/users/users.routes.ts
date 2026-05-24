import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', authorize('user:read'), usersController.list.bind(usersController));
router.get('/roles', authorize('user:read'), usersController.getRoles.bind(usersController));
router.get('/permissions', authorize('role:manage'), usersController.getPermissions.bind(usersController));
router.get('/:id', authorize('user:read'), usersController.getById.bind(usersController));
router.post('/', authorize('user:create'), usersController.create.bind(usersController));
router.put('/:id', authorize('user:update'), usersController.update.bind(usersController));
router.put('/:id/roles', authorize('role:manage'), usersController.updateRoles.bind(usersController));
router.delete('/:id', authorize('user:delete'), usersController.delete.bind(usersController));
export default router;
