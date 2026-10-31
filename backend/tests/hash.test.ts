import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from '../src/utils/hash';

describe('hash de senha', () => {
  it('gera hashes diferentes para a mesma senha (salt aleatório)', async () => {
    const first = await hashPassword('senha-segura-123');
    const second = await hashPassword('senha-segura-123');

    expect(first).not.toBe(second);
    expect(first.startsWith('scrypt$')).toBe(true);
  });

  it('valida a senha correta', async () => {
    const hash = await hashPassword('senha-segura-123');

    await expect(verifyPassword('senha-segura-123', hash)).resolves.toBe(true);
  });

  it('rejeita senha incorreta', async () => {
    const hash = await hashPassword('senha-segura-123');

    await expect(verifyPassword('outra-senha', hash)).resolves.toBe(false);
  });

  it('rejeita hash em formato desconhecido', async () => {
    await expect(verifyPassword('senha', 'bcrypt$abc$def')).resolves.toBe(false);
    await expect(verifyPassword('senha', 'lixo')).resolves.toBe(false);
  });
});
