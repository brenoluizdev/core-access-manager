import { Request, Response } from 'express';
import * as userService from './users.service';

export async function list(req: Request, res: Response) {
  const users = await userService.list();
  return res.json(users);
}

export async function create(req: Request, res: Response) {
  try {
    const user = await userService.create(req.body);
    return res.status(201).json(user);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
}