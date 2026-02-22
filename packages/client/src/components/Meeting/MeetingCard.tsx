import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Meeting, Rsvp } from '@rndvx/types';

interface MeetingCardProps {
  meeting: Meeting;
  rsvps?: Rsvp[];
  currentUserId?: string;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getStatusBadge(status: Meeting['status']): { label: string; className: string } {
  switch (status) {
    case 'CONFIRMED':
      return { label: 'Confirmed', className: 'bg-lime text-white' };
    case 'PENDING_QUORUM':
      return { label: 'Pending', className: 'bg-yellow text-charcoal' };
    case 'CANCELLED':
      return { label: 'Cancelled', className: 'bg-muted text-charcoal/60' };
    default:
      return { label: 'Draft', className: 'bg-muted text-charcoal/60' };
  }
}

export function MeetingCard({ meeting, rsvps = [], currentUserId }: MeetingCardProps) {
  const yesCount = rsvps.filter((r) => r.status === 'YES').length;
  const myRsvp = currentUserId ? rsvps.find((r) => r.userId === currentUserId) : undefined;
  const badge = getStatusBadge(meeting.status);

  const quorumPct = meeting.quorumThreshold > 0
    ? Math.min(100, Math.round((yesCount / meeting.quorumThreshold) * 100))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Link
        to={`/meetings/${meeting.id}`}
        className="block rounded-lg bg-white p-4 shadow-sm active:opacity-80 sm:hover:shadow-md sm:transition-shadow"
        aria-label={`View details for ${meeting.title}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-heading text-lg font-semibold text-charcoal">
              {meeting.title}
            </h2>
            <p className="mt-0.5 font-body text-sm text-charcoal/60">
              {formatDate(meeting.dateTime)}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-sm px-2 py-0.5 font-body text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>

        {meeting.locationName && (
          <p className="mt-2 flex items-center gap-1.5 font-body text-sm text-charcoal/70">
            <span aria-hidden="true">📍</span>
            {meeting.locationName}
          </p>
        )}

        {meeting.description && (
          <p className="mt-2 line-clamp-2 font-body text-sm text-charcoal/60">
            {meeting.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="font-body text-sm font-medium text-charcoal">
              {yesCount}
              {meeting.quorumThreshold > 0 && (
                <span className="text-charcoal/50">/{meeting.quorumThreshold}</span>
              )}{' '}
              going
            </span>
            {meeting.quorumThreshold > 0 && (
              <div
                className="h-1.5 w-20 overflow-hidden rounded-sm bg-muted"
                role="progressbar"
                aria-valuenow={quorumPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${quorumPct}% quorum reached`}
              >
                <div
                  className="h-full rounded-sm bg-lime transition-all duration-500"
                  style={{ width: `${quorumPct}%` }}
                />
              </div>
            )}
          </div>

          {myRsvp && (
            <span
              className={`font-body text-xs font-medium ${
                myRsvp.status === 'YES'
                  ? 'text-lime'
                  : myRsvp.status === 'NO'
                    ? 'text-coral'
                    : 'text-charcoal/50'
              }`}
            >
              {myRsvp.status === 'YES' ? "You're in" : myRsvp.status === 'NO' ? "You're out" : 'Undecided'}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
