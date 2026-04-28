import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.send('List users');
});

router.post('/', (req, res) => {
  res.send('Create user');
});

export default router;