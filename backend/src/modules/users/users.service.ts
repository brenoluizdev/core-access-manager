import { AppError } from '../../errors';
import { hashPassword } from '../../utils/hash';
import { parseEmail, parseName, parsePassword, parseRole } from '../../utils/validation';
import { type PublicUser, type UserRole, toPublicUser } from './users.model';
import { type ListOptions, usersRepository } from './users.repository';

export interface CreateUserInput {
  name: unknown;
  email: unknown;
  password: unknown;
  role?: unknown;
}

export interface UpdateUserInput {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  role?: unknown;
  isActive?: unknown;
}

export interface Actor {
  id: string;
  role: UserRole;
}

export const usersService = {
  /**
   * O primeiro usuário cadastrado vira ADMIN (bootstrap).
   * Os seguintes entram como USER, a menos que um ADMIN os promova.
   */
  async create(input: CreateUserInput): Promise<PublicUser> {
    const name = parseName(input.name);
    const email = parseEmail(input.email);
    const password = parsePassword(input.password);
    const isFirstUser = usersRepository.countAll() === 0;
    const role = isFirstUser ? 'ADMIN' : parseRole(input.role);

    if (usersRepository.findByEmail(email)) {
      throw new AppError(409, 'Já existe um usuário com este e-mail.', 'EMAIL_IN_USE');
    }

    const passwordHash = await hashPassword(password);

    return toPublicUser(usersRepository.create({ name, email, passwordHash, role }));
  },

  /** Cadastro feito por um ADMIN: nunca promove o primeiro usuário por acidente. */
  async createAsAdmin(input: CreateUserInput): Promise<PublicUser> {
    const name = parseName(input.name);
    const email = parseEmail(input.email);
    const password = parsePassword(input.password);
    const role = parseRole(input.role);

    if (usersRepository.findByEmail(email)) {
      throw new AppError(409, 'Já existe um usuário com este e-mail.', 'EMAIL_IN_USE');
    }

    const passwordHash = await hashPassword(password);

    return toPublicUser(usersRepository.create({ name, email, passwordHash, role }));
  },

  list(options: ListOptions) {
    const { items, total } = usersRepository.list(options);

    return {
      items: items.map(toPublicUser),
      meta: {
        page: options.page,
        perPage: options.perPage,
        total,
        totalPages: Math.max(1, Math.ceil(total / options.perPage)),
      },
    };
  },

  findById(id: string, actor: Actor): PublicUser {
    const user = usersRepository.findById(id);

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado.', 'USER_NOT_FOUND');
    }

    const isAdmin = actor.role === 'ADMIN';
    const isSelf = actor.id === user.id;

    if (!isAdmin && !isSelf) {
      throw new AppError(403, 'Sem permissão para acessar este usuário.', 'FORBIDDEN');
    }

    return toPublicUser(user);
  },

  async update(id: string, input: UpdateUserInput, actor: Actor): Promise<PublicUser> {
    const current = usersRepository.findById(id);

    if (!current) {
      throw new AppError(404, 'Usuário não encontrado.', 'USER_NOT_FOUND');
    }

    const isAdmin = actor.role === 'ADMIN';
    const isSelf = actor.id === current.id;

    if (!isAdmin && !isSelf) {
      throw new AppError(403, 'Sem permissão para alterar este usuário.', 'FORBIDDEN');
    }

    if (!isAdmin && (input.role !== undefined || input.isActive !== undefined)) {
      throw new AppError(
        403,
        'Apenas administradores podem alterar perfil ou status.',
        'FORBIDDEN',
      );
    }

    const patch: {
      name?: string;
      email?: string;
      passwordHash?: string;
      role?: UserRole;
      isActive?: boolean;
    } = {};

    if (input.name !== undefined) patch.name = parseName(input.name);

    if (input.email !== undefined) {
      const email = parseEmail(input.email);
      const owner = usersRepository.findByEmail(email);

      if (owner && owner.id !== id) {
        throw new AppError(409, 'Já existe um usuário com este e-mail.', 'EMAIL_IN_USE');
      }

      patch.email = email;
    }

    if (input.password !== undefined) {
      patch.passwordHash = await hashPassword(parsePassword(input.password));
    }

    if (input.role !== undefined) patch.role = parseRole(input.role, current.role);

    if (input.isActive !== undefined) {
      patch.isActive = Boolean(input.isActive);
    }

    if (isSelf && patch.isActive === false) {
      throw new AppError(
        422,
        'Você não pode desativar a própria conta.',
        'INVALID_OPERATION',
      );
    }

    if (isSelf && patch.role === 'USER' && current.role === 'ADMIN') {
      throw new AppError(
        422,
        'Você não pode remover o próprio acesso de administrador.',
        'INVALID_OPERATION',
      );
    }

    const updated = usersRepository.update(id, patch);

    if (!updated) {
      throw new AppError(404, 'Usuário não encontrado.', 'USER_NOT_FOUND');
    }

    return toPublicUser(updated);
  },

  remove(id: string, actor: Actor): void {
    if (actor.id === id) {
      throw new AppError(
        422,
        'Você não pode excluir a própria conta.',
        'INVALID_OPERATION',
      );
    }

    const user = usersRepository.findById(id);

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado.', 'USER_NOT_FOUND');
    }

    usersRepository.remove(id);
  },
};
