import { AppError } from '../../errors';
import { verifyPassword } from '../../utils/hash';
import { signToken } from '../../utils/jwt';
import { parseEmail, parsePassword } from '../../utils/validation';
import { type PublicUser, toPublicUser } from '../users/users.model';
import { usersRepository } from '../users/users.repository';
import { type CreateUserInput, usersService } from '../users/users.service';

export interface AuthResult {
  token: string;
  user: PublicUser;
}

export const authService = {
  async register(input: CreateUserInput): Promise<AuthResult> {
    const user = await usersService.create(input);
    const token = signToken({ sub: user.id, role: user.role });

    return { token, user };
  },

  async login(input: { email?: unknown; password?: unknown }): Promise<AuthResult> {
    const email = parseEmail(input.email);
    const password = parsePassword(input.password);
    const user = usersRepository.findByEmail(email);

    // Mesma mensagem para e-mail inexistente e senha errada: evita enumeração.
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new AppError(401, 'Credenciais inválidas.', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError(403, 'Esta conta está desativada.', 'ACCOUNT_DISABLED');
    }

    const token = signToken({ sub: user.id, role: user.role });

    return { token, user: toPublicUser(user) };
  },
};
