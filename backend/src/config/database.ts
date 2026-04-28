import { Sequelize } from 'sequelize';

const {
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
} = process.env;

if (!DB_NAME || !DB_USER || !DB_PASSWORD) {
  throw new Error('❌ Variáveis de ambiente do banco não definidas');
}

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST || 'localhost',
  dialect: 'postgres',
  logging: false,
});

export default sequelize;