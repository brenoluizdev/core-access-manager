import request from 'supertest';
import app from '../app';
import sequelize from '../config/database';

describe('Users API', () => {
  beforeAll(async () => {
    await sequelize.sync();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('deve criar um usuário', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        name: 'Breno',
        email: `breno_${Date.now()}@email.com`,
        password: 'senha123',
      });

    console.log(response.body);

    expect(response.status).toBe(201);
  });

  it('deve falhar sem email', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        name: 'Breno',
      });

    expect(response.status).toBe(400);
  });
});