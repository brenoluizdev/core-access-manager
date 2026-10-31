import express from 'express';

import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import routes from './routes/routes';

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
