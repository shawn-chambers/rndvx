import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useMeetings } from '../hooks/useMeetings';
import { MeetingCard } from '../components/Meeting/MeetingCard';
import { MeetingCardSkeleton } from '../components/Meeting/MeetingCardSkeleton';

const SKELETON_COUNT = 3;

export default function HomePage() {
  const { user, logout } = useAuth();
  const { upcoming, status, error, fetch } = useMeetings();

  useEffect(() => {
    fetch();
  }, []);

  return (
    <div className="min-h-dvh bg-cream px-4 pb-12 pt-8">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-charcoal">
              Hey, {user?.name?.split(' ')[0] ?? 'friend'} 👋
            </h1>
            <p className="mt-0.5 font-body text-sm text-charcoal/50">
              Here&apos;s what&apos;s coming up
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="min-h-[44px] rounded-lg px-4 py-2 font-body text-sm text-charcoal/50 active:opacity-70 sm:hover:text-charcoal"
              aria-label="Profile"
            >
              Profile
            </Link>
            <button
              type="button"
              onClick={logout}
              className="min-h-[44px] rounded-lg px-4 py-2 font-body text-sm text-charcoal/50 active:opacity-70 sm:hover:text-charcoal"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* New meeting CTA */}
        <Link
          to="/meetings/new"
          className="mb-5 flex min-h-[44px] items-center justify-center rounded-lg bg-lime px-6 py-3 font-heading text-sm font-semibold text-white active:opacity-80"
        >
          + New meeting
        </Link>

        {/* Feed */}
        <section aria-label="Upcoming meetings">
          {/* Loading skeleton */}
          {status === 'loading' && (
            <div className="space-y-3" aria-busy="true" aria-label="Loading meetings">
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <MeetingCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error state */}
          {status === 'failed' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg border border-coral/30 bg-white px-4 py-6 text-center"
              role="alert"
            >
              <p className="font-body text-sm text-coral">{error ?? 'Failed to load meetings.'}</p>
              <button
                type="button"
                onClick={() => fetch()}
                className="mt-3 min-h-[44px] rounded-lg bg-coral px-6 py-2 font-heading text-sm font-semibold text-white active:opacity-80"
              >
                Try again
              </button>
            </motion.div>
          )}

          {/* Empty state */}
          {status === 'succeeded' && upcoming.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-white px-4 py-10 text-center"
            >
              <p className="font-heading text-4xl">📅</p>
              <p className="mt-3 font-heading text-lg font-semibold text-charcoal">
                No upcoming meetings
              </p>
              <p className="mt-1 font-body text-sm text-charcoal/50">
                Nothing&apos;s planned yet. Check back soon!
              </p>
            </motion.div>
          )}

          {/* Meeting cards */}
          {status === 'succeeded' && upcoming.length > 0 && (
            <div className="space-y-3">
              {upcoming.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
