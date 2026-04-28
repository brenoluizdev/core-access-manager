import { Router } from 'express';
import * as userController from './users.controller';

const router = Router();

router.get('/', userController.list);
router.post('/', userController.create);

export default router;