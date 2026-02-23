import { Request, Response, NextFunction } from 'express';
import * as inviteService from '../services/inviteService';

export async function listInvites(req: Request, res: Response, next: NextFunction) {
  try {
    const invites = await inviteService.listInvites(req.user!.userId);
    res.json({ invites });
  } catch (err) {
    next(err);
  }
}

export async function getInviteByToken(req: Request, res: Response, next: NextFunction) {
  try {
    const invite = await inviteService.getInviteByToken(req.params.token);
    res.json({ invite });
  } catch (err) {
    next(err);
  }
}

export async function createInvite(req: Request, res: Response, next: NextFunction) {
  try {
    const invite = await inviteService.createInvite(req.user!.userId, req.body);
    res.status(201).json({ invite });
  } catch (err) {
    next(err);
  }
}

export async function respondToInvite(req: Request, res: Response, next: NextFunction) {
  try {
    const invite = await inviteService.respondToInvite(
      req.params.token,
      req.user!.userId,
      req.body.status,
    );
    res.json({ invite });
  } catch (err) {
    next(err);
  }
}

export async function deleteInvite(req: Request, res: Response, next: NextFunction) {
  try {
    await inviteService.deleteInvite(req.params.id, req.user!.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
