import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import {
  fetchMeeting,
  fetchMeetingRsvps,
  selectMeetingById,
  selectRsvpsByMeetingId,
} from '../store/slices/meetingsSlice';

export function useMeeting(id: string) {
  const dispatch = useDispatch<AppDispatch>();
  const meeting = useSelector((state: RootState) => selectMeetingById(state, id));
  const rsvps = useSelector((state: RootState) => selectRsvpsByMeetingId(state, id));

  return {
    meeting,
    rsvps,
    fetch: () => dispatch(fetchMeeting(id)),
    fetchRsvps: () => dispatch(fetchMeetingRsvps(id)),
  };
}
