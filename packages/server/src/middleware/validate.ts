import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

const friendlyFieldNames: Record<string, string> = {
  title: 'Title',
  description: 'Description',
  dateTime: 'Date and time',
  durationMinutes: 'Duration',
  quorumThreshold: 'Minimum attendees',
  recurrence: 'Recurrence',
  locationName: 'Location name',
  email: 'Email',
  name: 'Name',
  password: 'Password',
};

function formatFieldErrors(fieldErrors: Record<string, string[] | undefined>): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const [field, errors] of Object.entries(fieldErrors)) {
    if (errors && errors.length > 0) {
      const label = friendlyFieldNames[field] || field;
      formatted[field] = errors.map((e) =>
        e === 'Required' ? `${label} is required` : `${label}: ${e}`
      );
    }
  }
  return formatted;
}

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: formatFieldErrors(result.error.flatten().fieldErrors),
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

// Accepts both full ISO 8601 (2026-03-02T19:00:00.000Z) and datetime-local (2026-03-02T19:00)
const dateTimeString = z.string().refine(
  (val) => !isNaN(new Date(val).getTime()),
  { message: 'Please provide a valid date and time' },
);

export const createMeetingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dateTime: dateTimeString,
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
  dateTime: dateTimeString.optional(),
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

// ─── Invite schemas ────────────────────────────────────────────────────────────

export const createInviteSchema = z.object({
  inviteeEmail: z.string().email(),
  groupId: z.string().optional(),
  meetingId: z.string().optional(),
  expiresAt: dateTimeString.optional(),
});

export const respondInviteSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED']),
});

// ─── Group schemas ─────────────────────────────────────────────────────────────

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
}).refine((data) => data.name !== undefined, {
  message: 'At least one field must be provided',
});

export const addGroupMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
});

export const updateGroupMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});
