import * as userRepository from './users.repository';

export async function list() {
  return userRepository.findAll();
}

export async function create(data: any) {
  if (!data.email) {
    throw new Error('Email é obrigatório');
  }

  const existingUser = await userRepository.findByEmail(data.email);
  if (existingUser) {
    throw new Error('Usuário já existe');
  }

  return userRepository.create(data);
}