import { User } from './users.model';

export async function findAll() {
  return User.findAll();
}

export async function findByEmail(email: string) {
  return User.findOne({ where: { email } });
}

export async function create(data: any) {
  return User.create(data);
}