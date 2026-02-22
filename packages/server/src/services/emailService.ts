// Email service stubs — replace with real email provider (Resend, SendGrid, etc.)

export async function sendMeetingCreated(
  to: string,
  meetingTitle: string,
  meetingDateTime: Date,
): Promise<void> {
  // TODO: integrate email provider
  console.log(`[email] meetingCreated → ${to}: "${meetingTitle}" at ${meetingDateTime.toISOString()}`);
}

export async function sendRsvpConfirmation(
  to: string,
  meetingTitle: string,
  rsvpStatus: string,
): Promise<void> {
  // TODO: integrate email provider
  console.log(`[email] rsvpConfirmation → ${to}: "${meetingTitle}" status=${rsvpStatus}`);
}

export async function sendMeetingConfirmed(
  to: string,
  meetingTitle: string,
  meetingDateTime: Date,
): Promise<void> {
  // TODO: integrate email provider
  console.log(`[email] meetingConfirmed → ${to}: "${meetingTitle}" at ${meetingDateTime.toISOString()}`);
}

export async function sendMeetingCancelled(
  to: string,
  meetingTitle: string,
): Promise<void> {
  // TODO: integrate email provider
  console.log(`[email] meetingCancelled → ${to}: "${meetingTitle}"`);
}

export async function sendMeetingReminder(
  to: string,
  meetingTitle: string,
  meetingDateTime: Date,
): Promise<void> {
  // TODO: integrate email provider
  console.log(`[email] meetingReminder → ${to}: "${meetingTitle}" at ${meetingDateTime.toISOString()}`);
}
