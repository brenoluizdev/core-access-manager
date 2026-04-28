import express from 'express';
import routes from './routes/routes';
import sequelize from './config/database';

const app = express();

app.use(express.json());
app.use('/api', routes);

sequelize.authenticate()
  .then(() => console.log('Database connected...'))
  .catch(err => console.log('Error: ' + err));

export default app;