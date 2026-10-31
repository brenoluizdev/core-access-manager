import type { NextFunction, Request, Response } from 'express';

import { parseBoolean, parseId, parsePositiveInt, parseOptionalString } from '../../utils/validation';
import { usersService } from './users.service';

export const usersController = {
  async list(req: Request, res: Response): Promise<void> {
    const page = parsePositiveInt(req.query.page, 1);
    const perPage = parsePositiveInt(req.query.perPage, 10, { max: 100 });
    const search = parseOptionalString(req.query.search);

    const result = usersService.list({ page, perPage, search });

    res.status(200).json(result);
  },

  async show(req: Request, res: Response): Promise<void> {
    const id = parseId(req.params.id);
    const user = usersService.findById(id, req.user!);

    res.status(200).json({ user });
  },

  async store(req: Request, res: Response): Promise<void> {
    const user = await usersService.createAsAdmin(req.body ?? {});

    res.status(201).json({ user });
  },

  async update(req: Request, res: Response): Promise<void> {
    const id = parseId(req.params.id);
    const body = req.body ?? {};

    const user = await usersService.update(
      id,
      {
        name: body.name,
        email: body.email,
        password: body.password,
        role: body.role,
        isActive: parseBoolean(body.isActive),
      },
      req.user!,
    );

    res.status(200).json({ user });
  },

  async destroy(req: Request, res: Response): Promise<void> {
    const id = parseId(req.params.id);

    usersService.remove(id, req.user!);

    res.status(204).send();
  },
};

export type UsersController = typeof usersController;
export type ControllerHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;
