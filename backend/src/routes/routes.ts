import { Router } from 'express';
import usersRouter from '../modules/users/users.routes';

const router = Router();

router.get('/', (req, res) => {
  res.send('Hello, World!');
});

router.use('/users', usersRouter);

export default router;