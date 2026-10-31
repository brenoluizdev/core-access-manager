import request from 'supertest';

import app from '../src/app';

export { app, request };

export interface Credentials {
  name: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'USER';
}

export function auth(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export function register(payload: Partial<Credentials>) {
  return request(app)
    .post('/api/auth/register')
    .send({
      name: 'Usuário de Teste',
      email: 'teste@example.com',
      password: 'senha-segura-123',
      ...payload,
    });
}

export function login(email: string, password: string) {
  return request(app).post('/api/auth/login').send({ email, password });
}

export async function createUserAsAdmin(
  token: string,
  payload: Partial<Credentials> & { isActive?: boolean },
) {
  return request(app)
    .post('/api/users')
    .set(auth(token))
    .send({
      name: 'Novo Usuário',
      email: `user-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      password: 'senha-segura-123',
      role: 'USER',
      ...payload,
    });
}
