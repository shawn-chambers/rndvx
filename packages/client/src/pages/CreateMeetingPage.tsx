import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMeetings } from '../hooks/useMeetings';
import { useInvites } from '../hooks/useInvites';
import type { CreateMeetingPayload, RecurrenceRule } from '@rndvx/types';

const RECURRENCE_OPTIONS: { value: RecurrenceRule; label: string }[] = [
  { value: 'NONE', label: 'No recurrence' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Every 2 weeks' },
  { value: 'MONTHLY', label: 'Monthly' },
];

function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block font-body text-sm font-medium text-charcoal">
        {label}
      </label>
      {children}
      {hint && <p className="font-body text-xs text-charcoal/50">{hint}</p>}
    </div>
  );
}

export default function CreateMeetingPage() {
  const navigate = useNavigate();
  const { create, status, error } = useMeetings();
  const { send } = useInvites();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [quorumThreshold, setQuorumThreshold] = useState(3);
  const [recurrence, setRecurrence] = useState<RecurrenceRule>('NONE');
  const [inviteEmails, setInviteEmails] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isSubmitting = status === 'loading';

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);

      if (!title.trim()) {
        setSubmitError('Title is required.');
        return;
      }
      if (!dateTime) {
        setSubmitError('Date and time are required.');
        return;
      }

      const payload: CreateMeetingPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        dateTime,
        durationMinutes,
        quorumThreshold,
        recurrence,
      };

      const result = await create(payload);

      if (result.meta.requestStatus === 'rejected') {
        setSubmitError((result as { error?: { message?: string } }).error?.message ?? 'Failed to create meeting.');
        return;
      }

      // Send invites if emails provided
      const meetingId = (result.payload as { id?: string })?.id;
      if (meetingId && inviteEmails.trim()) {
        const emails = inviteEmails
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean);
        await Promise.allSettled(
          emails.map((email) => send({ inviteeEmail: email, meetingId })),
        );
      }

      navigate('/');
    },
    [title, description, dateTime, durationMinutes, quorumThreshold, recurrence, inviteEmails, create, send, navigate],
  );

  return (
    <div className="min-h-dvh bg-cream px-4 pb-12 pt-8">
      <div className="mx-auto max-w-lg">
        <Link
          to="/"
          className="mb-5 inline-flex min-h-[44px] items-center gap-1.5 font-body text-sm text-charcoal/60 active:opacity-70 sm:hover:text-charcoal"
        >
          <span aria-hidden="true">←</span>
          Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h1 className="mb-6 font-heading text-2xl font-bold text-charcoal">New meeting</h1>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Title */}
            <Field label="Title" htmlFor="title">
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Friday hangout"
                required
                className="w-full rounded-lg border border-muted bg-white px-4 py-3 font-body text-base text-charcoal placeholder:text-charcoal/30 focus:border-sky focus:outline-none"
              />
            </Field>

            {/* Description */}
            <Field label="Description" htmlFor="description">
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this meetup about?"
                rows={3}
                className="w-full resize-none rounded-lg border border-muted bg-white px-4 py-3 font-body text-base text-charcoal placeholder:text-charcoal/30 focus:border-sky focus:outline-none"
              />
            </Field>

            {/* Date & time */}
            <Field label="Date & time" htmlFor="dateTime">
              <input
                id="dateTime"
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                required
                className="w-full rounded-lg border border-muted bg-white px-4 py-3 font-body text-base text-charcoal focus:border-sky focus:outline-none"
              />
            </Field>

            {/* Duration */}
            <Field label="Duration (minutes)" htmlFor="durationMinutes">
              <input
                id="durationMinutes"
                type="number"
                min={15}
                max={480}
                step={15}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-muted bg-white px-4 py-3 font-body text-base text-charcoal focus:border-sky focus:outline-none"
              />
            </Field>

            {/* Quorum */}
            <Field
              label="Quorum threshold"
              htmlFor="quorum"
              hint="Minimum RSVPs needed to confirm this meeting."
            >
              <input
                id="quorum"
                type="number"
                min={0}
                max={100}
                value={quorumThreshold}
                onChange={(e) => setQuorumThreshold(Number(e.target.value))}
                className="w-full rounded-lg border border-muted bg-white px-4 py-3 font-body text-base text-charcoal focus:border-sky focus:outline-none"
              />
            </Field>

            {/* Recurrence */}
            <Field label="Recurrence" htmlFor="recurrence">
              <select
                id="recurrence"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceRule)}
                className="w-full rounded-lg border border-muted bg-white px-4 py-3 font-body text-base text-charcoal focus:border-sky focus:outline-none"
              >
                {RECURRENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>

            {/* Invite section */}
            <div className="rounded-lg border border-muted bg-white px-4 py-4">
              <p className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-charcoal/40">
                Invite people
              </p>
              <Field
                label="Email addresses"
                htmlFor="inviteEmails"
                hint="Comma-separated list of emails to invite."
              >
                <input
                  id="inviteEmails"
                  type="text"
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                  placeholder="alice@example.com, bob@example.com"
                  className="w-full rounded-lg border border-muted bg-white px-4 py-3 font-body text-base text-charcoal placeholder:text-charcoal/30 focus:border-sky focus:outline-none"
                />
              </Field>
            </div>

            {/* Errors */}
            {(submitError ?? error) && (
              <p role="alert" className="font-body text-sm text-coral">
                {submitError ?? error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] w-full rounded-lg bg-lime px-6 py-3 font-heading text-base font-semibold text-white active:opacity-80 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating…' : 'Create meeting'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
