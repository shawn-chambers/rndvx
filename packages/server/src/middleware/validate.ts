import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
}).refine((data) => data.name !== undefined || data.email !== undefined, {
  message: 'At least one field (name or email) must be provided',
});

const recurrenceValues = ['NONE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'] as const;
const meetingStatusValues = ['DRAFT', 'PENDING_QUORUM', 'CONFIRMED', 'CANCELLED'] as const;

export const createMeetingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dateTime: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  quorumThreshold: z.number().int().min(1).max(100).optional(),
  recurrence: z.enum(recurrenceValues).optional(),
  locationName: z.string().max(200).optional(),
  locationAddress: z.string().max(500).optional(),
  locationPlaceId: z.string().max(500).optional(),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  dateTime: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  quorumThreshold: z.number().int().min(1).max(100).optional(),
  recurrence: z.enum(recurrenceValues).optional(),
  locationName: z.string().max(200).optional(),
  locationAddress: z.string().max(500).optional(),
  locationPlaceId: z.string().max(500).optional(),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  status: z.enum(meetingStatusValues).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

export const rsvpSchema = z.object({
  status: z.enum(['PENDING', 'YES', 'NO', 'MAYBE']),
});
