// Guard: only send real emails when RESEND_API_KEY is set
// Lazy-load Resend to avoid import issues in test environments
let _resend: import('resend').Resend | null = null;
async function getResend(): Promise<import('resend').Resend | null> {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) {
    const { Resend } = await import('resend');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}
const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'rndvx <noreply@rndvx.app>';

// Brand colors from style guide
const LIME = '#9BD770';
const CORAL = '#FF705D';
const CHARCOAL = '#1A1A1A';
const CREAM = '#F5F1E4';

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};font-family:Raleway,sans-serif;color:${CHARCOAL};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
          <tr>
            <td style="background:${CHARCOAL};padding:24px 32px;">
              <span style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;color:${LIME};">rndvx</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="background:${CREAM};padding:16px 32px;font-size:12px;color:#888;text-align:center;">
              You're receiving this because you have an account on rndvx.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(label: string, href: string, color = CORAL): string {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#fff;font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:24px;">${label}</a>`;
}

async function send(to: string, subject: string, html: string): Promise<void> {
  const resend = await getResend();
  if (!resend) {
    console.log(`[email] DEV (no RESEND_API_KEY) → ${to} | ${subject}`);
    return;
  }
  await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
}

export async function sendMeetingCreated(
  to: string,
  meetingTitle: string,
  meetingDateTime: Date,
): Promise<void> {
  const dateStr = meetingDateTime.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = meetingDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const html = baseTemplate(`Meeting Created: ${meetingTitle}`, `
    <h2 style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;margin:0 0 8px;">${meetingTitle}</h2>
    <p style="font-size:16px;margin:0 0 4px;"><strong>When:</strong> ${dateStr} at ${timeStr}</p>
    <p style="font-size:16px;color:#555;margin:0 0 16px;">Your meeting has been created. Share the invite link so your crew can RSVP.</p>
    ${ctaButton('View Meeting', `${process.env.CLIENT_URL ?? 'http://localhost:5173'}/meetings`, LIME)}
  `);
  await send(to, `Meeting created: ${meetingTitle}`, html);
}

export async function sendRsvpConfirmation(
  to: string,
  meetingTitle: string,
  rsvpStatus: string,
): Promise<void> {
  const label = rsvpStatus === 'YES' ? "You're in!" : rsvpStatus === 'NO' ? "You've declined" : 'Response recorded';
  const color = rsvpStatus === 'YES' ? LIME : CORAL;
  const html = baseTemplate(`RSVP: ${meetingTitle}`, `
    <h2 style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;margin:0 0 8px;">${label}</h2>
    <p style="font-size:16px;color:#555;margin:0 0 16px;">Your RSVP for <strong>${meetingTitle}</strong> has been recorded as <strong>${rsvpStatus}</strong>.</p>
    ${ctaButton('View Meeting', `${process.env.CLIENT_URL ?? 'http://localhost:5173'}/meetings`, color)}
  `);
  await send(to, `RSVP confirmed for ${meetingTitle}`, html);
}

export async function sendMeetingConfirmed(
  to: string,
  meetingTitle: string,
  meetingDateTime: Date,
): Promise<void> {
  const dateStr = meetingDateTime.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = meetingDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const html = baseTemplate(`It's on! ${meetingTitle}`, `
    <h2 style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;margin:0 0 8px;">It's confirmed 🎉</h2>
    <p style="font-size:16px;margin:0 0 4px;"><strong>${meetingTitle}</strong> has hit quorum and is officially on.</p>
    <p style="font-size:16px;color:#555;margin:0 0 16px;"><strong>When:</strong> ${dateStr} at ${timeStr}</p>
    ${ctaButton('View Details', `${process.env.CLIENT_URL ?? 'http://localhost:5173'}/meetings`, LIME)}
  `);
  await send(to, `Confirmed: ${meetingTitle} is happening!`, html);
}

export async function sendMeetingCancelled(
  to: string,
  meetingTitle: string,
): Promise<void> {
  const html = baseTemplate(`Cancelled: ${meetingTitle}`, `
    <h2 style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;margin:0 0 8px;">Meeting cancelled</h2>
    <p style="font-size:16px;color:#555;margin:0 0 16px;"><strong>${meetingTitle}</strong> has been cancelled by the organizer.</p>
    ${ctaButton('Browse Meetings', `${process.env.CLIENT_URL ?? 'http://localhost:5173'}/meetings`, CORAL)}
  `);
  await send(to, `Cancelled: ${meetingTitle}`, html);
}

export async function sendMeetingReminder(
  to: string,
  meetingTitle: string,
  meetingDateTime: Date,
): Promise<void> {
  const dateStr = meetingDateTime.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = meetingDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const html = baseTemplate(`Reminder: ${meetingTitle}`, `
    <h2 style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;margin:0 0 8px;">Don't forget!</h2>
    <p style="font-size:16px;margin:0 0 4px;"><strong>${meetingTitle}</strong> is coming up.</p>
    <p style="font-size:16px;color:#555;margin:0 0 16px;"><strong>When:</strong> ${dateStr} at ${timeStr}</p>
    ${ctaButton('View Details', `${process.env.CLIENT_URL ?? 'http://localhost:5173'}/meetings`, LIME)}
  `);
  await send(to, `Reminder: ${meetingTitle} is coming up`, html);
}

export async function sendInvite(
  to: string,
  senderName: string,
  meetingTitle: string | null,
  groupName: string | null,
  inviteToken: string,
): Promise<void> {
  const subject = meetingTitle
    ? `${senderName} invited you to ${meetingTitle}`
    : `${senderName} invited you to join a group`;
  const context = meetingTitle
    ? `join <strong>${meetingTitle}</strong>`
    : `join the group <strong>${groupName ?? 'a group'}</strong>`;
  const html = baseTemplate(subject, `
    <h2 style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;margin:0 0 8px;">You're invited!</h2>
    <p style="font-size:16px;color:#555;margin:0 0 16px;"><strong>${senderName}</strong> has invited you to ${context} on rndvx.</p>
    ${ctaButton('Accept Invite', `${process.env.CLIENT_URL ?? 'http://localhost:5173'}/invites/${inviteToken}`, LIME)}
  `);
  await send(to, subject, html);
}
