import { Request, Response, NextFunction } from 'express';
import * as placesService from '../services/placesService';

export async function searchPlaces(req: Request, res: Response, next: NextFunction) {
  try {
    const query = String(req.query.q ?? '');
    if (!query.trim()) {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }
    const places = await placesService.searchPlaces(query);
    res.json({ places });
  } catch (err) {
    next(err);
  }
}

export async function getPlaceDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const place = await placesService.getPlaceDetails(req.params.placeId);
    res.json({ place });
  } catch (err) {
    next(err);
  }
}

export async function autoPickLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const place = await placesService.autoPickLocation(req.params.meetingId);
    res.json({ place });
  } catch (err) {
    next(err);
  }
}
