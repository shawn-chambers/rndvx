import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useMeeting } from '../hooks/useMeeting';
import { useRsvp } from '../hooks/useRsvp';
import { RsvpButton } from '../components/Meeting/RsvpButton';
import type { MeetingStatus, RsvpStatus } from '@rndvx/types';

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function StatusChip({ status }: { status: MeetingStatus }) {
  const map: Record<MeetingStatus, { label: string; className: string }> = {
    CONFIRMED: { label: 'Confirmed', className: 'bg-lime text-white' },
    PENDING_QUORUM: { label: 'Pending quorum', className: 'bg-yellow text-charcoal' },
    CANCELLED: { label: 'Cancelled', className: 'bg-muted text-charcoal/60' },
    DRAFT: { label: 'Draft', className: 'bg-muted text-charcoal/60' },
  };
  const { label, className } = map[status];
  return (
    <span className={`rounded-sm px-2.5 py-1 font-body text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading meeting details">
      <div className="h-7 w-3/4 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted" />
      <div className="h-24 w-full animate-pulse rounded-lg bg-muted" />
      <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { meeting, rsvps, fetch, fetchRsvps } = useMeeting(id ?? '');
  const { myRsvp, isSubmitting, rsvpStatus, rsvpError, rsvp } = useRsvp(
    id ?? '',
    user?.id ?? '',
  );

  useEffect(() => {
    if (id) {
      fetch();
      fetchRsvps();
    }
  }, [id]);

  const yesRsvps = rsvps.filter((r) => r.status === 'YES');
  const quorumPct =
    meeting && meeting.quorumThreshold > 0
      ? Math.min(100, Math.round((yesRsvps.length / meeting.quorumThreshold) * 100))
      : 0;

  if (!meeting && rsvpStatus !== 'loading') {
    return (
      <div className="min-h-dvh bg-cream px-4 pt-8">
        <div className="mx-auto max-w-lg">
          <BackLink />
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-cream px-4 pb-12 pt-8">
      <div className="mx-auto max-w-lg">
        <BackLink />

        {!meeting ? (
          <LoadingSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-4"
          >
            {/* Title + status */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <h1 className="font-heading text-2xl font-bold text-charcoal">{meeting.title}</h1>
                <StatusChip status={meeting.status} />
              </div>
              <p className="mt-1 font-body text-sm text-charcoal/60">
                {formatDate(meeting.dateTime)}
                {' · '}
                {formatDuration(meeting.durationMinutes)}
              </p>
            </div>

            {/* Location */}
            {meeting.locationName && (
              <div className="rounded-lg bg-white px-4 py-3">
                <p className="font-body text-xs font-medium uppercase tracking-wide text-charcoal/40">
                  Location
                </p>
                <p className="mt-0.5 font-body text-sm text-charcoal">{meeting.locationName}</p>
                {meeting.locationAddress && (
                  <p className="font-body text-xs text-charcoal/50">{meeting.locationAddress}</p>
                )}
              </div>
            )}

            {/* Description */}
            {meeting.description && (
              <div className="rounded-lg bg-white px-4 py-3">
                <p className="font-body text-xs font-medium uppercase tracking-wide text-charcoal/40">
                  About
                </p>
                <p className="mt-0.5 font-body text-sm text-charcoal">{meeting.description}</p>
              </div>
            )}

            {/* Quorum progress */}
            {meeting.quorumThreshold > 0 && (
              <div className="rounded-lg bg-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-body text-xs font-medium uppercase tracking-wide text-charcoal/40">
                    Quorum
                  </p>
                  <p className="font-body text-sm font-medium text-charcoal">
                    {yesRsvps.length}
                    <span className="text-charcoal/40">/{meeting.quorumThreshold}</span>
                  </p>
                </div>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-sm bg-muted"
                  role="progressbar"
                  aria-valuenow={quorumPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Quorum ${quorumPct}% reached`}
                >
                  <motion.div
                    className="h-full rounded-sm bg-lime"
                    initial={{ width: 0 }}
                    animate={{ width: `${quorumPct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}

            {/* RSVP */}
            {user && (
              <div className="rounded-lg bg-white px-4 py-4">
                <p className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-charcoal/40">
                  Your RSVP
                </p>
                <RsvpButton
                  currentStatus={myRsvp?.status as RsvpStatus | undefined}
                  isSubmitting={isSubmitting}
                  onRsvp={rsvp}
                />
                {rsvpError && (
                  <p role="alert" className="mt-2 font-body text-xs text-coral">
                    {rsvpError}
                  </p>
                )}
              </div>
            )}

            {/* Attendee list */}
            <div className="rounded-lg bg-white px-4 py-3">
              <p className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-charcoal/40">
                Attendees ({rsvps.length})
              </p>
              {rsvps.length === 0 ? (
                <p className="font-body text-sm text-charcoal/40">No RSVPs yet</p>
              ) : (
                <ul className="space-y-2">
                  {rsvps.map((r) => (
                    <li key={r.id} className="flex items-center justify-between">
                      <span className="font-body text-sm text-charcoal">
                        {r.userId === user?.id ? 'You' : r.userId}
                      </span>
                      <span
                        className={`font-body text-xs font-medium ${
                          r.status === 'YES'
                            ? 'text-lime'
                            : r.status === 'NO'
                              ? 'text-coral'
                              : 'text-charcoal/40'
                        }`}
                      >
                        {r.status === 'YES' ? 'Going' : r.status === 'NO' ? 'Not going' : r.status === 'MAYBE' ? 'Maybe' : 'Pending'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/"
      className="mb-5 inline-flex min-h-[44px] items-center gap-1.5 font-body text-sm text-charcoal/60 active:opacity-70 sm:hover:text-charcoal"
      aria-label="Back to meetings"
    >
      <span aria-hidden="true">←</span>
      Back
    </Link>
  );
}
