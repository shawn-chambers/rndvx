import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import {
  fetchMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  selectAllMeetings,
  selectMeetingsStatus,
  selectMeetingsError,
  selectUpcomingMeetings,
} from '../store/slices/meetingsSlice';
import type { CreateMeetingPayload, UpdateMeetingPayload } from '@rndvx/types';

export function useMeetings() {
  const dispatch = useDispatch<AppDispatch>();
  const meetings = useSelector(selectAllMeetings);
  const upcoming = useSelector(selectUpcomingMeetings);
  const status = useSelector(selectMeetingsStatus);
  const error = useSelector(selectMeetingsError);

  return {
    meetings,
    upcoming,
    status,
    error,
    isLoading: status === 'loading',
    fetch: () => dispatch(fetchMeetings()),
    create: (payload: CreateMeetingPayload) => dispatch(createMeeting(payload)),
    update: (id: string, payload: UpdateMeetingPayload) =>
      dispatch(updateMeeting({ id, payload })),
    remove: (id: string) => dispatch(deleteMeeting(id)),
  };
}
