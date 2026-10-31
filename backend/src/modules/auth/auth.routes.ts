import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.middleware';
import { authController } from './auth.controller';

const authRoutes = Router();

authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.login);
authRoutes.get('/me', authenticate, authController.me);

export default authRoutes;
