import { Request, Response, NextFunction } from 'express';
import * as meetingService from '../services/meetingService';
import * as rsvpService from '../services/rsvpService';

export async function listMeetings(req: Request, res: Response, next: NextFunction) {
  try {
    const meetings = await meetingService.listMeetings(req.user!.userId);
    res.json({ meetings });
  } catch (err) {
    next(err);
  }
}

export async function getMeeting(req: Request, res: Response, next: NextFunction) {
  try {
    const meeting = await meetingService.getMeeting(req.params.id);
    res.json({ meeting });
  } catch (err) {
    next(err);
  }
}

export async function createMeeting(req: Request, res: Response, next: NextFunction) {
  try {
    const meeting = await meetingService.createMeeting(req.user!.userId, req.body);
    res.status(201).json({ meeting });
  } catch (err) {
    next(err);
  }
}

export async function updateMeeting(req: Request, res: Response, next: NextFunction) {
  try {
    const meeting = await meetingService.updateMeeting(req.params.id, req.user!.userId, req.body);
    res.json({ meeting });
  } catch (err) {
    next(err);
  }
}

export async function deleteMeeting(req: Request, res: Response, next: NextFunction) {
  try {
    await meetingService.deleteMeeting(req.params.id, req.user!.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function upsertRsvp(req: Request, res: Response, next: NextFunction) {
  try {
    const rsvp = await rsvpService.upsertRsvp(req.params.id, req.user!.userId, req.body.status);
    res.json({ rsvp });
  } catch (err) {
    next(err);
  }
}

export async function getRsvps(req: Request, res: Response, next: NextFunction) {
  try {
    const rsvps = await rsvpService.getRsvpsForMeeting(req.params.id);
    res.json({ rsvps });
  } catch (err) {
    next(err);
  }
}

export async function deleteRsvp(req: Request, res: Response, next: NextFunction) {
  try {
    await rsvpService.deleteRsvp(req.params.id, req.user!.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
