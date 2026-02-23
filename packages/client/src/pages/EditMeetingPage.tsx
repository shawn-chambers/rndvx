import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMeetings } from '../hooks/useMeetings';
import { useMeeting } from '../hooks/useMeeting';
import { useAuth } from '../hooks/useAuth';
import type { UpdateMeetingPayload, RecurrenceRule } from '@rndvx/types';

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

function toDatetimeLocal(date: Date | string): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditMeetingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { meeting, fetch } = useMeeting(id ?? '');
  const { update, status, error } = useMeetings();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [quorumThreshold, setQuorumThreshold] = useState(3);
  const [recurrence, setRecurrence] = useState<RecurrenceRule>('NONE');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (id) fetch();
  }, [id]);

  useEffect(() => {
    if (meeting && !initialized) {
      setTitle(meeting.title);
      setDescription(meeting.description ?? '');
      setDateTime(toDatetimeLocal(meeting.dateTime));
      setDurationMinutes(meeting.durationMinutes);
      setQuorumThreshold(meeting.quorumThreshold);
      setRecurrence(meeting.recurrence);
      setInitialized(true);
    }
  }, [meeting, initialized]);

  const isOrganizer = user?.id === meeting?.organizerId;
  const isSubmitting = status === 'loading';

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);

      if (!id) return;
      if (!title.trim()) {
        setSubmitError('Title is required.');
        return;
      }

      const payload: UpdateMeetingPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        dateTime,
        durationMinutes,
        quorumThreshold,
        recurrence,
      };

      const result = await update(id, payload);

      if (result.meta.requestStatus === 'rejected') {
        setSubmitError((result as { error?: { message?: string } }).error?.message ?? 'Failed to update meeting.');
        return;
      }

      navigate(`/meetings/${id}`);
    },
    [id, title, description, dateTime, durationMinutes, quorumThreshold, recurrence, update, navigate],
  );

  if (!meeting) {
    return (
      <div className="min-h-dvh bg-cream px-4 pt-8">
        <div className="mx-auto max-w-lg space-y-4" aria-busy="true">
          <div className="h-7 w-1/2 animate-pulse rounded-md bg-muted" />
          <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-24 w-full animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!isOrganizer) {
    return (
      <div className="min-h-dvh bg-cream px-4 pt-8">
        <div className="mx-auto max-w-lg text-center">
          <p className="font-heading text-lg font-semibold text-charcoal">Not authorized</p>
          <p className="mt-2 font-body text-sm text-charcoal/50">
            Only the meeting organizer can edit this meeting.
          </p>
          <Link
            to={`/meetings/${id}`}
            className="mt-4 inline-block font-body text-sm text-sky sm:hover:underline"
          >
            Back to meeting
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-cream px-4 pb-12 pt-8">
      <div className="mx-auto max-w-lg">
        <Link
          to={`/meetings/${id}`}
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
          <h1 className="mb-6 font-heading text-2xl font-bold text-charcoal">Edit meeting</h1>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Field label="Title" htmlFor="title">
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-lg border border-muted bg-white px-4 py-3 font-body text-base text-charcoal placeholder:text-charcoal/30 focus:border-sky focus:outline-none"
              />
            </Field>

            <Field label="Description" htmlFor="description">
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-muted bg-white px-4 py-3 font-body text-base text-charcoal placeholder:text-charcoal/30 focus:border-sky focus:outline-none"
              />
            </Field>

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
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
