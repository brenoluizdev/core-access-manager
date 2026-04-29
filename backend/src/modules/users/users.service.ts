import { InferCreationAttributes } from 'sequelize';
import * as userRepository from './users.repository';
import { User } from './users.model';

export async function list() {
  return userRepository.findAll();
}

export async function create(data: InferCreationAttributes<User>) {
  if (!data.email || !data.password) {
    return Promise.reject(new Error('Email e senha são obrigatórios'));
  }

  const existingUser = await userRepository.findByEmail(data.email);
  if (existingUser) {
    return Promise.reject(new Error('Usuário já existe'));
  }

  return userRepository.create(data);
}