import { Router } from 'express';
import { filesController as c } from './files.controller';
import { authenticate } from '../../middleware/auth';
import { upload } from '../../middleware/upload';

const router = Router();
router.use(authenticate);
router.get('/', c.list.bind(c));
router.post('/', upload.single('file'), c.upload.bind(c));
router.get('/:filename', c.download.bind(c));
export default router;
