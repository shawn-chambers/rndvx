import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.getProfile(req.user!.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email } = req.body;
    const user = await userService.updateProfile(req.user!.userId, { name, email });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
