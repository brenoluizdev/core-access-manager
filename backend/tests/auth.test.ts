import { describe, expect, it } from 'vitest';

import { app, auth, login, register, request } from './helpers';

describe('GET /api/health', () => {
  it('responde com status ok', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});

describe('POST /api/auth/register', () => {
  it('cria o primeiro usuário como ADMIN e devolve token', async () => {
    const response = await register({
      name: 'Breno Luiz',
      email: 'breno@example.com',
      password: 'senha-segura-123',
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      name: 'Breno Luiz',
      email: 'breno@example.com',
      role: 'ADMIN',
      isActive: true,
    });
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.body.user.password_hash).toBeUndefined();
  });

  it('cria os usuários seguintes como USER', async () => {
    const response = await register({
      name: 'Segunda Pessoa',
      email: 'segunda@example.com',
      password: 'senha-segura-123',
    });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('USER');
  });

  it('rejeita e-mail duplicado', async () => {
    const response = await register({
      name: 'Duplicado',
      email: 'breno@example.com',
      password: 'senha-segura-123',
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_IN_USE');
  });

  it('rejeita e-mail inválido', async () => {
    const response = await register({ email: 'nao-e-email' });

    expect(response.status).toBe(422);
    expect(response.body.error.details).toMatchObject({ field: 'email' });
  });

  it('rejeita senha curta', async () => {
    const response = await register({
      email: 'curta@example.com',
      password: '123',
    });

    expect(response.status).toBe(422);
    expect(response.body.error.details).toMatchObject({ field: 'password' });
  });

  it('rejeita nome vazio', async () => {
    const response = await register({
      name: '   ',
      email: 'sem-nome@example.com',
    });

    expect(response.status).toBe(422);
    expect(response.body.error.details).toMatchObject({ field: 'name' });
  });
});

describe('POST /api/auth/login', () => {
  it('autentica com credenciais válidas', async () => {
    const response = await login('breno@example.com', 'senha-segura-123');

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user.email).toBe('breno@example.com');
  });

  it('normaliza o e-mail (case-insensitive)', async () => {
    const response = await login('BRENO@Example.com', 'senha-segura-123');

    expect(response.status).toBe(200);
  });

  it('rejeita senha incorreta sem revelar o motivo', async () => {
    const response = await login('breno@example.com', 'senha-errada-123');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(response.body.error.message).toBe('Credenciais inválidas.');
  });

  it('rejeita e-mail inexistente com a mesma mensagem', async () => {
    const response = await login('ninguem@example.com', 'senha-segura-123');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Credenciais inválidas.');
  });
});

describe('GET /api/auth/me', () => {
  it('devolve o usuário autenticado', async () => {
    const { body } = await login('breno@example.com', 'senha-segura-123');
    const response = await request(app).get('/api/auth/me').set(auth(body.token));

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('breno@example.com');
  });

  it('exige token', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('MISSING_TOKEN');
  });

  it('rejeita token inválido', async () => {
    const response = await request(app).get('/api/auth/me').set(auth('token-falso'));

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });
});

describe('erros genéricos', () => {
  it('devolve 404 em rota desconhecida', async () => {
    const response = await request(app).get('/api/inexistente');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('devolve 400 para JSON malformado', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ "email": ');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_JSON');
  });
});
