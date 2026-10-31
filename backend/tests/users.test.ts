import { beforeAll, describe, expect, it } from 'vitest';

import { app, auth, createUserAsAdmin, login, register, request } from './helpers';

let adminToken = '';
let adminId = '';
let memberToken = '';
let memberId = '';

beforeAll(async () => {
  const admin = await register({
    name: 'Admin',
    email: 'admin@example.com',
    password: 'senha-segura-123',
  });

  adminToken = admin.body.token;
  adminId = admin.body.user.id;

  const member = await register({
    name: 'Membro',
    email: 'membro@example.com',
    password: 'senha-segura-123',
  });

  memberToken = member.body.token;
  memberId = member.body.user.id;
});

describe('GET /api/users', () => {
  it('lista usuários com paginação para ADMIN', async () => {
    const response = await request(app).get('/api/users').set(auth(adminToken));

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.meta).toMatchObject({ page: 1, perPage: 10, total: 2 });
    expect(response.body.items[0].passwordHash).toBeUndefined();
  });

  it('filtra por termo de busca', async () => {
    const response = await request(app)
      .get('/api/users?search=membro')
      .set(auth(adminToken));

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].email).toBe('membro@example.com');
  });

  it('bloqueia USER comum', async () => {
    const response = await request(app).get('/api/users').set(auth(memberToken));

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('exige autenticação', async () => {
    const response = await request(app).get('/api/users');

    expect(response.status).toBe(401);
  });
});

describe('POST /api/users', () => {
  it('permite que ADMIN crie outro ADMIN', async () => {
    const response = await createUserAsAdmin(adminToken, {
      name: 'Outro Admin',
      email: 'outro-admin@example.com',
      role: 'ADMIN',
    });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('ADMIN');
  });

  it('bloqueia criação por USER comum', async () => {
    const response = await createUserAsAdmin(memberToken, {
      email: 'proibido@example.com',
    });

    expect(response.status).toBe(403);
  });

  it('rejeita e-mail já cadastrado', async () => {
    const response = await createUserAsAdmin(adminToken, {
      email: 'membro@example.com',
    });

    expect(response.status).toBe(409);
  });

  it('rejeita perfil inválido', async () => {
    const response = await createUserAsAdmin(adminToken, {
      email: 'perfil-invalido@example.com',
      role: 'SUPERADMIN' as 'ADMIN',
    });

    expect(response.status).toBe(422);
  });
});

describe('GET /api/users/:id', () => {
  it('ADMIN acessa qualquer usuário', async () => {
    const response = await request(app)
      .get(`/api/users/${memberId}`)
      .set(auth(adminToken));

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(memberId);
  });

  it('USER acessa o próprio perfil', async () => {
    const response = await request(app)
      .get(`/api/users/${memberId}`)
      .set(auth(memberToken));

    expect(response.status).toBe(200);
  });

  it('USER não acessa o perfil de terceiros', async () => {
    const response = await request(app)
      .get(`/api/users/${adminId}`)
      .set(auth(memberToken));

    expect(response.status).toBe(403);
  });

  it('devolve 404 para id inexistente', async () => {
    const response = await request(app)
      .get('/api/users/00000000-0000-4000-8000-000000000000')
      .set(auth(adminToken));

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('USER_NOT_FOUND');
  });

  it('rejeita id fora do formato UUID', async () => {
    const response = await request(app)
      .get('/api/users/abc')
      .set(auth(adminToken));

    expect(response.status).toBe(422);
  });
});

describe('PATCH /api/users/:id', () => {
  it('USER atualiza o próprio nome', async () => {
    const response = await request(app)
      .patch(`/api/users/${memberId}`)
      .set(auth(memberToken))
      .send({ name: 'Membro Atualizado' });

    expect(response.status).toBe(200);
    expect(response.body.user.name).toBe('Membro Atualizado');
  });

  it('USER não pode se promover a ADMIN', async () => {
    const response = await request(app)
      .patch(`/api/users/${memberId}`)
      .set(auth(memberToken))
      .send({ role: 'ADMIN' });

    expect(response.status).toBe(403);
  });

  it('ADMIN promove um USER', async () => {
    const created = await createUserAsAdmin(adminToken, {
      email: 'promovido@example.com',
    });

    const response = await request(app)
      .patch(`/api/users/${created.body.user.id}`)
      .set(auth(adminToken))
      .send({ role: 'ADMIN' });

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe('ADMIN');
  });

  it('impede e-mail duplicado na atualização', async () => {
    const response = await request(app)
      .patch(`/api/users/${memberId}`)
      .set(auth(adminToken))
      .send({ email: 'admin@example.com' });

    expect(response.status).toBe(409);
  });

  it('permite troca de senha e o novo login funciona', async () => {
    const created = await createUserAsAdmin(adminToken, {
      email: 'senha@example.com',
    });

    const response = await request(app)
      .patch(`/api/users/${created.body.user.id}`)
      .set(auth(adminToken))
      .send({ password: 'outra-senha-456' });

    expect(response.status).toBe(200);

    const logged = await login('senha@example.com', 'outra-senha-456');
    expect(logged.status).toBe(200);
  });

  it('impede o ADMIN de desativar a própria conta', async () => {
    const response = await request(app)
      .patch(`/api/users/${adminId}`)
      .set(auth(adminToken))
      .send({ isActive: false });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('INVALID_OPERATION');
  });

  it('impede o ADMIN de se rebaixar', async () => {
    const response = await request(app)
      .patch(`/api/users/${adminId}`)
      .set(auth(adminToken))
      .send({ role: 'USER' });

    expect(response.status).toBe(422);
  });

  it('conta desativada não autentica e tem o token recusado', async () => {
    const created = await createUserAsAdmin(adminToken, {
      email: 'desativado@example.com',
    });

    const disabledLogin = await login('desativado@example.com', 'senha-segura-123');

    await request(app)
      .patch(`/api/users/${created.body.user.id}`)
      .set(auth(adminToken))
      .send({ isActive: false });

    const blockedLogin = await login('desativado@example.com', 'senha-segura-123');
    expect(blockedLogin.status).toBe(403);
    expect(blockedLogin.body.error.code).toBe('ACCOUNT_DISABLED');

    const blockedRequest = await request(app)
      .get('/api/auth/me')
      .set(auth(disabledLogin.body.token));
    expect(blockedRequest.status).toBe(403);
  });
});

describe('DELETE /api/users/:id', () => {
  it('ADMIN exclui outro usuário', async () => {
    const created = await createUserAsAdmin(adminToken, {
      email: 'excluir@example.com',
    });

    const response = await request(app)
      .delete(`/api/users/${created.body.user.id}`)
      .set(auth(adminToken));

    expect(response.status).toBe(204);

    const lookup = await request(app)
      .get(`/api/users/${created.body.user.id}`)
      .set(auth(adminToken));
    expect(lookup.status).toBe(404);
  });

  it('impede excluir a própria conta', async () => {
    const response = await request(app)
      .delete(`/api/users/${adminId}`)
      .set(auth(adminToken));

    expect(response.status).toBe(422);
  });

  it('bloqueia exclusão por USER comum', async () => {
    const response = await request(app)
      .delete(`/api/users/${adminId}`)
      .set(auth(memberToken));

    expect(response.status).toBe(403);
  });

  it('devolve 404 ao excluir usuário inexistente', async () => {
    const response = await request(app)
      .delete('/api/users/00000000-0000-4000-8000-000000000000')
      .set(auth(adminToken));

    expect(response.status).toBe(404);
  });
});
