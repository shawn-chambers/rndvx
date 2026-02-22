import { motion, AnimatePresence } from 'framer-motion';
import type { RsvpStatus } from '@rndvx/types';

interface RsvpButtonProps {
  currentStatus: RsvpStatus | undefined;
  isSubmitting: boolean;
  onRsvp: (status: RsvpStatus) => void;
}

interface RsvpOption {
  status: RsvpStatus;
  label: string;
  activeClass: string;
  inactiveClass: string;
}

const OPTIONS: RsvpOption[] = [
  {
    status: 'YES',
    label: "I'm in",
    activeClass: 'bg-lime text-white',
    inactiveClass: 'bg-white text-charcoal/60 border border-muted',
  },
  {
    status: 'NO',
    label: "I'm out",
    activeClass: 'bg-coral text-white',
    inactiveClass: 'bg-white text-charcoal/60 border border-muted',
  },
  {
    status: 'MAYBE',
    label: 'Maybe',
    activeClass: 'bg-lavender text-charcoal',
    inactiveClass: 'bg-white text-charcoal/60 border border-muted',
  },
];

export function RsvpButton({ currentStatus, isSubmitting, onRsvp }: RsvpButtonProps) {
  return (
    <div className="flex gap-2" role="group" aria-label="RSVP options">
      {OPTIONS.map(({ status, label, activeClass, inactiveClass }) => {
        const isActive = currentStatus === status;
        return (
          <motion.button
            key={status}
            type="button"
            onClick={() => onRsvp(status)}
            disabled={isSubmitting}
            aria-pressed={isActive}
            whileTap={{ scale: 0.95 }}
            className={`relative min-h-[44px] flex-1 overflow-hidden rounded-lg font-heading text-sm font-semibold transition-colors duration-300 disabled:opacity-50 ${
              isActive ? activeClass : inactiveClass
            }`}
          >
            <AnimatePresence initial={false}>
              {isActive && (
                <motion.span
                  key="active-bg"
                  layoutId={`rsvp-active-${status}`}
                  className="absolute inset-0 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </AnimatePresence>
            <span className="relative z-10">{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
