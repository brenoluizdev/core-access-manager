import { User } from './users.model';
import { InferCreationAttributes } from 'sequelize';

export async function findAll() {
  return User.findAll();
}

export async function findByEmail(email: string) {
  return User.findOne({ where: { email } });
}

export async function create(data: InferCreationAttributes<User>) {
  return User.create(data);
}