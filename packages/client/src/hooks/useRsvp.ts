import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import {
  upsertRsvp,
  fetchMeetingRsvps,
  selectMyRsvp,
  selectRsvpsByMeetingId,
  selectRsvpStatus,
  selectRsvpError,
} from '../store/slices/meetingsSlice';
import type { RsvpStatus } from '@rndvx/types';

export function useRsvp(meetingId: string, userId: string) {
  const dispatch = useDispatch<AppDispatch>();
  const myRsvp = useSelector((state: RootState) => selectMyRsvp(state, meetingId, userId));
  const allRsvps = useSelector((state: RootState) => selectRsvpsByMeetingId(state, meetingId));
  const rsvpStatus = useSelector(selectRsvpStatus);
  const rsvpError = useSelector(selectRsvpError);

  // On RSVP error, re-fetch to restore server state (rollback optimistic update)
  useEffect(() => {
    if (rsvpStatus === 'failed') {
      dispatch(fetchMeetingRsvps(meetingId));
    }
  }, [rsvpStatus, meetingId, dispatch]);

  return {
    myRsvp,
    allRsvps,
    rsvpStatus,
    rsvpError,
    isSubmitting: rsvpStatus === 'loading',
    rsvp: (status: RsvpStatus) => dispatch(upsertRsvp({ meetingId, status })),
  };
}
