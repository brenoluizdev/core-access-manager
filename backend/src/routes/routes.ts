import { Router } from 'express';

import authRoutes from '../modules/auth/auth.routes';
import usersRoutes from '../modules/users/users.routes';

const routes = Router();

routes.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

routes.use('/auth', authRoutes);
routes.use('/users', usersRoutes);

export default routes;
