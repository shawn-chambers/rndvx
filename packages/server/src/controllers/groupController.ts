import { Request, Response, NextFunction } from 'express';
import * as groupService from '../services/groupService';

export async function listGroups(req: Request, res: Response, next: NextFunction) {
  try {
    const groups = await groupService.listGroups(req.user!.userId);
    res.json({ groups });
  } catch (err) {
    next(err);
  }
}

export async function getGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const group = await groupService.getGroup(req.params.id, req.user!.userId);
    res.json({ group });
  } catch (err) {
    next(err);
  }
}

export async function createGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const group = await groupService.createGroup(req.user!.userId, req.body);
    res.status(201).json({ group });
  } catch (err) {
    next(err);
  }
}

export async function updateGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const group = await groupService.updateGroup(req.params.id, req.user!.userId, req.body);
    res.json({ group });
  } catch (err) {
    next(err);
  }
}

export async function deleteGroup(req: Request, res: Response, next: NextFunction) {
  try {
    await groupService.deleteGroup(req.params.id, req.user!.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function addMember(req: Request, res: Response, next: NextFunction) {
  try {
    const member = await groupService.addMember(req.params.id, req.user!.userId, req.body);
    res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
}

export async function updateMemberRole(req: Request, res: Response, next: NextFunction) {
  try {
    const member = await groupService.updateMemberRole(
      req.params.id,
      req.user!.userId,
      req.params.memberId,
      req.body.role,
    );
    res.json({ member });
  } catch (err) {
    next(err);
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    await groupService.removeMember(req.params.id, req.user!.userId, req.params.memberId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
