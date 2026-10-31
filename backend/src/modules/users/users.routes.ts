import { Router } from 'express';

import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { usersController } from './users.controller';

const usersRoutes = Router();

usersRoutes.use(authenticate);

usersRoutes.get('/', requireRole('ADMIN'), usersController.list);
usersRoutes.get('/:id', usersController.show);
usersRoutes.post('/', requireRole('ADMIN'), usersController.store);
usersRoutes.patch('/:id', usersController.update);
usersRoutes.delete('/:id', requireRole('ADMIN'), usersController.destroy);

export default usersRoutes;
