import { vi } from 'vitest';

// Mock email service globally so tests never emit logs
vi.mock('../services/emailService', () => ({
  sendMeetingCreated: vi.fn().mockResolvedValue(undefined),
  sendRsvpConfirmation: vi.fn().mockResolvedValue(undefined),
  sendMeetingConfirmed: vi.fn().mockResolvedValue(undefined),
  sendMeetingCancelled: vi.fn().mockResolvedValue(undefined),
  sendMeetingReminder: vi.fn().mockResolvedValue(undefined),
}));
